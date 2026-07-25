# API Reference

All authenticated endpoints require a valid Auth.js session cookie (established by logging in through `/login`). Requests without one receive `401`. Admin-only endpoints return `403` for a Member session.

Every response follows the same envelope:

```json
{ "success": true, "message": "...", "data": { } }
{ "success": false, "message": "...", "errors": { "field": ["reason"] } }
```

## Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create a new Member account. |
| POST | `/api/auth/login` | Public | Validate credentials (API-client convenience — see note in `app/api/auth/login/route.ts`; the browser login form uses Auth.js's own callback route to establish the session cookie). |
| * | `/api/auth/[...nextauth]` | — | Auth.js internal routes (session callback, signout, CSRF token, etc). |

## Public

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/public/lead` | Public, rate-limited (5/min/IP) | Landing-page lead form. Honeypot field silently drops bot submissions. Always creates the lead with `status = NEW`. |

## Leads

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/leads` | Session | List leads. Admins see all; Members see only leads assigned to them. Query params: `page`, `limit` (max 100), `search`, `status`, `source`, `assignedToId`, `dateFrom`, `dateTo`, `sortBy` (`createdAt`\|`updatedAt`\|`name`\|`status`), `sortOrder` (`asc`\|`desc`). |
| POST | `/api/leads` | Session (create permission) | Create a lead. |
| GET | `/api/leads/:id` | Session, scoped | Get one lead with assignments, notes, and activity. |
| PATCH | `/api/leads/:id` | Session, scoped | Update a lead. Members may only send `{ status }`; any other field is admin-only. |
| DELETE | `/api/leads/:id` | Admin only | Delete a lead (cascades notes/activity/assignments). |
| POST | `/api/leads/:id/assign` | Admin only | Body: `{ assignedToId }`. Deactivates the previous assignment and creates a new one; full history preserved in `lead_assignments`. |
| POST | `/api/leads/:id/notes` | Session, scoped | Body: `{ text }`. |
| DELETE | `/api/leads/:id/notes/:noteId` | Admin only | Delete a note. |
| GET | `/api/leads/:id/activity` | Session, scoped | Full activity timeline, newest first. |

## Users

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/users` | Admin only | List every user (id, name, email, role, createdAt). |
| POST | `/api/users` | Admin only | Body: `{ name, email, password, role }`. Create a user directly (bypasses self-registration). |
| PATCH | `/api/users/:id` | Admin only | Body: `{ name?, role? }`. |

## Status codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Resource created |
| 401 | Not authenticated |
| 403 | Authenticated but not permitted (RBAC) |
| 404 | Resource not found |
| 409 | Conflict (e.g. duplicate email) |
| 422 | Validation failed (Zod) — see `errors` field |
| 429 | Rate limited (public lead form) |
| 500 | Unhandled server error (stack trace never exposed) |
