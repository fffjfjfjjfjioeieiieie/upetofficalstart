// Keep user-facing and trusted backend limits in one place.
export const RATE_LIMITS = Object.freeze({
  profileSaveDelayMs: 1400,
  profileViewWindowMs: 15 * 60 * 1000,
  pageEventDedupMs: 60 * 1000,
  featureEventDedupMs: 1000,
  usernameChangeWindowMs: 2 * 60 * 60 * 1000,
  imageUploads: { max: 10, windowMs: 10 * 60 * 1000 },
  audioUploads: { max: 3, windowMs: 10 * 60 * 1000 },
  publicAnalytics: { max: 600, windowMs: 60 * 1000 },
  publicProfileEvents: { max: 120, windowMs: 60 * 1000 },
  donationCheckout: { max: 12, windowMs: 10 * 60 * 1000 },
});
