# Lead Generation Engine — API Reference

Base URL: `http://localhost:3001/api`

All timestamps are ISO 8601. All responses wrap data in a standard envelope:

```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}
```

Error envelope:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "...",
    "details": { ... }
  }
}
```

---

## Leads

### List Leads

```
GET /leads
```

Query Parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `source` | string | — | Filter by source: `facebook`, `instagram`, `google_web`, `google_maps` |
| `location` | string | — | Partial match on location |
| `businessType` | string | — | Partial match on business_type |
| `status` | string | — | Filter by status: `new`, `contacted`, `qualified`, `rejected` |
| `hasEmail` | boolean | — | `true` = email IS NOT NULL |
| `hasPhone` | boolean | — | `true` = phone IS NOT NULL |
| `minRating` | number | — | Minimum rating (Google Maps) |
| `q` | string | — | Full-text search across business_name, description, address |
| `page` | integer | 1 | Page number |
| `limit` | integer | 25 | Items per page (max 100) |
| `sortBy` | string | `created_at` | Column to sort by |
| `sortOrder` | string | `desc` | `asc` or `desc` |

Response `200 OK`:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "source": "google_maps",
      "business_type": "restaurant",
      "location": "lagos, nigeria",
      "business_name": "The Place Restaurant",
      "page_url": "https://theplace.com.ng",
      "email": "info@theplace.com.ng",
      "phone": "+234 123 456 7890",
      "address": "12 Admiralty Way, Lekki, Lagos",
      "rating": 4.2,
      "review_count": 342,
      "social_handle": null,
      "description": "Casual dining restaurant",
      "status": "new",
      "created_at": "2026-06-11T10:30:00.000Z",
      "updated_at": "2026-06-11T10:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 147,
    "totalPages": 6
  }
}
```

---

### Get Single Lead

```
GET /leads/:id
```

Response `200 OK`:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "source": "google_maps",
    "business_type": "restaurant",
    "location": "lagos, nigeria",
    "business_name": "The Place Restaurant",
    "page_url": "https://theplace.com.ng",
    "email": "info@theplace.com.ng",
    "phone": "+234 123 456 7890",
    "address": "12 Admiralty Way, Lekki, Lagos",
    "rating": 4.2,
    "review_count": 342,
    "social_handle": null,
    "description": "Casual dining restaurant",
    "raw_data": "{...}",
    "status": "new",
    "created_at": "2026-06-11T10:30:00.000Z",
    "updated_at": "2026-06-11T10:30:00.000Z"
  }
}
```

Response `404 Not Found`:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Lead with id 999 not found"
  }
}
```

---

### Create Lead (Manual)

```
POST /leads
```

Request Body:

```json
{
  "source": "facebook",
  "business_type": "restaurant",
  "location": "lagos, nigeria",
  "business_name": "Bukka Hut",
  "page_url": "https://facebook.com/bukkahut",
  "email": "contact@bukkahut.com",
  "phone": "+234 987 654 3210",
  "address": "15 Akin Adesola Street, Victoria Island",
  "social_handle": "@bukkahut",
  "description": "Local cuisine and continental dishes",
  "status": "new"
}
```

Required fields: `source`, `business_type`, `location`

Response `201 Created`:

```json
{
  "success": true,
  "data": {
    "id": 42,
    "source": "facebook",
    "business_type": "restaurant",
    "location": "lagos, nigeria",
    "business_name": "Bukka Hut",
    "page_url": "https://facebook.com/bukkahut",
    "email": "contact@bukkahut.com",
    "phone": "+234 987 654 3210",
    "address": "15 Akin Adesola Street, Victoria Island",
    "rating": null,
    "review_count": null,
    "social_handle": "@bukkahut",
    "description": "Local cuisine and continental dishes",
    "status": "new",
    "created_at": "2026-06-11T14:22:00.000Z",
    "updated_at": "2026-06-11T14:22:00.000Z"
  }
}
```

---

### Update Lead

```
PATCH /leads/:id
```

Request Body (partial):

```json
{
  "status": "contacted",
  "email": "updated@example.com"
}
```

Response `200 OK`:

