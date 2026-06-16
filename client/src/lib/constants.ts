import type { LeadSource, LeadStatus } from "@/types/lead";

export const SOURCES: LeadSource[] = [
  "google_maps",
];

export const SOURCE_LABELS: Record<LeadSource, string> = {
  google_maps: "Google Maps",
};

export const STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "rejected",
];

export const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-blue-100 text-blue-800 border-blue-200",
  contacted: "bg-yellow-100 text-yellow-800 border-yellow-200",
  qualified: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  rejected: "Rejected",
};

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

export const DEFAULTS = {
  maxResults: 50,
  limit: 25,
} as const;

export const BUSINESS_TYPE_SUGGESTIONS = [
  "Restaurant",
  "Cafe",
  "Bar",
  "Hotel",
  "Supermarket",
  "Pharmacy",
  "Clinic",
  "Hospital",
  "School",
  "Church",
  "Fitness Center",
  "Salon",
  "Spa",
  "Bakery",
  "Clothing Store",
  "Electronics Store",
  "Auto Mechanic",
  "Real Estate Agency",
  "Accounting Firm",
  "Law Firm",
];

export const LOCATION_SUGGESTIONS = [
  // 🇳🇬 Nigeria
  "Lagos, Nigeria",
  "Abuja, Nigeria",
  "Port Harcourt, Nigeria",
  "Ibadan, Nigeria",
  "Kano, Nigeria",
  "Enugu, Nigeria",
  "Aba, Nigeria",
  "Kaduna, Nigeria",
  "Benin City, Nigeria",
  "Onitsha, Nigeria",
  "Warri, Nigeria",
  "Jos, Nigeria",
  "Calabar, Nigeria",
  "Uyo, Nigeria",
  "Ikeja, Lagos, Nigeria",
  "Victoria Island, Lagos, Nigeria",
  "Lekki, Lagos, Nigeria",
  "Ajah, Lagos, Nigeria",
  "Surulere, Lagos, Nigeria",
  "Garki, Abuja, Nigeria",
  "Wuse, Abuja, Nigeria",
  "Maitama, Abuja, Nigeria",

  // 🇺🇸 United States
  "New York, NY, USA",
  "Los Angeles, CA, USA",
  "Chicago, IL, USA",
  "Houston, TX, USA",
  "Miami, FL, USA",
  "San Francisco, CA, USA",
  "Atlanta, GA, USA",
  "Dallas, TX, USA",
  "Seattle, WA, USA",
  "Boston, MA, USA",

  // 🇬🇧 United Kingdom
  "London, UK",
  "Manchester, UK",
  "Birmingham, UK",
  "Liverpool, UK",
  "Glasgow, UK",

  // 🇨🇦 Canada
  "Toronto, Canada",
  "Vancouver, Canada",
  "Montreal, Canada",
  "Calgary, Canada",

  // 🇦🇺 Australia
  "Sydney, Australia",
  "Melbourne, Australia",
  "Brisbane, Australia",
  "Perth, Australia",

  // 🇿🇦 South Africa
  "Johannesburg, South Africa",
  "Cape Town, South Africa",
  "Durban, South Africa",

  // 🇰🇪 Kenya
  "Nairobi, Kenya",
  "Mombasa, Kenya",

  // 🇬🇭 Ghana
  "Accra, Ghana",
  "Kumasi, Ghana",

  // 🇪🇬 Egypt
  "Cairo, Egypt",
  "Alexandria, Egypt",

  // 🇩🇪 Germany
  "Berlin, Germany",
  "Munich, Germany",
  "Hamburg, Germany",
  "Frankfurt, Germany",

  // 🇫🇷 France
  "Paris, France",
  "Lyon, France",
  "Marseille, France",

  // 🇦🇪 UAE
  "Dubai, UAE",
  "Abu Dhabi, UAE",

  // 🇮🇳 India
  "Mumbai, India",
  "New Delhi, India",
  "Bangalore, India",
  "Hyderabad, India",
  "Chennai, India",

  // 🇸🇬 Singapore
  "Singapore",

  // 🇧🇷 Brazil
  "São Paulo, Brazil",
  "Rio de Janeiro, Brazil",

  // 🇲🇽 Mexico
  "Mexico City, Mexico",

  // 🇯🇵 Japan
  "Tokyo, Japan",
  "Osaka, Japan",

  // 🇰🇷 South Korea
  "Seoul, South Korea",

  // 🇨🇳 China
  "Shanghai, China",
  "Beijing, China",
  "Hong Kong, China",

  // 🇭🇰 Hong Kong
  "Hong Kong",
];

export const SOURCE_ICONS: Record<LeadSource, string> = {
  google_maps: "map-pin",
};
