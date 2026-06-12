/**
 * Search query generators per source.
 * Builds Google search operators and Maps search strings.
 */

export function buildFacebookQuery(businessType: string, location: string): string {
  return `site:facebook.com/pages OR site:facebook.com/pg "${businessType}" "${location}" -"group" -"marketplace" -"events"`;
}

export function buildInstagramQuery(businessType: string, location: string): string {
  return `site:instagram.com "${businessType}" "${location}" "📍" OR "link in bio" OR "DM" -"explore" -"tags"`;
}

export function buildGoogleWebQuery(businessType: string, location: string): string {
  return `"${businessType}" "${location}" "menu" OR "reservation" OR "order" -site:facebook.com -site:instagram.com -site:tripadvisor.com -site:eatdrinklagos.com -site:booking.com -site:yellowpages.com.ng -site:ng.linkedin.com`;
}

export function buildGoogleMapsSearchString(businessType: string, location: string): string {
  return `${businessType} in ${location}`;
}
