# ProjectFlow — Collaborative Project Management Tool

**ProjectFlow** is a full-stack collaborative project management application developed for the **CodeAlpha Full Stack Development Internship (TASK 3 – Project Management Tool)**. Inspired by modern SaaS workflows like Trello and Asana, ProjectFlow enables teams to create group projects, manage participants, assign tasks across customizable priorities and due dates, track workflow transitions on an interactive 4-column Kanban board, and communicate directly through task comment threads.

---

## 🚀 Key Features

### 🔐 Authentication & Security
- **JWT Authentication in HTTP-Only Cookies:** Cross-Site Scripting (XSS) resistant session handling with optional Bearer fallback.
- **Password Security:** Salted password hashing via `bcryptjs` (min 8 characters, confirmation validation).
- **Session Management:** Centralized auth context with seamless `/api/auth/me` verification and flash-free protected routes.
- **Security Middleware:** `helmet` security headers, CORS origin protection, and rate limiting on sensitive auth endpoints.

### 📊 Dashboard & Metrics
- **Real Aggregated Statistics:** My Projects count, My Open Tasks count, Tasks Due This Week (rolling 7 days), and Overdue tasks.
- **Project Progress:** Dynamic completion percentage calculations (`completed / total tasks`) with visual progress bars.
- **Tasks Due Soon:** Chronologically sorted upcoming tasks with overdue alerts.
- **Recent Activity Feed:** Audit trail of recent task modifications across all accessible projects.

### 📁 Group Projects & Team Collaboration
- **Project Management:** Create, view, edit, and delete group projects.
- **Project Ownership:** Dedicated project creator ownership permissions.
- **Member Management:** Add registered users by exact email (fixed `Member` role), search members, and remove members with automatic task unassignment.
- **Cascading Deletes:** Deleting a project safely purges all dependent tasks and comments from MongoDB.

### 📋 4-Column Kanban Board
- **Exact 4-Status Workflow:** `To Do` (`todo`), `In Progress` (`in_progress`), `Review` (`review`), and `Completed` (`completed`).
- **Interactive Drag-and-Drop:** Native HTML5 drag-and-drop card movements with optimistic UI updates and server rollback on network errors.
- **Task Attributes:** Title, description, exact 3 priorities (`Low`, `Medium`, `High`), due dates with overdue warnings, and assignee avatars.
- **Live Filtering:** Instant search by keyword, filter by assignee, and filter by priority with a one-click reset.

### 💬 Threaded Task Comments
- **Collaborative Discussions:** Real-time chronological discussion thread inside every task modal.
- **Moderation Permissions:** Authors and project owners can delete comments.
- **Comment Counters:** Dynamic comment counts displayed on project cards, Kanban cards, and table rows.

### ✅ My Tasks & Batch Actions
- **Personalized Task Hub:** View all tasks assigned to the authenticated user across all projects.
- **Quick Status Toggles:** Inline dropdown to move task status directly from table rows.
- **Batch Operations:** Multi-select tasks for batch **Mark as Completed** or batch **Reschedule**.
- **Filter Tabs:** Filter by `All Tasks`, `Due Today`, `Overdue`, and `Completed`.

### 👤 Profile & User Preferences
- **Profile Management:** Edit full name with immediate UI updates across avatars and comments.
- **Account Identity:** Read-only unique email display.
- **Session Termination:** Secure logout with confirmation modal.

---

## 🛠 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router v6, Axios, Lucide React, CSS Variables |
| **Backend** | Node.js, Express.js, Mongoose ODM |
| **Database** | MongoDB (Production/Local), MongoDB Memory Server (Automated Testing) |
| **Security & Auth** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `cookie-parser`, `helmet`, `express-rate-limit` |
| **Testing** | Jest, Supertest, Custom 19-Step Automated Acceptance Suite |

---

## 📁 Project Structure

```
CodeAlpha_ProjectManagementTool/
├── package.json               # Root scripts (concurrently dev runner)
├── README.md                  # Project documentation
├── .gitignore                 # Node, env, and build ignore rules
├── backend/
│   ├── package.json           # Backend dependencies & test scripts
│   ├── .env.example           # Backend environment variable template
│   └── src/
│       ├── server.js          # HTTP server bootstrap & graceful shutdown
│       ├── app.js             # Express app setup, middleware & route mounting
│       ├── config/            # DB connection & environment parser
│       ├── models/            # Mongoose schemas (User, Project, Task, Comment)
│       ├── middleware/        # Auth, error handling, rate limiting, ObjectId validator
│       ├── controllers/       # Auth, User, Project, Member, Task, Comment, Dashboard, Search
│       ├── routes/            # REST API route declarations
│       └── tests/             # Jest unit/integration tests & acceptance runner
└── frontend/
    ├── package.json           # Frontend dependencies & build scripts
    ├── vite.config.js         # Vite configuration with /api backend proxy
    ├── index.html             # Single-page HTML entrypoint with typography imports
    └── src/
        ├── main.jsx           # React DOM root with providers
        ├── App.jsx            # React Router setup with ProtectedRoute guards
        ├── api/               # Centralized Axios client with error interceptors
        ├── context/           # AuthContext & ToastContext providers
        ├── styles/            # CSS variables & design tokens
        ├── components/
        │   ├── common/        # Button, Input, Modal, ConfirmDialog, Badge, Avatar, Skeleton, EmptyState
        │   ├── layout/        # AppLayout, Sidebar, Topbar
        │   ├── projects/      # ProjectCard, ProjectModal
        │   ├── tasks/         # KanbanBoard, TaskCard, TaskModal, TaskDetailModal
        │   └── members/       # AddMemberModal
        └── pages/             # Dashboard, Projects, KanbanBoard, ProjectMembers, MyTasks, Profile, Login, Register, NotFound
```

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new user account
- `POST /api/auth/login` — Sign in and receive HTTP-only session cookie
- `GET /api/auth/me` — Retrieve current authenticated user profile
- `POST /api/auth/logout` — Invalidate session and clear auth cookie

