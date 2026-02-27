/**
 * Cache key constants for admin module
 * Follows pattern: admin:<resource>:<identifier>
 */
export const CACHE_KEYS = {
    // Dashboard
    DASHBOARD_STATS: 'admin:dashboard:stats',
    DASHBOARD_CHARTS: (period: string) => `admin:dashboard:charts:${period}`,
    DASHBOARD_ACTIVITIES: 'admin:dashboard:activities',

    // Users
    USERS_LIST: (filterHash: string) => `admin:users:list:${filterHash}`,
    USER_DETAIL: (userId: string) => `admin:users:detail:${userId}`,
    USER_ACTIVITY: (userId: string) => `admin:users:activity:${userId}`,

    // Posts
    POSTS_LIST: (filterHash: string) => `admin:posts:list:${filterHash}`,
    POST_DETAIL: (postId: string) => `admin:posts:detail:${postId}`,

    // Reports
    REPORTS_LIST: (filterHash: string) => `admin:reports:list:${filterHash}`,
    REPORT_DETAIL: (reportId: string) => `admin:reports:detail:${reportId}`,
    REPORT_STATS: 'admin:reports:stats',

    // Analytics
    ANALYTICS_USERS: (period: string) => `admin:analytics:users:${period}`,
    ANALYTICS_POSTS: (period: string) => `admin:analytics:posts:${period}`,
    ANALYTICS_REVENUE: (period: string) => `admin:analytics:revenue:${period}`,

    // System
    SYSTEM_METRICS: 'admin:system:metrics',
    SYSTEM_HEALTH: 'admin:system:health',
} as const;

/**
 * Cache TTL (Time To Live) constants in seconds
 */
export const CACHE_TTL = {
    DASHBOARD_STATS: 300, // 5 minutes
    DASHBOARD_CHARTS: 300, // 5 minutes
    USER_LIST: 120, // 2 minutes
    POST_LIST: 120, // 2 minutes
    REPORT_LIST: 60, // 1 minute
    ANALYTICS: 600, // 10 minutes
    SYSTEM_METRICS: 60, // 1 minute
} as const;
