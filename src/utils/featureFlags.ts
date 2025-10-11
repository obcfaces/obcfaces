/**
 * Feature Flags System for OBC Faces
 * Enables safe rollout, A/B testing, and gradual releases
 */

export const FEATURE_FLAGS = {
  // Analytics & Insights
  ANALYTICS_DASHBOARD: 'analytics_dashboard',
  ADVANCED_CHARTS: 'advanced_charts',
  EXPORT_DATA: 'export_data',
  
  // UI/UX Experiments
  NEW_VOTING_UX: 'new_voting_ux',
  NEW_UI_THEME: 'new_ui_theme',
  FEEDBACK_COLLECTOR: 'feedback_collector',
  
  // Translation & i18n
  AUTO_TRANSLATION: 'auto_translation',
  TRANSLATION_CACHE: 'translation_cache',
  
  // Security & Performance
  TURNSTILE_V2: 'turnstile_v2',
  JWT_REFRESH: 'jwt_refresh',
  TWO_FACTOR_AUTH: '2fa_enabled',
  
  // ML & AI Features
  ML_PHOTO_SCORING: 'ml_photo_scoring',
  AI_CONTENT_MODERATION: 'ai_content_moderation',
  
  // Contest Features
  CONTEST_INSIGHTS_V2: 'contest_insights_v2',
  REAL_TIME_STATS: 'real_time_stats',
} as const;

export type FeatureFlagKey = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];

export interface FeatureFlagConfig {
  enabled: boolean;
  rolloutPercentage?: number; // 0-100
  enabledForRoles?: string[]; // ['admin', 'moderator']
  enabledForUsers?: string[]; // specific user IDs
  description?: string;
}

// Default feature flag configurations
export const DEFAULT_FEATURE_FLAGS: Record<FeatureFlagKey, FeatureFlagConfig> = {
  // ✅ Currently active
  [FEATURE_FLAGS.ANALYTICS_DASHBOARD]: {
    enabled: true,
    enabledForRoles: ['admin', 'moderator'],
    description: 'Admin analytics dashboard with charts and metrics',
  },
  [FEATURE_FLAGS.ADVANCED_CHARTS]: {
    enabled: true,
    enabledForRoles: ['admin'],
    description: 'Advanced visualization in analytics',
  },
  
  // 🧪 Testing phase
  [FEATURE_FLAGS.NEW_VOTING_UX]: {
    enabled: false,
    rolloutPercentage: 25,
    description: 'A/B test for new voting interface',
  },
  [FEATURE_FLAGS.FEEDBACK_COLLECTOR]: {
    enabled: false,
    rolloutPercentage: 10,
    description: 'User feedback popup in contest and profile',
  },
  [FEATURE_FLAGS.NEW_UI_THEME]: {
    enabled: false,
    rolloutPercentage: 10,
    description: 'New visual theme A/B test',
  },
  
  // ⏸️ Planned features
  [FEATURE_FLAGS.AUTO_TRANSLATION]: {
    enabled: false,
    enabledForRoles: ['admin'],
    description: 'AI-powered automatic translation sync',
  },
  [FEATURE_FLAGS.TRANSLATION_CACHE]: {
    enabled: false,
    description: 'Translation caching via Supabase Storage',
  },
  [FEATURE_FLAGS.EXPORT_DATA]: {
    enabled: false,
    enabledForRoles: ['admin'],
    description: 'CSV export for analytics data',
  },
  [FEATURE_FLAGS.TURNSTILE_V2]: {
    enabled: false,
    description: 'Updated Turnstile integration',
  },
  [FEATURE_FLAGS.JWT_REFRESH]: {
    enabled: false,
    description: 'JWT refresh token implementation',
  },
  [FEATURE_FLAGS.TWO_FACTOR_AUTH]: {
    enabled: false,
    description: '2FA in Account settings',
  },
  [FEATURE_FLAGS.ML_PHOTO_SCORING]: {
    enabled: false,
    enabledForRoles: ['admin'],
    description: 'ML-based photo quality scoring',
  },
  [FEATURE_FLAGS.AI_CONTENT_MODERATION]: {
    enabled: false,
    enabledForRoles: ['admin', 'moderator'],
    description: 'AI-powered content moderation',
  },
  [FEATURE_FLAGS.CONTEST_INSIGHTS_V2]: {
    enabled: false,
    enabledForRoles: ['admin'],
    description: 'Enhanced contest analytics by country/category',
  },
  [FEATURE_FLAGS.REAL_TIME_STATS]: {
    enabled: false,
    enabledForRoles: ['admin'],
    description: 'Real-time statistics updates',
  },
};

/**
 * Check if feature is enabled for user
 * @param flagKey Feature flag key
 * @param userId User ID (optional)
 * @param userRoles User roles (optional)
 * @returns boolean
 */
export function isFeatureEnabled(
  flagKey: FeatureFlagKey,
  userId?: string,
  userRoles?: string[]
): boolean {
  const config = DEFAULT_FEATURE_FLAGS[flagKey];
  
  if (!config) return false;
  if (!config.enabled) return false;
  
  // Check role-based access
  if (config.enabledForRoles && userRoles) {
    const hasRole = config.enabledForRoles.some(role => 
      userRoles.includes(role)
    );
    if (hasRole) return true;
  }
  
  // Check user-specific access
  if (config.enabledForUsers && userId) {
    if (config.enabledForUsers.includes(userId)) return true;
  }
  
  // Check rollout percentage
  if (config.rolloutPercentage !== undefined && userId) {
    const userHash = hashString(userId);
    const bucket = userHash % 100;
    return bucket < config.rolloutPercentage;
  }
  
  // Default: enabled for all if no restrictions
  return !config.enabledForRoles && !config.enabledForUsers;
}

/**
 * Simple string hash for consistent user bucketing
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
