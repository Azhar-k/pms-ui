# API Response Changes - Frontend Migration Guide

This document describes the changes in HTTP status codes returned by the API after the refactoring. The API now follows REST best practices with more specific status codes.

## Summary of Changes

- **404 (Not Found)** - Now returned when a requested resource doesn't exist (previously 400)
- **409 (Conflict)** - Now returned for duplicate entity conflicts (previously 400)
- **400 (Bad Request)** - Still used for validation errors and business logic violations

---

## Guest Management API (`/api/guests`)

### 1. Create Guest with Duplicate Email
**Endpoint:** `POST /api/guests`

**Previous:** `400 Bad Request`  
**Current:** `409 Conflict`

**When:** Attempting to create a guest with an email that already exists

**Example Response:**
```json
{
  "status": 409,
  "message": "Guest with email 'test@example.com' already exists",
  "timestamp": "2024-01-15T10:30:00"
}
```

---

### 2. Get Guest by ID (Not Found)
**Endpoint:** `GET /api/guests/{id}`

**Previous:** `400 Bad Request`  
**Current:** `404 Not Found`

**When:** Requesting a guest that doesn't exist

**Example Response:**
```json
{
  "status": 404,
  "message": "Guest not found with identifier: 99999",
  "timestamp": "2024-01-15T10:30:00"
}
```

---

### 3. Update Guest (Not Found)
**Endpoint:** `PUT /api/guests/{id}`

**Previous:** `400 Bad Request`  
**Current:** `404 Not Found`

**When:** Attempting to update a guest that doesn't exist

**Example Response:**
```json
{
  "status": 404,
  "message": "Guest not found with identifier: 99999",
  "timestamp": "2024-01-15T10:30:00"
}
```

---

### 4. Update Guest with Duplicate Email
**Endpoint:** `PUT /api/guests/{id}`

**Previous:** `400 Bad Request`  
**Current:** `409 Conflict`

**When:** Attempting to update a guest's email to one that already exists

**Example Response:**
```json
{
  "status": 409,
  "message": "Guest with email 'existing@example.com' already exists",
  "timestamp": "2024-01-15T10:30:00"
}
```

---

### 5. Delete Guest (Not Found)
**Endpoint:** `DELETE /api/guests/{id}`

**Previous:** `400 Bad Request`  
**Current:** `404 Not Found`

**When:** Attempting to delete a guest that doesn't exist

**Example Response:**
```json
{
  "status": 404,
  "message": "Guest not found with identifier: 99999",
  "timestamp": "2024-01-15T10:30:00"
}
```

---

## Reservation Management API (`/api/reservations`)

### 6. Create Reservation with Invalid Guest ID
**Endpoint:** `POST /api/reservations`

**Previous:** `400 Bad Request`  
**Current:** `404 Not Found`

**When:** Creating a reservation with a guest ID that doesn't exist

**Example Response:**
```json
{
  "status": 404,
  "message": "Guest not found with identifier: 99999",
  "timestamp": "2024-01-15T10:30:00"
}
```

---

### 7. Create Reservation with Invalid Room ID
**Endpoint:** `POST /api/reservations`

**Previous:** `400 Bad Request`  
**Current:** `404 Not Found`

**When:** Creating a reservation with a room ID that doesn't exist

**Example Response:**
```json
{
  "status": 404,
  "message": "Room not found with identifier: 99999",
  "timestamp": "2024-01-15T10:30:00"
}
```

---

### 8. Create Reservation with Invalid Rate Type ID
**Endpoint:** `POST /api/reservations`

**Previous:** `400 Bad Request`  
**Current:** `404 Not Found`

**When:** Creating a reservation with a rate type ID that doesn't exist

**Example Response:**
```json
{
  "status": 404,
  "message": "RateType not found with identifier: 99999",
  "timestamp": "2024-01-15T10:30:00"
}
```

---

