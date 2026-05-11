# Bob Frontend — Implementation Plan

## Overview

Social media platform frontend connecting to a Laravel 12 + Sanctum REST API.
Stack: **React 19 + Vite**, **Tailwind CSS v4**, **shadcn/ui** (desktop), **react-vant** (mobile).

---

## Tech Decisions

| Concern | Solution |
|---|---|
| HTTP client | `axios` with base URL + Sanctum bearer token interceptor |
| Global state | `zustand` — auth store, user store |
| Routing | `react-router-dom` v7 |
| Forms | `react-hook-form` + `zod` validation |
| Data fetching | `@tanstack/react-query` (cache, pagination, mutations) |
| UI desktop | shadcn/ui components |
| UI mobile | react-vant components |
| Icons | lucide-react |

---

## Project Structure

```
src/
├── api/              # axios instance + per-resource API functions
├── components/
│   ├── ui/           # shadcn auto-generated
│   └── shared/       # reusable cross-feature components
├── features/
│   ├── auth/
│   ├── feed/
│   ├── posts/
│   ├── comments/
│   ├── reports/
│   ├── dashboard/
│   └── admin/
│       ├── users/
│       ├── posts/
│       ├── comments/
│       ├── reports/
│       ├── bans/
│       ├── pages/
│       ├── settings/
│       └── activity-logs/
├── hooks/            # shared custom hooks
├── lib/              # utils, cn, zod schemas
├── routes/           # route definitions + guards
└── store/            # zustand stores
```

---

## Phase 1 — Foundation

### 1.1 Install dependencies
```bash
npm install axios zustand react-router-dom react-hook-form zod @hookform/resolvers
npm install @tanstack/react-query lucide-react
```

### 1.2 API client (`src/api/client.js`)
- axios instance with `baseURL: http://localhost:8000/api`
- Request interceptor: attach `Authorization: Bearer <token>` from localStorage
- Response interceptor: on 401 → clear token → redirect to `/login`

### 1.3 Auth store (`src/store/authStore.js`)
- State: `user`, `token`, `isAuthenticated`
- Actions: `setAuth(user, token)`, `logout()`
- Persist token to `localStorage`

### 1.4 Route guards (`src/routes/`)
- `<PrivateRoute>` — redirect to `/login` if not authenticated
- `<AdminRoute>` — redirect to `/` if role not in `[moderator, admin, super_admin]`
- `<GuestRoute>` — redirect to `/feed` if already authenticated

---

## Phase 2 — Authentication Pages

### Routes
| Path | Component | Guard |
|---|---|---|
| `/login` | `LoginPage` | Guest |
| `/register` | `RegisterPage` | Guest |

### API calls (`src/api/auth.js`)
- `POST /auth/register` → `{ name, email, password, password_confirmation }`
- `POST /auth/login` → `{ email, password }`
- `POST /auth/logout`
- `GET /auth/me`
- `PATCH /auth/me`
- `PATCH /auth/password`
- `DELETE /auth/me`

### Components
- `LoginForm` — email + password fields, zod validation
- `RegisterForm` — name + email + password + confirm password

---

## Phase 3 — User Feed & Posts

### Routes
| Path | Component | Guard |
|---|---|---|
| `/feed` | `FeedPage` | Private |
| `/posts/:uuid` | `PostDetailPage` | Private |
| `/my-posts` | `MyPostsPage` | Private |

### API calls (`src/api/posts.js`)
- `GET /feed?page=N` — paginated feed (15/page)
- `GET /posts/mine?page=N`
- `POST /posts` — `{ body }`
- `GET /posts/:uuid`
- `DELETE /posts/:uuid`
- `POST /posts/:uuid/like` — `{ type: 'like'|'love'|'haha'|'wow'|'sad'|'angry'|'bookmark' }`

### Components
- `PostCard` — body, author, timestamp, like count, reaction picker, report button
- `PostFeed` — infinite scroll or paginated list using react-query
- `CreatePostForm` — textarea (max 10,000 chars) + submit
- `ReactionPicker` — 6 reaction types + bookmark (react-vant Popup on mobile)
- `PostDetail` — full post + comment thread

---

## Phase 4 — Comments

### API calls (`src/api/comments.js`)
- `POST /posts/:uuid/comments` — `{ body, parent_id? }`
- `DELETE /comments/:uuid`
- `POST /comments/:uuid/like` — `{ type }`

