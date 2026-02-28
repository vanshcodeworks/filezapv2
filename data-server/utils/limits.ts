export const LIMITS = {
  MAX_ACTIVE_FILES:      5,
  MAX_TOTAL_BYTES:       500 * 1024 * 1024, 
  MAX_SINGLE_FILE_BYTES: 100 * 1024 * 1024, 
  ALLOWED_TTL_HOURS:     new Set([12, 24, 48]),
} as const;