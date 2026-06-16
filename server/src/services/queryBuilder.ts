/**
 * Search query generators per source.
 * Builds Maps search strings.
 */

export function buildMapsSearchString(businessType: string, location: string): string {
  return `${businessType} in ${location}`;
}