### 9. Get Reservation by ID (Not Found)
**Endpoint:** `GET /api/reservations/{id}`

**Previous:** `400 Bad Request`  
**Current:** `404 Not Found`

**Example Response:**
```json
{
  "status": 404,
  "message": "Reservation not found with identifier: 99999",
  "timestamp": "2024-01-15T10:30:00"
}
```

---

### 10. Get Reservation by Number (Not Found)
**Endpoint:** `GET /api/reservations/number/{reservationNumber}`

**Previous:** `400 Bad Request`  
**Current:** `404 Not Found`

**Example Response:**
```json
{
  "status": 404,
  "message": "Reservation not found with identifier: NON_EXISTENT_99999",
  "timestamp": "2024-01-15T10:30:00"
}
```

---

### 11. Check-In Reservation (Not Found)
**Endpoint:** `POST /api/reservations/{id}/check-in`

**Previous:** `400 Bad Request`  
**Current:** `404 Not Found`

**When:** Attempting to check in a reservation that doesn't exist

**Example Response:**
```json
{
  "status": 404,
  "message": "Reservation not found with identifier: 99999",
  "timestamp": "2024-01-15T10:30:00"
}
```

---

### 12. Check-Out Reservation (Not Found)
**Endpoint:** `POST /api/reservations/{id}/check-out`

**Previous:** `400 Bad Request`  
**Current:** `404 Not Found`

**When:** Attempting to check out a reservation that doesn't exist

**Example Response:**
```json
{
  "status": 404,
  "message": "Reservation not found with identifier: 99999",
  "timestamp": "2024-01-15T10:30:00"
}
```

---

### 13. Update Reservation (Not Found)
**Endpoint:** `PUT /api/reservations/{id}`

**Previous:** `400 Bad Request`  
**Current:** `404 Not Found`

**When:** Attempting to update a reservation that doesn't exist

**Example Response:**
```json
{
  "status": 404,
  "message": "Reservation not found with identifier: 99999",
  "timestamp": "2024-01-15T10:30:00"
}
```

---

### 14. Cancel Reservation (Not Found)
**Endpoint:** `POST /api/reservations/{id}/cancel`

**Previous:** `400 Bad Request`  
**Current:** `404 Not Found`

**When:** Attempting to cancel a reservation that doesn't exist

**Example Response:**
```json
{
  "status": 404,
  "message": "Reservation not found with identifier: 99999",
  "timestamp": "2024-01-15T10:30:00"
}
```

---

## Invoice Management API (`/api/invoices`)

### 15. Generate Invoice for Invalid Reservation
**Endpoint:** `POST /api/invoices/generate/{reservationId}`

**Previous:** `400 Bad Request`  
**Current:** `404 Not Found`

**When:** Attempting to generate an invoice for a reservation that doesn't exist

**Example Response:**
```json
{
  "status": 404,
  "message": "Reservation not found with identifier: 99999",
  "timestamp": "2024-01-15T10:30:00"
}
```

---

### 16. Get Invoice by ID (Not Found)
**Endpoint:** `GET /api/invoices/{id}`

**Previous:** `400 Bad Request`  
**Current:** `404 Not Found`

**Example Response:**
```json
{
  "status": 404,
  "message": "Invoice not found with identifier: 99999",
  "timestamp": "2024-01-15T10:30:00"
}
```

---

### 17. Get Invoice by Number (Not Found)
**Endpoint:** `GET /api/invoices/number/{invoiceNumber}`

**Previous:** `400 Bad Request`  
**Current:** `404 Not Found`

**Example Response:**
```json
{
  "status": 404,
  "message": "Invoice not found with identifier: NON_EXISTENT_99999",
  "timestamp": "2024-01-15T10:30:00"
}
```

---

### 18. Add Invoice Item (Invoice Not Found)
**Endpoint:** `POST /api/invoices/{invoiceId}/items`

**Previous:** `400 Bad Request`  
**Current:** `404 Not Found`

