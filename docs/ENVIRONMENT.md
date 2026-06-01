# Environment

## Expo Public Variables

Create a local `.env` from `.env.example`. These values are public to the mobile app bundle:

```sh
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_REVENUECAT_API_KEY=
EXPO_PUBLIC_APP_ENV=development
```

Optional app metadata:

```sh
EXPO_PUBLIC_EAS_PROJECT_ID=
EXPO_PUBLIC_IOS_BUNDLE_ID=com.dialedself.app
EXPO_PUBLIC_ANDROID_PACKAGE=com.dialedself.app
```

## Server-Only Secrets

These belong in Supabase Edge Function secrets or provider dashboards. Do not commit them to the repo:

- `OPENAI_API_KEY`
- `OPENAI_SCORING_MODEL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REVENUECAT_WEBHOOK_AUTH`
- Twilio Account SID, Auth Token, and messaging configuration
- `DIALED_INTERNAL_FUNCTION_TOKEN`

## Local Notes

- The Supabase anon key is public, but it should still live in local `.env`, not committed source files.
- Service role keys must never be placed in Expo public variables.
- Twilio credentials are managed inside Supabase Auth and should not be used by the native app.
