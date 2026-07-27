# PMN ERP Platform - API Documentation

## Base URL

```
Production: https://erp.pmn.edu.in/api
Development: http://localhost:3000/api
```

## Authentication

All API endpoints (except `/api/auth/login`) require authentication.

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

Or use the HTTP-only cookie set after login.

---

## Authentication Endpoints

### POST /api/auth/login

Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Success Response (No 2FA):**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "roles": ["admin"],
      "permissions": ["*"]
    }
  }
}
```

**Success Response (2FA Required):**
```json
{
  "success": true,
  "data": {
    "requiresTwoFactor": true,
    "tempToken": "temporary_token"
  }
}
```

### POST /api/auth/verify-2fa

Verify two-factor authentication code.

**Request Body:**
```json
{
  "tempToken": "temporary_token_from_login",
  "code": "123456"
}
```

### GET /api/auth/me

Get current authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "roles": ["admin"]
    }
  }
}
```

### POST /api/auth/logout

Logout and invalidate session.

### POST /api/auth/setup-2fa

Generate 2FA setup (QR code and secret).

**Response:**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,...",
    "secret": "BASE32SECRET",
    "backupCodes": ["CODE1", "CODE2", ...]
  }
}
```

### PUT /api/auth/setup-2fa

Enable 2FA after verifying code.

**Request Body:**
```json
{
  "code": "123456"
}
```

---

## CRM Endpoints

### Leads

#### GET /api/crm/leads

List leads with filtering and pagination.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| pageSize | number | Items per page (default: 20, max: 100) |
| status | string | Filter by status |
| stage | string | Filter by stage |
| leadSource | string | Filter by source |
| assignedTo | uuid | Filter by assignee |
| search | string | Search in name, phone, email |
| sortBy | string | Sort field |
| sortOrder | asc/desc | Sort direction |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "fullName": "John Doe",
      "mobileNumber": "9876543210",
      "status": "new",
      "stage": "stage_1",
      "leadSource": "website",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### POST /api/crm/leads

Create a new lead.

**Request Body (Stage 1 - Minimum):**
```json
{
  "fullName": "John Doe",
  "mobileNumber": "9876543210",
  "leadSource": "website",
  "consentToContact": true
}
```

**Request Body (Full):**
```json
{
  "fullName": "John Doe",
  "mobileNumber": "9876543210",
  "email": "john@example.com",
  "leadSource": "website",
  "interestedCourse": "bsc_nautical",
  "preferredLanguage": "english",
  "city": "Mumbai",
  "consentToContact": true,
  "notes": "Interested in admission",
  "assignedTo": "user_uuid"
}
```

#### GET /api/crm/leads/:id

Get a single lead by ID.

#### PATCH /api/crm/leads/:id

Update a lead.

**Request Body:**
```json
{
  "qualification": "12th Science",
  "pcmBackground": true,
  "status": "contacted"
}
```

#### DELETE /api/crm/leads/:id

Delete a lead.

#### PATCH /api/crm/leads/:id/status

Update lead status.

**Request Body:**
```json
{
  "status": "qualified",
  "reason": "Met all criteria"
}
```

#### POST /api/crm/leads/:id/assign

Assign lead to a user.

**Request Body:**
```json
{
  "assigneeId": "user_uuid"
}
```

#### GET /api/crm/leads/statistics

Get lead statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLeads": 1234,
    "newLeadsToday": 12,
    "newLeadsThisWeek": 67,
    "conversionRate": 23.5,
    "byStatus": {
      "new": 45,
      "contacted": 156
    },
    "bySource": {
      "website": 234,
      "facebook": 189
    }
  }
}
```

### Tasks

#### GET /api/crm/tasks

List tasks.

#### POST /api/crm/tasks

Create a task.

**Request Body:**
```json
{
  "title": "Follow up with John",
  "description": "Call to discuss course options",
  "type": "call",
  "priority": "high",
  "dueDate": "2024-01-15T10:00:00Z",
  "leadId": "lead_uuid",
  "assignedTo": "user_uuid"
}
```

#### GET /api/crm/tasks/:id

Get a task.

#### PATCH /api/crm/tasks/:id

Update a task.

#### DELETE /api/crm/tasks/:id

Delete a task.

#### POST /api/crm/tasks/:id/complete

Mark task as complete.

### Follow-ups

#### GET /api/crm/follow-ups

Get follow-ups.

**Query Parameters:**
| Parameter | Value | Description |
|-----------|-------|-------------|
| filter | today | Today's follow-ups |
| filter | overdue | Overdue follow-ups |

#### POST /api/crm/follow-ups

Create a follow-up.

**Request Body:**
```json
{
  "leadId": "lead_uuid",
  "scheduledAt": "2024-01-15T10:00:00Z",
  "type": "call",
  "purpose": "Discuss admission process",
  "assignedTo": "user_uuid"
}
```

### Communications

#### POST /api/crm/communications

Log a communication.

**Request Body:**
```json
{
  "leadId": "lead_uuid",
  "type": "call",
  "direction": "outbound",
  "subject": "Course inquiry",
  "content": "Discussed B.Sc Nautical Science program",
  "duration": 300,
  "outcome": "Interested, will follow up"
}
```

### Configuration

#### GET /api/crm/config

Get CRM configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "leadStatuses": [...],
    "leadSources": [...],
    "courses": [...],
    "leadPriorities": [...],
    "leadStages": [...],
    "taskTypes": [...],
    "communicationTypes": [...]
  }
}
```

### Dashboard

#### GET /api/crm/dashboard

Get dashboard data.

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "leads": {...},
      "tasks": {...},
      "followUps": {...}
    },
    "recentLeads": [...],
    "todaysTasks": [...],
    "overdueFollowUps": [...],
    "widgets": [...]
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 422 | Invalid input data |
| NOT_FOUND | 404 | Resource not found |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Permission denied |
| DUPLICATE | 409 | Resource already exists |
| INVALID_TRANSITION | 400 | Invalid status transition |
| INTERNAL_ERROR | 500 | Server error |

---

## Rate Limiting

- 100 requests per minute per IP
- 1000 requests per hour per user

---

## Webhooks (Coming Soon)

The system will support webhooks for:
- Lead created
- Lead status changed
- Lead converted
- Task completed
