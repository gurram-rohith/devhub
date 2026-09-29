# DevHub

**A multi-tenant workspace and event management platform for developer communities and engineering teams.** Organize events, track team tasks, and manage per-workspace roles, all in one hub.

**Live demo:** [devhub-silk-six.vercel.app](https://devhub-silk-six.vercel.app)
**API:** `https://devhub-rj5t.onrender.com/api`

> The backend runs on Render's free tier, so the first request after a period of inactivity can take 30-50 seconds while the server wakes up.

### Try it without signing up

| Role | Email | Password |
|---|---|---|
| Admin (Frontend Guild) | `sarah@devhub.demo` | `password123` |
| Member | `alex@devhub.demo` | `password123` |

Log in as both in separate browsers to see how the same workspace looks to an admin and to a member.

---

## Screenshots

<!-- Add screenshots or a demo GIF to a /docs folder and reference them here -->
<!-- ![Dashboard](docs/dashboard.png) -->
<!-- ![Events](docs/events.png) -->
<!-- ![Tasks](docs/tasks.png) -->

---

## Features

- **Authentication:** register and log in with bcrypt-hashed passwords and JWT-based sessions. The session is restored on page refresh.
- **Multi-tenant workspaces:** create a workspace, share a 6-character invite code, and let others join. Each workspace is fully isolated from the others.
- **Workspace-scoped RBAC:** roles belong to the *membership*, not the user. The same person can be an admin of one workspace and a member of another.
- **Event scheduler:** events have a start time, end time, location, meeting link, and capacity. Status is derived from the schedule (Upcoming / Live now / Ended), and the join link is hidden once the event ends.
- **Race-condition-safe RSVP:** capacity and duplicate checks happen atomically in the database (see below).
- **Task tracker:** admins assign tasks with priority and due date. Members can update the status of tasks assigned to them, and admins can update any task. Tasks can be filtered to "My Tasks".
- **Dashboard analytics:** member count, upcoming events, and a task breakdown pie chart, computed with a MongoDB aggregation pipeline.
- **Validation and error handling:** inline form validation on the client, zod schemas on the server, and one centralized error handler with a consistent JSON shape.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6, Axios, Tailwind CSS v4, Recharts, date-fns, react-hot-toast |
| Backend | Node.js, Express 4, Mongoose 8 (ES modules) |
| Database | MongoDB (Atlas in production) |
| Auth | JSON Web Tokens, bcryptjs |
| Validation | zod |
| Security | helmet, cors, express-rate-limit, express-mongo-sanitize |
| Hosting | Vercel (client), Render (API), MongoDB Atlas (database) |

---

## Architecture

```
┌────────────────────────── React (Vite) ───────────────────────────┐
│ Pages · Components · AuthContext · Axios instance                  │
│ ProtectedRoute → redirects unauthenticated users to /login         │
│ Request interceptor: attaches "Authorization: Bearer <JWT>"        │
│ Response interceptor: on 401, clears session and redirects         │
└───────────────────────────────┬────────────────────────────────────┘
                                │ HTTPS / JSON
┌───────────────────────────────▼────────────────────────────────────┐
│ Express                                                            │
│ helmet → cors → json(10kb limit) → mongoSanitize → routes          │
│                                                                    │
│ route → protect (JWT) → role/membership check → validate → controller
│                                                                    │
│ errorHandler (last middleware, one JSON error shape)               │
└───────────────────────────────┬────────────────────────────────────┘
                                │ Mongoose
┌───────────────────────────────▼────────────────────────────────────┐
│ MongoDB:  users · workspaces · events · tasks                      │
└────────────────────────────────────────────────────────────────────┘
```

### Data model

```
User      { name, email (unique), password (select: false) }
Workspace { name, description, inviteCode (unique), owner → User,
            members: [{ user → User, role: 'admin' | 'member', joinedAt }] }
Event     { workspace → Workspace, title, description, startTime, endTime,
            location, meetingUrl, maxCapacity, tags, createdBy → User,
            attendees: [→ User] }
Task      { workspace → Workspace, title, description, assignedTo → User,
            assignedBy → User, priority, dueDate,
            status: 'To Do' | 'In Progress' | 'Completed' }
```

---

## Key Design Decisions

### 1. Roles are scoped to the workspace, not the user

A global `role` field on the user would let anyone pick "Admin" at sign-up, and it would make "admin" mean "admin of everything." Instead, the role lives on each entry in `workspace.members`. The JWT contains only `{ id }`, and the role is looked up on every request, so removing or demoting someone takes effect immediately, even if they still hold a valid token.

Authorization is enforced on the server for every workspace-scoped route. For routes where the URL only contains an event or task ID, the resource is loaded first and its `workspace` field is checked against the caller's membership. This prevents a member of workspace A from touching data in workspace B. The frontend hides controls the user can't use, but that is a UX convenience only, not the security boundary.

### 2. Atomic RSVP

A naive RSVP reads the event, checks `attendees.length < maxCapacity`, then pushes the user. Two simultaneous requests for the last seat can both pass the check before either writes, which overbooks the event. DevHub sends the check and the write to MongoDB as a single operation:

```js
const updated = await Event.findOneAndUpdate(
  {
    _id: id,
    attendees: { $ne: userId },                                   // not already registered
    $expr: { $lt: [{ $size: '$attendees' }, '$maxCapacity'] },    // seats remain
  },
  { $addToSet: { attendees: userId } },
  { new: true }
);
// null → the event is full or the user already RSVPed
```

MongoDB applies writes to a single document one at a time, so there is no window between the check and the write.

### 3. Centralized error handling

Controllers throw an `AppError(message, statusCode)` and are wrapped in an `asyncHandler`. One error middleware translates Mongoose validation errors, duplicate keys, bad ObjectIds, and JWT errors into clean 4xx responses. Unexpected errors are logged server-side and returned to the client as a generic 500 message.

---

## Permission Matrix

Evaluated **per workspace**.

| Action | Member | Admin |
|---|:---:|:---:|
| Join a workspace with an invite code | ✅ | ✅ |
| View workspace events, tasks, and members | ✅ | ✅ |
| RSVP / cancel RSVP | ✅ | ✅ |
| Update status of a task assigned to them | ✅ | ✅ |
| Update status of any task | ❌ | ✅ |
| Create / delete events | ❌ | ✅ |
| Create / assign / delete tasks | ❌ | ✅ |
| Remove members | ❌ | ✅ |
| Delete the workspace | ❌ | ✅ |

Any authenticated user can create a workspace and becomes its admin.

---

## API Reference

All routes except `register` and `login` require `Authorization: Bearer <token>`.

**Auth**

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account, returns a JWT |
| POST | `/api/auth/login` | Log in, returns a JWT |
| GET | `/api/auth/me` | Current user profile |

**Workspaces**

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/workspaces` | Any user (creator becomes admin) |
| GET | `/api/workspaces` | Workspaces the user belongs to |
| POST | `/api/workspaces/join` | Join with `{ inviteCode }` |
| GET | `/api/workspaces/:id` | Members (populated member details) |
| DELETE | `/api/workspaces/:id` | Admin (also deletes its events and tasks) |
| DELETE | `/api/workspaces/:id/members/:userId` | Admin |
| GET | `/api/workspaces/:workspaceId/stats` | Members |

**Events**

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/events` | Admin |
| GET | `/api/events/workspace/:workspaceId` | Members |
| POST | `/api/events/:id/rsvp` | Members |
| DELETE | `/api/events/:id/rsvp` | Members |
| DELETE | `/api/events/:id` | Admin |

**Tasks**

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/tasks` | Admin |
| GET | `/api/tasks/workspace/:workspaceId?status=&assignedTo=me` | Members |
| PATCH | `/api/tasks/:id/status` | Assignee or admin |
| DELETE | `/api/tasks/:id` | Admin |

---

## Project Structure

```
devhub/
├── client/
│   └── src/
│       ├── api/            axios instance + per-resource API functions
│       ├── context/        AuthContext (session state and restore)
│       ├── components/     Navbar, ProtectedRoute, EventsTab, TasksTab, MembersTab
│       └── pages/          Login, Register, Workspaces, WorkspaceDetail
└── server/
    └── src/
        ├── config/         database connection
        ├── models/         User, Workspace, Event, Task
        ├── middleware/     auth (JWT), workspaceAccess (RBAC), validate, errorHandler
        ├── controllers/    auth, workspace, event, task, stats
        ├── routes/         route definitions and middleware chains
        ├── validators/     zod schemas
        ├── utils/          AppError, asyncHandler, generateToken
        ├── app.js          Express app (no listen, so it stays testable)
        ├── server.js       env loading, DB connection, listen
        └── seed.js         demo data script
```

---

## Running Locally

**Prerequisites:** Node.js 20+, and a MongoDB instance (local, Docker, or Atlas).

```bash
git clone https://github.com/<your-username>/devhub.git
cd devhub
```

**Backend**

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/devhub
JWT_SECRET=<a long random string>
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

```bash
npm run dev        # starts the API on http://localhost:5000
npm run seed       # optional: populate demo data (this wipes existing data)
```

**Frontend**

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev        # starts the app on http://localhost:5173
```

---

## Deployment

| Service | Root directory | Notes |
|---|---|---|
| MongoDB Atlas | n/a | Database user with read/write access, network access set for Render |
| Render (API) | `server` | Build: `npm install`, Start: `npm start`. Set `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL` |
| Vercel (client) | `client` | Set `VITE_API_URL` to the Render URL plus `/api`. `vercel.json` rewrites all paths to `index.html` for client-side routing |

`CLIENT_URL` on Render must exactly match the deployed frontend origin, with no trailing slash, or the browser will block requests with a CORS error.

---

## Security

- Passwords hashed with bcrypt and never returned by default (`select: false`)
- Login returns the same error for an unknown email and a wrong password, which prevents account enumeration
- JWTs carry only the user ID, and roles are resolved from the database on every request
- Every workspace-scoped route verifies membership, giving tenant isolation
- `helmet` security headers, CORS restricted to the frontend origin, a 10kb JSON body limit, and NoSQL-injection sanitization
- Rate limiting on the authentication routes
- Request validation with zod on the server, plus client-side validation for immediate feedback

---

## Known Limitations and Future Work

- The API was tested manually (Thunder Client) and through the UI. Automated tests (Supertest with an in-memory MongoDB, including a concurrent-RSVP test) are the next step.
- No real-time sync. Other users see changes after a refresh or navigation. Socket.IO or polling would address this.
- The event status (Live / Ended) is derived from the scheduled start and end times, not from the meeting platform itself.
- Edit endpoints for events, tasks, and workspaces, and a "leave workspace" action, are not implemented yet.
- The JWT is stored in `localStorage`. Moving to httpOnly cookies with refresh tokens would reduce XSS exposure.
- Possible extensions: waitlist with auto-promotion, Kanban drag-and-drop, activity feed, calendar export.

---

## Author

**Rohith** · Data Science, VNR VJIET
Built as a full-stack  project to demonstrate role-based access control, relational data modeling in MongoDB, and safe concurrent writes.