### Users (`/api/users`)
- `PATCH /api/users/me` — Update authenticated user's display name

### Projects (`/api/projects`)
- `GET /api/projects` — List accessible projects (`?filter=all|owned|joined&search=...`)
- `POST /api/projects` — Create a new project
- `GET /api/projects/:projectId` — Retrieve project metadata & metrics
- `PATCH /api/projects/:projectId` — Update project name, description, or due date (Owner only)
- `DELETE /api/projects/:projectId` — Delete project and cascade delete tasks & comments (Owner only)

### Project Members (`/api/projects/:projectId/members`)
- `GET /api/projects/:projectId/members` — List project participants (Owner + Members)
- `POST /api/projects/:projectId/members` — Add registered user by exact email (Owner only)
- `DELETE /api/projects/:projectId/members/:userId` — Remove member and unassign their tasks (Owner only)

### Tasks (`/api/projects/:projectId/tasks` & `/api/tasks`)
- `GET /api/projects/:projectId/tasks` — List tasks for project (`?status=&priority=&assignee=&search=`)
- `POST /api/projects/:projectId/tasks` — Create task within project
- `GET /api/tasks/my` — Get tasks assigned to current user (`?filter=all|due_today|overdue|completed`)
- `GET /api/tasks/:taskId` — Get single task details
- `PATCH /api/tasks/:taskId` — Update task details, priority, due date, assignee
- `PATCH /api/tasks/:taskId/status` — Quick status transition (`{ "status": "in_progress" }`)
- `DELETE /api/tasks/:taskId` — Delete task and its comments (Project Owner or Task Creator)
- `PATCH /api/tasks/batch/complete` — Batch mark tasks as completed
- `PATCH /api/tasks/batch/reschedule` — Batch update task due dates

### Comments (`/api/tasks/:taskId/comments` & `/api/comments`)
- `GET /api/tasks/:taskId/comments` — Retrieve chronological comments for task
- `POST /api/tasks/:taskId/comments` — Post new comment
- `DELETE /api/comments/:commentId` — Delete comment (Author or Project Owner)

### Dashboard & Search
- `GET /api/dashboard/stats` — Real calculated dashboard metrics & recent activity
- `GET /api/search?q=...` — Global search scoped to user's authorized projects and tasks

---

## ⚡ Getting Started

### Prerequisites
- **Node.js** v18+ (tested on Node.js v24)
- **MongoDB** running locally on `localhost:27017` or a MongoDB Atlas URI

### 1. Environment Setup

Create `backend/.env` based on `backend/.env.example`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/projectflow
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 2. Install Dependencies

From the project root:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 3. Run Development Server

Run both frontend and backend concurrently from the root directory:
```bash
npm run dev
```

Or run separately:
- **Backend:** `cd backend && npm run dev` (Runs on `http://localhost:5000`)
- **Frontend:** `cd frontend && npm run dev` (Runs on `http://localhost:5173`)

---

## 🧪 Testing & Verification

### Run Backend Jest Test Suites
```bash
cd backend
npm test
```
*Executes all authentication and project/task integration test suites (19/19 passing).*

### Run Automated Acceptance Verification Suite
```bash
cd backend
node src/tests/acceptance.js
```
*Executes an automated end-to-end 19-step verification of multi-user registration, project creation, member assignment, Kanban status transitions, comments persistence, cascading deletes, and authorization boundaries.*

### Build Frontend for Production
```bash
cd frontend
npm run build
```
*Generates optimized production bundle in `frontend/dist/` with 0 errors.*

---

## 📜 CodeAlpha Internship Submission
- **Internship Track:** Full Stack Web Development
- **Project Task:** TASK 3 – Project Management Tool
- **Developer:** Menura Dilmith
- **Repository:** [https://github.com/Menura19/CodeAlpha_ProjectManagementTool](https://github.com/Menura19/CodeAlpha_ProjectManagementTool)