```json
{
  "success": true,
  "data": {
    "id": 42,
    "source": "facebook",
    "business_type": "restaurant",
    "location": "lagos, nigeria",
    "business_name": "Bukka Hut",
    "page_url": "https://facebook.com/bukkahut",
    "email": "updated@example.com",
    "phone": "+234 987 654 3210",
    "address": "15 Akin Adesola Street, Victoria Island",
    "rating": null,
    "review_count": null,
    "social_handle": "@bukkahut",
    "description": "Local cuisine and continental dishes",
    "status": "contacted",
    "created_at": "2026-06-11T14:22:00.000Z",
    "updated_at": "2026-06-11T15:00:00.000Z"
  }
}
```

---

### Delete Lead

```
DELETE /leads/:id
```

Response `200 OK`:

```json
{
  "success": true,
  "data": { "deleted": true }
}
```

---

### Bulk Update Status

```
POST /leads/bulk-status
```

Request Body:

```json
{
  "ids": [1, 2, 3, 4, 5],
  "status": "qualified"
}
```

Response `200 OK`:

```json
{
  "success": true,
  "data": {
    "updated": 5,
    "status": "qualified"
  }
}
```

---

### Bulk Delete

```
DELETE /leads/bulk-delete
```

Request Body (delete by IDs):

```json
{
  "ids": [10, 11, 12]
}
```

Or delete by filter:

```json
{
  "filter": {
    "source": "facebook",
    "status": "rejected"
  }
}
```

Response `200 OK`:

```json
{
  "success": true,
  "data": {
    "deleted": 23
  }
}
```

---

## Scraping

All scrape endpoints follow the same pattern. They trigger Apify actors asynchronously and return immediately with a search record ID for polling.

### Scrape Facebook

```
POST /scrape/facebook
```

Request Body:

```json
{
  "businessType": "restaurant",
  "location": "lagos, nigeria",
  "maxResults": 50
}
```

Response `202 Accepted`:

```json
{
  "success": true,
  "data": {
    "searchId": 7,
    "source": "facebook",
    "status": "running",
    "message": "Scrape job started. Poll GET /searches/7 for status.",
    "estimatedTimeSeconds": 60
  }
}
```

---

### Scrape Instagram

```
POST /scrape/instagram
```

Request Body:

```json
{
  "businessType": "restaurant",
  "location": "lagos, nigeria",
  "maxResults": 50
}
```

Response `202 Accepted`:

```json
{
  "success": true,
  "data": {
    "searchId": 8,
    "source": "instagram",
    "status": "running",
    "message": "Scrape job started. Poll GET /searches/8 for status.",
    "estimatedTimeSeconds": 60
  }
}
```

---

### Scrape Google Web

```
POST /scrape/google-web
```

Request Body:

```json
{
  "businessType": "restaurant",
  "location": "lagos, nigeria",
  "maxResults": 50
}
```

Response `202 Accepted`:

```json
{
  "success": true,
  "data": {
    "searchId": 9,
    "source": "google_web",
    "status": "running",
    "message": "Scrape job started. Poll GET /searches/9 for status.",
    "estimatedTimeSeconds": 90
  }
}
```

---

### Scrape Google Maps

```
POST /scrape/google-maps
```

Request Body:

```json
{
  "businessType": "restaurant",
  "location": "lagos, nigeria",
  "maxResults": 100
}
```

Response `202 Accepted`:

```json
{
  "success": true,
  "data": {
    "searchId": 10,
    "source": "google_maps",
    "status": "running",
    "message": "Scrape job started. Poll GET /searches/10 for status.",
    "estimatedTimeSeconds": 120
  }
}
```

---

## Export

### Export CSV

```
GET /export/csv?source=&status=&location=&businessType=
```

Query Parameters (same filter set as List Leads, minus pagination/sort):

| Parameter | Type | Description |
|-----------|------|-------------|
| `source` | string | Filter by source |
| `status` | string | Filter by status |
| `location` | string | Filter by location |
| `businessType` | string | Filter by business type |
| `hasEmail` | boolean | Only leads with email |
| `hasPhone` | boolean | Only leads with phone |

Response: `Content-Type: text/csv` — File download

```
Content-Disposition: attachment; filename="leads-google_maps-20260611-153000.csv"
```

CSV Columns:

```
id,business_type,location,business_name,page_url,email,phone,address,rating,review_count,social_handle,description,source,status,created_at
```

---

### Export JSON

```
GET /export/json?source=&status=&location=&businessType=
```

Same query parameters as CSV export.

Response: `Content-Type: application/json` — File download

```
Content-Disposition: attachment; filename="leads-facebook-20260611-153000.json"
```

Response Body (pretty-printed JSON array):

