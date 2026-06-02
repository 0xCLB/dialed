-- Dialed Self Daily Proof Economy v1.
-- Apply after the core schema/policies. This migration is intentionally additive.

create table if not exists public.proof_wallets (
  user_id uuid not null references public.profiles(id) on delete cascade,
  proof_date date not null default current_date,
  base_proofs integer not null default 5 check (base_proofs >= 0),
  bonus_proofs integer not null default 0 check (bonus_proofs >= 0),
  used_proofs integer not null default 0 check (used_proofs >= 0),
  remaining_proofs integer generated always as (
    greatest(base_proofs + bonus_proofs - used_proofs, 0)
  ) stored,
  tier text not null default 'free' check (tier in ('free', 'pro')),
  updated_at timestamptz not null default now(),
  primary key (user_id, proof_date),
  unique (user_id, proof_date)
);

create table if not exists public.proof_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  proof_date date not null,
  entry_id uuid references public.entries(id) on delete set null,
  transaction_type text not null check (transaction_type in ('spend', 'earn', 'refund', 'reset')),
  amount integer not null check (amount > 0),
  reason text not null check (char_length(reason) between 1 and 120),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (user_id, proof_date)
    references public.proof_wallets(user_id, proof_date)
    on delete cascade
);

create index if not exists proof_transactions_user_date_idx
  on public.proof_transactions (user_id, proof_date, created_at desc);

create index if not exists proof_transactions_entry_idx
  on public.proof_transactions (entry_id)
  where entry_id is not null;

create unique index if not exists proof_transactions_entry_spend_unique_idx
  on public.proof_transactions (user_id, entry_id)
  where transaction_type = 'spend' and entry_id is not null;

create unique index if not exists proof_transactions_daily_earn_reason_unique_idx
  on public.proof_transactions (user_id, proof_date, reason)
  where transaction_type = 'earn'
    and reason in (
      'share_card',
      'fully_dialed_tomorrow',
      'three_day_streak_tomorrow',
      'invite_signup'
    );

create unique index if not exists proof_transactions_daily_reset_unique_idx
  on public.proof_transactions (user_id, proof_date, reason)
  where transaction_type = 'reset' and reason = 'daily_reset';

drop trigger if exists set_proof_wallets_updated_at on public.proof_wallets;
create trigger set_proof_wallets_updated_at
before update on public.proof_wallets
for each row execute function public.set_updated_at();

alter table public.proof_wallets enable row level security;
alter table public.proof_transactions enable row level security;

drop policy if exists "proof_wallets_select_own" on public.proof_wallets;
create policy "proof_wallets_select_own"
on public.proof_wallets for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "proof_transactions_select_own" on public.proof_transactions;
create policy "proof_transactions_select_own"
on public.proof_transactions for select
to authenticated
using (user_id = auth.uid());

revoke all on public.proof_wallets from anon, authenticated;
revoke all on public.proof_transactions from anon, authenticated;
grant select on public.proof_wallets to authenticated;
grant select on public.proof_transactions to authenticated;

create or replace function public.current_proof_tier(target_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when exists (
      select 1
      from public.subscriptions s
      where s.user_id = target_user_id
        and s.status in ('active', 'trialing')
        and (s.current_period_end is null or s.current_period_end > now())
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = target_user_id
        and p.is_pro
    )
    then 'pro'
    else 'free'
  end;
$$;

create or replace function public.initialize_today_proof_wallet(
  p_proof_date date default current_date
)
returns public.proof_wallets
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_tier text;
  v_base_proofs integer;
  v_wallet public.proof_wallets;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_tier := public.current_proof_tier(v_user_id);
  v_base_proofs := case when v_tier = 'pro' then 20 else 5 end;

  insert into public.proof_wallets (
    user_id,
    proof_date,
    base_proofs,
    bonus_proofs,
    used_proofs,
    tier
  )
  values (
    v_user_id,
    p_proof_date,
    v_base_proofs,
    0,
    0,
    v_tier
  )
  on conflict (user_id, proof_date) do update
    set base_proofs = excluded.base_proofs,
        tier = excluded.tier,
        updated_at = now()
  returning * into v_wallet;

  insert into public.proof_transactions (
    user_id,
    proof_date,
    transaction_type,
    amount,
    reason,
    metadata
  )
  values (
    v_user_id,
    p_proof_date,
    'reset',
    v_base_proofs,
    'daily_reset',
    jsonb_build_object('tier', v_tier)
  )
  on conflict do nothing;

  return v_wallet;
end;
$$;

create or replace function public.spend_proof_for_entry(
  p_entry_id uuid
)
returns public.proof_wallets
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_proof_date date := current_date;
  v_wallet public.proof_wallets;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.entries e
    where e.id = p_entry_id
      and e.user_id = v_user_id
      and e.status <> 'deleted'
      and coalesce(e.metadata->>'proof_consumption', 'spend') not in ('free', 'system')
  ) then
    raise exception 'Entry is not spendable by this user';
  end if;

  if exists (
    select 1
    from public.proof_transactions t
    where t.user_id = v_user_id
      and t.entry_id = p_entry_id
      and t.transaction_type = 'spend'
  ) then
    select *
    into v_wallet
    from public.proof_wallets w
    where w.user_id = v_user_id
      and w.proof_date = v_proof_date;

    if v_wallet.user_id is null then
      v_wallet := public.initialize_today_proof_wallet(v_proof_date);
    end if;

    return v_wallet;
  end if;

  perform public.initialize_today_proof_wallet(v_proof_date);

  select *
  into v_wallet
  from public.proof_wallets w
  where w.user_id = v_user_id
    and w.proof_date = v_proof_date
  for update;

  if v_wallet.remaining_proofs < 1 then
    raise exception 'No Daily Proofs remaining';
  end if;

  update public.proof_wallets
  set used_proofs = used_proofs + 1,
      updated_at = now()
  where user_id = v_user_id
    and proof_date = v_proof_date
  returning * into v_wallet;

  insert into public.proof_transactions (
    user_id,
    proof_date,
    entry_id,
    transaction_type,
    amount,
    reason,
    metadata
  )
  values (
    v_user_id,
    v_proof_date,
    p_entry_id,
    'spend',
    1,
    'entry_submission',
    jsonb_build_object('entry_id', p_entry_id)
  );

  return v_wallet;
