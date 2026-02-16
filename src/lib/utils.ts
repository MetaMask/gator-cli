/**
 * Splits a comma-separated string into an array of trimmed values.
 * Used by Commander to parse multi-value CLI options (e.g. --targets, --selectors).
 */
export function commaSplit(val: string): string[] {
  return val.split(',').map((s) => s.trim());
}
