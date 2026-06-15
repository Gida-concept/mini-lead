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
  return `intitle:"${businessType}" "${businessType}" "${location}" ("contact" OR "about" OR "official" OR "location") -"Top 10" -"Top 5" -site:tripadvisor.com -site:booking.com -site:expedia.com -site:hotels.com -site:kayak.com -site:trivago.com -site:yelp.com -site:yellowpages.com -site:superpages.com -site:manta.com -site:hotfrog.com -site:cylex.us.com -site:citysearch.com -site:foursquare.com -site:justdial.com -site:bbb.org -site:wikimapia.org -site:facebook.com -site:instagram.com -site:linkedin.com -inurl:top-10 -inurl:top10 -inurl:blog -inurl:category -inurl:tag`;
}

export function buildGoogleMapsSearchString(businessType: string, location: string): string {
  return `${businessType} in ${location}`;
}