### Components
- `CommentThread` — recursive render of nested replies
- `CommentItem` — body, author, like, reply button, delete (own)
- `CommentForm` — textarea (max 5,000 chars), supports reply context

---

## Phase 5 — Reports

### API calls (`src/api/reports.js`)
- `GET /reports/mine`
- `POST /reports` — `{ type: 'post'|'comment'|'user', id: uuid, reason }`

### Components
- `ReportModal` — reason textarea + type select (shadcn Dialog)
- `MyReportsPage` — list of filed reports with statuses

---

## Phase 6 — Dashboard

### Route: `/dashboard`

### API calls (`src/api/dashboard.js`)
- `GET /dashboard` — stats: posts, comments, reactions, trends, engagement series

### Components
- `StatsCards` — posts count, comments count, reactions count
- `EngagementChart` — 8-month series (recharts or similar)
- `WeeklyGoal` — progress toward 20 posts/week goal

---

## Phase 7 — User Settings

### Route: `/settings`

### Components
- `ProfileForm` — update name/email
- `PasswordForm` — change password
- `DeleteAccountSection` — confirmation dialog

---

## Phase 8 — Admin Panel

Base route: `/admin` (requires `moderator|admin|super_admin` role)

### 8.1 Admin Dashboard
- `GET /admin/dashboard` — system stats + 30-day trends
- Cards: total users, posts, pending reports, active bans
- Charts: signups trend, posts trend

### 8.2 Users Management `/admin/users`
- List with search, role filter, ban filter — paginated (25/page)
- User detail: bans history, reports against, activity
- Actions: edit, ban (permanent or with expiry), unban, assign role (super_admin only), delete

### 8.3 Posts Management `/admin/posts`
- List with status filter (active/flagged/hidden), search
- Actions: edit body, change status (flag/hide/activate), delete

### 8.4 Comments Management `/admin/comments`
- List with search, filter by post
- Actions: edit, delete

### 8.5 Reports Management `/admin/reports`
- List with status counts (pending/reviewed/resolved/dismissed)
- Report detail: reporter, reportable content, resolution history
- Actions: mark reviewed, resolve (with note), dismiss

### 8.6 Bans Management `/admin/bans`
- List with active/total counts
- Create ban: user select, reason, optional expiry
- Lift ban

### 8.7 Pages (CMS) `/admin/pages`
- List pages with status (draft/published)
- Create/edit: slug, title, body (markdown or rich text), status

### 8.8 Settings `/admin/settings`
- List settings grouped by `group` key
- Edit key-value pairs

### 8.9 Activity Logs `/admin/activity-logs`
- Read-only list with filters: action, admin, date range
- Before/after JSON diff display

---

## Phase 9 — Layout & Navigation

### Layouts
- `AppLayout` — top nav, sidebar (desktop), bottom nav bar (mobile via react-vant Tabbar)
- `AdminLayout` — admin sidebar with all admin sections
- `AuthLayout` — centered card, no nav

### Navigation (authenticated user)
- Feed, My Posts, Dashboard, Reports, Settings, Logout

### Navigation (admin+)
- All above + Admin dropdown: Dashboard, Users, Posts, Comments, Reports, Bans, Pages, Settings, Logs

---

## Phase 10 — Mobile Responsiveness

Use **react-vant** components for mobile-specific UX:
- `Tabbar` — bottom navigation on mobile
- `PullRefresh` — pull-to-refresh on Feed
- `List` — infinite scroll list
- `Popup` / `ActionSheet` — reaction picker, report modal, more options
- `NavBar` — mobile top bar
- `SwipeCell` — swipe actions on post/comment cards

Use **shadcn/ui** for desktop:
- `NavigationMenu`, `DropdownMenu`, `Dialog`, `Sheet`, `Table`, `Card`

Breakpoint strategy: mobile-first, `md:` prefix for desktop layouts.

---

## API Error Handling

| Status | Handling |
|---|---|
| 401 | Clear token, redirect to `/login` |
| 403 | Show "Forbidden" toast |
| 404 | Show "Not found" page |
| 409 | Show conflict message (e.g. duplicate report) |
| 422 | Map validation errors to form fields |
| 500 | Generic error toast |

---

## Implementation Order

1. Foundation (axios, stores, router, guards)
2. Auth pages (login, register)
3. Feed + Posts
4. Comments
5. Likes/Reactions
6. Reports
7. Dashboard
8. Settings
9. Admin panel
10. Mobile polish (react-vant integration)