```json
[
  {
    "id": 1,
    "source": "facebook",
    "business_type": "restaurant",
    "location": "lagos, nigeria",
    "business_name": "Bukka Hut",
    "page_url": "https://facebook.com/bukkahut",
    "email": "contact@bukkahut.com",
    "phone": "+234 987 654 3210",
    "address": "15 Akin Adesola Street, Victoria Island",
    "rating": null,
    "review_count": null,
    "social_handle": "@bukkahut",
    "description": "Local cuisine and continental dishes",
    "status": "new",
    "created_at": "2026-06-11T14:22:00.000Z",
    "updated_at": "2026-06-11T14:22:00.000Z"
  }
]
```

---

### List Past Exports

```
GET /exports
```

Response `200 OK`:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "filename": "leads-google_maps-20260611-153000.csv",
      "filter_source": "google_maps",
      "record_count": 89,
      "created_at": "2026-06-11T15:30:00.000Z"
    },
    {
      "id": 2,
      "filename": "leads-facebook-20260611-160000.json",
      "filter_source": "facebook",
      "record_count": 45,
      "created_at": "2026-06-11T16:00:00.000Z"
    }
  ]
}
```

---

## Stats

### Overview Stats

```
GET /stats/overview
```

Response `200 OK`:

```json
{
  "success": true,
  "data": {
    "totalLeads": 147,
    "bySource": {
      "facebook": 32,
      "instagram": 28,
      "google_web": 41,
      "google_maps": 46
    },
    "byStatus": {
      "new": 120,
      "contacted": 15,
      "qualified": 8,
      "rejected": 4
    },
    "withEmail": 89,
    "withPhone": 112,
    "withBoth": 76
  }
}
```

---

### Recent Activity

```
GET /stats/recent
```

Response `200 OK`:

```json
{
  "success": true,
  "data": {
    "last24h": {
      "leadsAdded": 23,
      "searchesRun": 4,
      "exportsGenerated": 2
    },
    "last7d": {
      "leadsAdded": 147,
      "searchesRun": 12,
      "exportsGenerated": 5
    },
    "recentSearches": [
      {
        "id": 10,
        "source": "google_maps",
        "query_params": {"businessType":"restaurant","location":"lagos, nigeria","maxResults":100},
        "results_count": 46,
        "run_status": "completed",
        "created_at": "2026-06-11T15:00:00.000Z"
      }
    ]
  }
}
```

---

## Searches

### List Search History

```
GET /searches?page=&limit=
```

Response `200 OK`:

```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "source": "google_maps",
      "query_params": {
        "businessType": "restaurant",
        "location": "lagos, nigeria",
        "maxResults": 100
      },
      "results_count": 46,
      "run_status": "completed",
      "apify_run_id": "abc123xyz",
      "created_at": "2026-06-11T15:00:00.000Z"
    },
    {
      "id": 9,
      "source": "google_web",
      "query_params": {
        "businessType": "restaurant",
        "location": "lagos, nigeria",
        "maxResults": 50
      },
      "results_count": 41,
      "run_status": "completed",
      "apify_run_id": "def456uvw",
      "created_at": "2026-06-11T14:30:00.000Z"
    },
    {
      "id": 8,
      "source": "instagram",
      "query_params": {
        "businessType": "restaurant",
        "location": "lagos, nigeria",
        "maxResults": 50
      },
      "results_count": 0,
      "run_status": "failed",
      "apify_run_id": "ghi789rst",
      "created_at": "2026-06-11T14:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 12,
    "totalPages": 1
  }
}
```

---

### Get Single Search

```
GET /searches/:id
```

Response `200 OK`:

```json
{
  "success": true,
  "data": {
    "id": 10,
    "source": "google_maps",
    "query_params": {
      "businessType": "restaurant",
      "location": "lagos, nigeria",
      "maxResults": 100
    },
    "results_count": 46,
    "run_status": "completed",
    "apify_run_id": "abc123xyz",
    "created_at": "2026-06-11T15:00:00.000Z"
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request body or query params invalid |
| `NOT_FOUND` | 404 | Resource does not exist |
| `APIFY_ERROR` | 502 | Apify actor failed or returned error |
| `RATE_LIMITED` | 429 | Too many scrape requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `EXPORT_EMPTY` | 400 | Export requested but no matching leads found |
| `SCRAPE_TIMEOUT` | 504 | Apify actor exceeded max polling time |