end;
$$;

create or replace function public.earn_bonus_proof(
  p_reason text,
  p_proof_date date default current_date,
  p_metadata jsonb default '{}'::jsonb
)
returns public.proof_wallets
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_wallet public.proof_wallets;
  v_bonus_cap integer;
  v_current_bonus integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_reason not in (
    'share_card',
    'fully_dialed_tomorrow',
    'three_day_streak_tomorrow',
    'invite_signup'
  ) then
    raise exception 'Unsupported bonus proof reason';
  end if;

  v_wallet := public.initialize_today_proof_wallet(p_proof_date);
  v_bonus_cap := case when v_wallet.tier = 'pro' then 5 else 3 end;

  select bonus_proofs
  into v_current_bonus
  from public.proof_wallets
  where user_id = v_user_id
    and proof_date = p_proof_date
  for update;

  if exists (
    select 1
    from public.proof_transactions t
    where t.user_id = v_user_id
      and t.proof_date = p_proof_date
      and t.transaction_type = 'earn'
      and t.reason = p_reason
  ) or v_current_bonus >= v_bonus_cap then
    select *
    into v_wallet
    from public.proof_wallets
    where user_id = v_user_id
      and proof_date = p_proof_date;

    return v_wallet;
  end if;

  update public.proof_wallets
  set bonus_proofs = least(bonus_proofs + 1, v_bonus_cap),
      updated_at = now()
  where user_id = v_user_id
    and proof_date = p_proof_date
  returning * into v_wallet;

  insert into public.proof_transactions (
    user_id,
    proof_date,
    transaction_type,
    amount,
    reason,
    metadata
  )
  values (
    v_user_id,
    p_proof_date,
    'earn',
    1,
    p_reason,
    p_metadata
  )
  on conflict do nothing;

  return v_wallet;
end;
$$;

create or replace function public.refund_proof_for_entry(
  p_entry_id uuid,
  p_reason text default 'entry_refund'
)
returns public.proof_wallets
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_spend public.proof_transactions;
  v_wallet public.proof_wallets;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_spend
  from public.proof_transactions t
  where t.user_id = v_user_id
    and t.entry_id = p_entry_id
    and t.transaction_type = 'spend'
  order by t.created_at desc
  limit 1;

  if v_spend.id is null then
    raise exception 'No Proof spend found for this entry';
  end if;

  if exists (
    select 1
    from public.proof_transactions t
    where t.user_id = v_user_id
      and t.entry_id = p_entry_id
      and t.transaction_type = 'refund'
  ) then
    select *
    into v_wallet
    from public.proof_wallets
    where user_id = v_user_id
      and proof_date = v_spend.proof_date;

    return v_wallet;
  end if;

  update public.proof_wallets
  set used_proofs = greatest(used_proofs - 1, 0),
      updated_at = now()
  where user_id = v_user_id
    and proof_date = v_spend.proof_date
  returning * into v_wallet;

  insert into public.proof_transactions (
    user_id,
    proof_date,
    entry_id,
    transaction_type,
    amount,
    reason,
    metadata
  )
  values (
    v_user_id,
    v_spend.proof_date,
    p_entry_id,
    'refund',
    1,
    p_reason,
    jsonb_build_object('entry_id', p_entry_id)
  );

  return v_wallet;
end;
$$;

revoke all on function public.current_proof_tier(uuid) from public;
revoke all on function public.initialize_today_proof_wallet(date) from public;
revoke all on function public.spend_proof_for_entry(uuid) from public;
revoke all on function public.earn_bonus_proof(text, date, jsonb) from public;
revoke all on function public.refund_proof_for_entry(uuid, text) from public;

grant execute on function public.initialize_today_proof_wallet(date) to authenticated;
grant execute on function public.spend_proof_for_entry(uuid) to authenticated;
grant execute on function public.earn_bonus_proof(text, date, jsonb) to authenticated;
grant execute on function public.refund_proof_for_entry(uuid, text) to authenticated;