**When:** Attempting to add an item to an invoice that doesn't exist

**Example Response:**
```json
{
  "status": 404,
  "message": "Invoice not found with identifier: 99999",
  "timestamp": "2024-01-15T10:30:00"
}
```

---

### 19. Remove Invoice Item (Invoice Not Found)
**Endpoint:** `DELETE /api/invoices/{invoiceId}/items/{itemId}`

**Previous:** `400 Bad Request`  
**Current:** `404 Not Found`

**When:** Attempting to remove an item from an invoice that doesn't exist

**Example Response:**
```json
{
  "status": 404,
  "message": "Invoice not found with identifier: 99999",
  "timestamp": "2024-01-15T10:30:00"
}
```

---

### 20. Mark Invoice as Paid (Invoice Not Found)
**Endpoint:** `POST /api/invoices/{invoiceId}/pay`

**Previous:** `400 Bad Request`  
**Current:** `404 Not Found`

**When:** Attempting to mark an invoice as paid that doesn't exist

**Example Response:**
```json
{
  "status": 404,
  "message": "Invoice not found with identifier: 99999",
  "timestamp": "2024-01-15T10:30:00"
}
```

---

## Status Codes That Remain Unchanged

The following scenarios still return **400 Bad Request** (no changes needed):

- Validation errors (missing required fields, invalid formats)
- Business logic violations (e.g., checking out without checking in first)
- Invalid date ranges
- Room capacity exceeded
- Room not available for selected dates
- Invalid status transitions
- Attempting to modify paid invoices
- Other business rule violations

---

## Frontend Migration Checklist

### Error Handling Updates

1. **Update error handlers to check for 404 status code** for "not found" scenarios
2. **Update error handlers to check for 409 status code** for duplicate entity conflicts
3. **Keep 400 status code handling** for validation and business logic errors

### Example Frontend Error Handling

```javascript
// Before
if (error.response.status === 400) {
  // Handle all errors
}

// After
if (error.response.status === 404) {
  // Handle "not found" errors
  showError("Resource not found");
} else if (error.response.status === 409) {
  // Handle duplicate/conflict errors
  showError("This resource already exists");
} else if (error.response.status === 400) {
  // Handle validation/business logic errors
  showError(error.response.data.message);
}
```

### User-Friendly Messages

Consider mapping status codes to user-friendly messages:

- **404**: "The requested resource was not found. It may have been deleted or never existed."
- **409**: "This resource already exists. Please use a different value."
- **400**: Display the specific validation/business error message from the API

---

## Error Response Format

All error responses follow this consistent format:

```json
{
  "status": <HTTP_STATUS_CODE>,
  "message": "<Error message describing what went wrong>",
  "timestamp": "<ISO 8601 timestamp>"
}
```

For validation errors (400), the response may include additional details:

```json
{
  "status": 400,
  "message": "Validation failed",
  "errors": {
    "email": "Email cannot be null or blank",
    "firstName": "First name is required"
  },
  "timestamp": "2024-01-15T10:30:00"
}
```

---

## Testing Recommendations

1. Test all "not found" scenarios to ensure they return 404
2. Test duplicate entity scenarios to ensure they return 409
3. Verify validation errors still return 400 with detailed error messages
4. Update any hardcoded status code checks in your frontend code
5. Update error message displays to handle the new status codes appropriately

---

## Summary Table

| Scenario | Old Status | New Status | Endpoint Category |
|----------|-----------|------------|----------------|
| Resource not found | 400 | **404** | All GET/PUT/DELETE operations |
| Duplicate entity | 400 | **409** | Guest email conflicts |
| Invalid reference ID | 400 | **404** | Reservation/Invoice creation with invalid IDs |
| Validation errors | 400 | **400** | No change |
| Business logic violations | 400 | **400** | No change |

---

**Note:** These changes improve API consistency and follow REST API best practices. The frontend should be updated to handle these status codes appropriately for better user experience.

