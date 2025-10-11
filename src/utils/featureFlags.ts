/**
 * Feature Flags System for OBC Faces
 * Enables safe rollout, A/B testing, and gradual releases with sticky bucketing
 */

export type FlagKey =
  | 'newContestCard'
  | 'turnstileUXv2'
  | 'abNewTheme'
  | 'analyticsV2'
  | 'lazyUpload'
  | 'geoHints'
  | 'smartFilters'
  | 'voteBatchingV2'
  | 'adminCharts'
  | 'profileBadges'
  | 'edgeTranslations'
  | 'auth2FARequired'
  | 'captchaOnLogin'
  | 'cdnImageResize'
  | 'disableLegacyContest'
  | 'feedbackCollector'
  | 'realTimeStats'
  | 'mlPhotoScoring'
  | 'contestInsightsV2';

export type FlagRule = {
  enabled: boolean;
  rollout?: number;        // 0-100 (%)
  roles?: string[];        // ['admin', 'moderator', 'beta']
  users?: string[];        // allowlist userIds/emails
  description?: string;
};

export const FLAGS: Record<FlagKey, FlagRule> = {
  // ✅ Active features
  analyticsV2: {
    enabled: true,
    roles: ['admin', 'moderator'],
    description: 'Advanced analytics dashboard with Recharts',
  },
  adminCharts: {
    enabled: true,
    roles: ['admin'],
    description: 'Admin-only advanced charts',
  },
  edgeTranslations: {
    enabled: true,
    roles: ['admin'],
    description: 'AI-powered automatic translation sync',
  },

  // 🧪 A/B Testing (gradual rollout)
  newContestCard: {
    enabled: true,
    rollout: 30,
    description: 'New contest card UI - 30% rollout',
  },
  abNewTheme: {
    enabled: true,
    rollout: 10,
    description: 'New visual theme A/B test - 10% rollout',
  },
  feedbackCollector: {
    enabled: false,
    rollout: 10,
    description: 'User feedback popup in contest/profile',
  },
  voteBatchingV2: {
    enabled: false,
    rollout: 25,
    description: 'Optimized vote batching system',
  },

  // 🔒 Security & Performance
  turnstileUXv2: {
    enabled: false,
    roles: ['admin'],
    description: 'Updated Turnstile integration',
  },
  auth2FARequired: {
    enabled: false,
    roles: ['admin'],
    description: 'Require 2FA for admin accounts',
  },
  captchaOnLogin: {
    enabled: false,
    description: 'CAPTCHA challenge on login',
  },
  cdnImageResize: {
    enabled: false,
    roles: ['admin'],
    description: 'CDN-based image resizing',
  },

  // ⏸️ Planned features
  lazyUpload: {
    enabled: false,
    description: 'Lazy loading for image uploads',
  },
  geoHints: {
    enabled: false,
    description: 'Geographic hints for better UX',
  },
  smartFilters: {
    enabled: false,
    description: 'ML-powered smart filtering',
  },
  profileBadges: {
    enabled: false,
    description: 'User achievement badges',
  },
  realTimeStats: {
    enabled: false,
    roles: ['admin'],
    description: 'Real-time statistics updates',
  },
  mlPhotoScoring: {
    enabled: false,
    roles: ['admin'],
    description: 'ML-based photo quality scoring',
  },
  contestInsightsV2: {
    enabled: false,
    roles: ['admin'],
    description: 'Enhanced contest analytics',
  },
  disableLegacyContest: {
    enabled: false,
    roles: ['admin'],
    description: 'Disable legacy contest system',
  },
} as const;

/**
 * Simple MurmurHash3 implementation for consistent bucketing
 * Based on: https://github.com/garycourt/murmurhash-js
 */
function murmurhash3(key: string): number {
  let h = 0;
  const len = key.length;
  
  for (let i = 0; i < len; i++) {
    h = Math.imul(h ^ key.charCodeAt(i), 2654435761);
  }
  
  h = (h ^ (h >>> 16)) >>> 0;
  return h;
}

/**
 * Check if user is in rollout percentage (stable across sessions)
 * @param userId User identifier (or fingerprint for guests)
 * @param percentage Rollout percentage (0-100)
 * @returns boolean
 */
export function inRollout(userId: string, percentage: number): boolean {
  if (percentage >= 100) return true;
  if (percentage <= 0) return false;
  
  const hash = murmurhash3(userId || 'guest');
  const bucket = hash % 100;
  return bucket < percentage;
}

/**
 * Check if feature flag is enabled for user
 * @param key Feature flag key
 * @param userId User ID or fingerprint
 * @param userRole User role (admin, moderator, user)
 * @param userEmail User email (for allowlist)
 * @returns boolean
 */
export function isFeatureEnabled(
  key: FlagKey,
  userId?: string,
  userRole?: string,
  userEmail?: string
): boolean {
  const rule = FLAGS[key];
  
  if (!rule?.enabled) return false;
  
  // Check user allowlist
  if (rule.users && userEmail && rule.users.includes(userEmail)) {
    return true;
  }
  
  if (rule.users && userId && rule.users.includes(userId)) {
    return true;
  }
  
  // Check role-based access
  if (rule.roles && userRole && rule.roles.includes(userRole)) {
    return true;
  }
  
  // Check rollout percentage (sticky bucketing)
  if (rule.rollout != null && userId) {
    return inRollout(userId, rule.rollout);
  }
  
  // If no restrictions, enabled for all
  return !rule.roles && !rule.users && rule.rollout == null;
}

/**
 * Get A/B test assignment and store in localStorage for sticky behavior
 * @param testKey Test identifier
 * @param userId User ID or fingerprint
 * @param percentage Percentage for variant A (rest gets B)
 * @returns 'A' | 'B'
 */
export function getABTestVariant(
  testKey: string,
  userId: string,
  percentage: number = 50
): 'A' | 'B' {
  const storageKey = `ab_${testKey}`;
  
  // Check if assignment already exists (sticky)
  const stored = localStorage.getItem(storageKey);
  if (stored === 'A' || stored === 'B') {
    return stored;
  }
  
  // Assign variant based on hash
  const variant = inRollout(userId, percentage) ? 'A' : 'B';
  
  // Store assignment (180 days)
  try {
    localStorage.setItem(storageKey, variant);
  } catch (e) {
    console.warn('Failed to store A/B assignment:', e);
  }
  
  return variant;
}

/**
 * Track feature flag usage (for analytics)
 */
export function trackFeatureUsage(key: FlagKey, enabled: boolean, userId?: string) {
  if (typeof window !== 'undefined' && (window as any).plausible) {
    (window as any).plausible('FeatureFlag', {
      props: {
        flag: key,
        enabled: enabled.toString(),
        userId: userId || 'anonymous',
      },
    });
  }
}
