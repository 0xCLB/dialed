type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export function track(event: string, properties: AnalyticsProperties = {}) {
  if (__DEV__) {
    console.log(`[analytics] ${event}`, properties);
  }
}

export function identify(userId: string, properties: AnalyticsProperties = {}) {
  if (__DEV__) {
    console.log(`[analytics] identify ${userId}`, properties);
  }
}
