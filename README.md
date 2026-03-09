## 🎬 CineScope

Discover movies beyond the screen with a cinematic, authenticated dashboard, personal library (favorites, watchlist, history), and an admin console — powered by TMDB, MongoDB, Redis, and a modern React/Vite frontend.

---

## 📖 Project Overview

CineScope is a production-grade, full‑stack movie discovery and personal library platform.

- **Target users**
  - Movie enthusiasts exploring trending / popular titles and rich metadata.
  - Admins curating a catalog and moderating users.

- **User experience**
  - Browse trending and popular movies, TV shows, and people via TMDB.
  - Maintain a **personal watchlist**, **favorites**, and **watch history**.
  - Secure **email-based authentication** with verification, login, and password reset.
  - Persistent library across devices via Redux + localStorage + backend sync.

- **Admin experience**
  - Admin console for managing curated movies and user accounts (ban / unban / delete).
  - Role‑aware routing with dedicated `/admin` area.

- **High-level architecture**
  - `client` – React SPA (Vite) with protected routing, Redux Toolkit, RTK Query, and a Netflix + Amazon‑inspired search experience.
  - `server` – Express API with JWT auth, MongoDB models, Redis caching, TMDB proxy, advanced rate limiting, and Prometheus metrics.

---

## 🧰 Tech Stack

- **Frontend (client)**
  - **Framework**: React 19, React DOM
  - **Build tool**: Vite 7 (`vite`, `@vitejs/plugin-react-swc`)
  - **Routing**: `react-router-dom` (nested + protected routing)
  - **State management**:
    - Redux Toolkit (`@reduxjs/toolkit`, `react-redux`)
    - RTK Query‑style APIs in `src/services`
    - Custom `AuthProvider` (React Context) as source of truth for auth/session
  - **Styling & UI**:
    - Tailwind CSS 4 (`tailwindcss`, `@tailwindcss/vite`)
    - `lucide-react` icons
    - Netflix‑style skeletons and cards
  - **Networking**:
    - Axios client with **automatic token injection** and **401 refresh handling**
    - Base URL from `VITE_API_BASE_URL`
  - **UX Enhancements**:
    - GSAP + ScrollTrigger animations
    - Lenis smooth scrolling
    - `react-hot-toast` notifications
    - Zod for validation where applicable

- **Backend (server)**
  - **Runtime & Framework**: Node.js (ESM) + Express
  - **Database**: MongoDB (Mongoose models for `User`, `Movie`, `Watchlist`, `Favorite`, `WatchHistory`, `RefreshToken`)
  - **Authentication & Security**:
    - JWT (HS256) access & refresh tokens
    - Bcrypt password hashing (`bcrypt`)
    - HttpOnly, secure, `sameSite=strict` refresh cookies
    - Token rotation and revocation via `RefreshToken` collection + `tokenVersion`
  - **Caching & Queues**:
    - Redis (`ioredis`) for token blacklist, user cache, rate‑limit state
    - Optional BullMQ for background jobs
  - **Email & OTP**:
    - `nodemailer` + `mjml` templates
    - Email verification & password reset OTP flows
  - **Third‑party APIs**:
    - TMDB proxy routes for trending, search, movie details, images, credits, videos, and genres
  - **Metrics & Observability**:
    - `prom-client` metrics on `/metrics`
    - Performance logging for auth and TMDB flows

- **Tooling**
  - Client: Vite, ESLint 9, React Fast Refresh
  - Server: Nodemon for dev, Jest + Supertest + `mongodb-memory-server` for tests

---

## 📁 Project Structure

```bash
movie/
├── client/                      # React frontend (Vite)
│   ├── src/
│   │   ├── api/                 # Axios-based auth helpers & HTTP client
│   │   ├── components/          # Navbar, hero, cards, admin layout, search UI, etc.
│   │   ├── context/             # ThemeContext, AuthProvider
│   │   ├── hooks/               # useAuth, useSearch, useSearchSuggestions, debounce, Lenis, etc.
│   │   ├── pages/               # Dashboard, auth, admin, library, search pages
│   │   ├── services/            # RTK Query APIs (tmdb, library, admin, genres)
│   │   ├── slices/              # Redux slices (auth, ui, library)
│   │   ├── store/               # Redux store + persistence middleware
│   │   ├── utils/               # Validation, formatters, fallbacks
│   │   ├── App.jsx
│   │   └── router.jsx           # Route definitions & guards
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                      # Node/Express backend
│   ├── src/
│   │   ├── config/              # db.js (Mongo), redis config
│   │   ├── middleware/          # auth, roles, rateLimiter, advancedRateLimiter, error handler
│   │   ├── models/              # User, Movie, Watchlist, Favorite, WatchHistory, RefreshToken
│   │   ├── routes/              # auth, user, favorites, watchlist, history, admin, tmdb, genres, health
│   │   ├── utils/               # jwt, redis, mailer, emailHash, tokenBlacklist, OTP, logger, metrics
│   │   ├── app.js               # Express app, middleware wiring
│   │   └── server.js            # Bootstrap & graceful shutdown
│   ├── migrations/
│   ├── tests/                   # Jest + Supertest suites
│   ├── RATE_LIMITING_GUIDE.md   # Advanced rate-limiting design
│   ├── README.md                # Server-specific README
│   └── package.json
│
│
└── README.md                    # Root README (this file)
```

---

## 🛠 Installation & Local Development

### 1. Clone the repository

```bash
git clone <your-repo-url> movie
cd movie
```

### 2. Backend setup (`server`)

```bash
cd server
npm install
```

Create `server/.env` (see **Environment Variables** below), then:

```bash
# Development (nodemon)
npm run dev

# Production-style
npm start
```

Server listens on **`PORT`** (default: `4000`).

### 3. Frontend setup (`client`)

In another terminal:

```bash
cd client
npm install
```

Create `client/.env` (see **Environment Variables** below), then:

```bash
npm run dev
```

Vite dev server runs at `http://localhost:5173`. Ensure `FRONTEND_ORIGIN` on the server matches this.

---

## 📜 NPM Scripts

### Client (`client/package.json`)

- **`npm run dev`** – Start Vite dev server with React Fast Refresh.  
- **`npm run build`** – Build optimized production bundle into `dist/`.  
- **`npm run preview`** – Locally preview the built app from `dist/`.  
- **`npm run lint`** – Run ESLint over the client codebase.  

### Server (`server/package.json`)

- **`npm start`** – Run Express server via `node server.js` (production).  
- **`npm run dev`** – Run server with `nodemon` for hot reload.  
- **`npm test`** – Run Jest tests using `mongodb-memory-server`.  

---

## 🔐 Environment Variables

### Server (`server/.env`)

```env
# Core
PORT=4000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/cinescope

# JWT / Auth
ACCESS_SECRET=change-me-access
REFRESH_SECRET=change-me-refresh
# legacy-style names (also supported):
# JWT_SECRET=...
# JWT_REFRESH_SECRET=...
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=30d
REFRESH_TOKEN_EXPIRY_DAYS=30
BCRYPT_SALT_ROUNDS=10

# TMDB
TMDB_API_KEY=your_tmdb_api_key_here
EMAIL_VERIFICATION_OTP_EXPIRY_MINUTES=10

# Redis
REDIS_URL=redis://localhost:6379

# Global/API rate limiting
RATE_WINDOW_SECONDS=900
API_RATE_WINDOW_MINUTES=15
API_RATE_MAX_REQUESTS=100

# Auth-specific rate limiting
AUTH_RATE_WINDOW_MINUTES=15
AUTH_RATE_MAX_REQUESTS=5

# OTP / Password reset limiting
OTP_RATE_WINDOW_MINUTES=10
OTP_RATE_MAX_REQUESTS=5
PASSWORD_RESET_RATE_WINDOW_MINUTES=15
PASSWORD_RESET_RATE_MAX_REQUESTS=10

# Advanced rate-limiting salt & alerts
RATE_SALT=your-strong-random-salt-change-in-production-min-32-chars
RATE_LIMIT_ALERT_THRESHOLD=10

# Mailer
MAIL_HOST=smtp.yourprovider.com
MAIL_PORT=587
MAIL_USERNAME=your_smtp_username
MAIL_PASSWORD=your_smtp_password
MAIL_MAILER=smtp
MAIL_FROM_ADDRESS=no-reply@yourdomain.com
MAIL_FROM_NAME=CineScope
```

### Client (`client/.env`)

```env
VITE_API_BASE_URL=http://localhost:4000
```

---

## 🔐 Authentication & Server Details

The server is a standalone authentication and API backend (see `server/README.md` for full details).

- **JWT auth**
  - Access tokens in `Authorization: Bearer <token>`.
  - Refresh tokens stored as secure, httpOnly cookies with rotation.
  - Refresh token revocation via `RefreshToken` collection and `tokenVersion`.

- **Core auth endpoints** (all prefixed with `/api/auth`)
  - `POST /auth/register` – Register with `{ email, phone, password }`, returns tokens and user.
  - `POST /auth/login` – Login with `{ email, password }`, returns tokens and user.
  - `POST /auth/refresh` – Issue new access token from refresh cookie.
  - `POST /auth/logout` – Revoke refresh token and clear cookie.
  - `GET /auth/check-email?email=...` – Availability check.

- **User / OTP & password endpoints** (`/api/user`)
  - `POST /user/forgot-password` – Send password reset OTP (non‑disclosing).
  - `POST /user/reset-password` – Reset password with `{ email, otp, newPassword }`.
  - `POST /user/resend-otp` – Resend email verification OTP (rate‑limited).
  - `POST /user/verify-otp` – Verify email with `{ email, otp }`.
  - `POST /user/change-verification-email` – Change user email and send new OTP.

---

## 📚 Library & Admin APIs

All endpoints are prefixed with `/api`.

- **Watchlist (`/api/watchlist`)** – Auth required
  - `GET /watchlist/` – Get all watchlist items for the logged‑in user.
  - `POST /watchlist/add` – Upsert `{ movieId, movieTitle, poster?, rating? }`.
  - `DELETE /watchlist/remove/:movieId` – Remove a movie from watchlist.

- **Favorites (`/api/favorites`)** – Auth required
  - `GET /favorites/` – Get all favorites for the logged‑in user.
  - `POST /favorites/add` – Add favorite `{ movieId, movieTitle, poster?, rating? }`.
  - `DELETE /favorites/remove/:movieId` – Remove favorite.

- **Watch history (`/api/history`)** – Auth required
  - `GET /history/` – Get recent watch history sorted by `watchedAt`.
  - `POST /history/add` – Upsert `{ movieId, title, poster? }` and bump `watchedAt`.

- **Admin movies (`/api/admin/movies`)** – Admin only
  - `GET /admin/movies` – List curated movies.
  - `POST /admin/movies` – Create curated movie.
  - `PUT /admin/movies/:id` – Update curated movie by `_id`.
  - `DELETE /admin/movies/:id` – Delete curated movie.

- **Admin users (`/api/admin/users`)** – Admin only
  - `GET /admin/users` – List users (password omitted).
  - `POST /admin/users/:id/ban` – Set `isActive=false`.
  - `POST /admin/users/:id/unban` – Set `isActive=true`.
  - `DELETE /admin/users/:id` – Delete user.

---

## 🌐 TMDB Proxy & Search API

All TMDB endpoints are under `/api/tmdb` and return `{ ok, data }` (or `{ ok: false, error }`).

- **Core proxy endpoints**
  - `GET /tmdb/trending?page=n`
  - `GET /tmdb/popular?page=n`
  - `GET /tmdb/movies?page=n&with_genres=...`
  - `GET /tmdb/tv?page=n`
  - `GET /tmdb/people?page=n`
  - `GET /tmdb/movie/:id`
  - `GET /tmdb/movie/:id/full` – Details + images + credits + videos.
  - `GET /tmdb/movie/:id/images`
  - `GET /tmdb/movie/:id/credits`
  - `GET /tmdb/movie/:id/videos`
  - `GET /tmdb/search?query=...&page=n`

- **Genres**
  - `GET /genres/movies` – Proxies TMDB `/genre/movie/list`.

- **Health & metrics**
  - `GET /api/health` – Health check.
  - `GET /metrics` – Prometheus metrics when `prom-client` is installed.

### TMDB error handling & robustness (from `PRODUCTION_FIXES_SUMMARY.md`)

- TMDB-specific error parsing:
  - Proper parsing of `{ status_code, status_message }`.
  - Clear HTTP mapping (404, 429, 5xx) with structured `{ ok: false, error }`.
- Robust retry logic:
  - Up to 3 retries with exponential backoff (1s, 2s, 4s).
  - Special handling for 429 with `retry-after`.
  - Retries on 5xx, timeouts, and transient network failures.
- Failed request tracking:
  - Tracks failures per URL and short‑circuit repeated failing calls for a brief window.
- Movie vs TV detection:
  - If movie endpoint 404s, checks if ID is a TV show and returns helpful suggestion.
- Timeouts & Abort:
  - All TMDB requests have a ~10s timeout and use `AbortController`.

---

## 🚦 Advanced Rate Limiting Architecture

Based on `server/RATE_LIMITING_GUIDE.md`.

- **Redis-backed rate limiting**
  - Shared counters across instances using Redis keys:
    - `rate-limit:ip:{ip}`
    - `rate-limit:email:{emailHash}`
    - `backoff:email:{emailHash}`, `otp:resend:{emailHash}`, etc.
  - Automatic fallback to in‑memory store when Redis is unavailable.

- **Hashed email keys**
  - Emails are hashed (SHA‑256 + `RATE_SALT`) before storing in Redis.
  - Prevents leaking actual email addresses in cache or logs.

- **Dual-layer limits (Per-IP + Per-email)**
  - Layer 1: Per‑IP limiter to prevent abuse from a single IP.
  - Layer 2: Per‑email limiter to prevent brute force against one account.

- **Exponential backoff & resend rules**
  - Increasing cooldowns for repeated OTP attempts (e.g. 0s → 30s → 2m → 10m).
  - Separate, stricter limits for `/user/resend-otp`:
    - Min 30s between resends.
    - Max ~3 resends per 15‑minute window.

- **Metrics & logging**
  - Prometheus counters:
    - `rate_limit_blocked_requests_total`
    - `rate_limit_allowed_requests_total`
  - Structured logs for blocked attempts, including endpoint and reason.

- **Protected endpoints**
  - `POST /api/user/forgot-password`
  - `POST /api/user/reset-password`
  - `POST /api/user/resend-otp`
  - `POST /api/user/verify-otp`
  - `POST /api/user/change-verification-email`
  - `POST /api/auth/register`
  - `POST /api/auth/login`

---

## 🔎 Netflix + Amazon Hybrid Search System

### Core search hook – `useSearch`

- Debounced search (≈400–500ms) via a reusable `useDebounce` hook.
- Minimum 2‑character threshold (`"ba"` and above) to avoid noisy queries.
- Request deduplication:
  - Global map keyed by `normalizedQuery:page` to share in‑flight requests.
  - Multiple components asking for the same query reuse a single API call.
- LRU cache with stale‑while‑revalidate:
  - Max ~50 entries with 10‑minute “fresh” TTL and extended “stale” TTL.
  - Fresh cache: returned immediately.
  - Stale cache: displayed instantly while a background refresh runs.
- Infinite scroll:
  - `allResults`, `hasMore`, `currentPage`, and `loadMore()` support.

### Suggestions & UI components

- `useSearchSuggestions`:
  - Amazon‑style suggestions with faster debounce (~300ms).
  - Extracts suggestions from search results and normalizes queries.
- `SearchBar`:
  - Combines suggestions, search results, trending fallback, and keyboard navigation.
  - Netflix‑style skeleton loaders instead of plain spinners.
  - Infinite scroll of results with IntersectionObserver or manual “Load more”.
- `SearchSkeleton` and `SearchSuggestions`:
  - Skeleton cards with dark‑mode support.
  - Accessible suggestion dropdown with keyboard navigation.

### Performance & race-condition protection

From `PERFORMANCE_COMPARISON.md` and `REFACTORING_SUMMARY.md`:

- API efficiency:
  - Old: up to ~12 API calls per search (`"batman"` typed character‑by‑character).
  - New: 1 debounced call per search (up to ~83–90% fewer requests).
- Perceived performance:
  - Old: ~1s delay before results.
  - New: cached results shown instantly (0ms perceived delay) with background refresh.
- Cache normalization:
  - `"Batman"`, `"batman"`, and `"BATMAN"` all normalize to `"batman"` for a ~3× cache‑hit improvement.
- Race condition handling:
  - Request ID tracking ensures only the latest request updates the UI.
  - Stale responses are ignored; aborted requests do not show errors.
- Memory management:
  - LRU with eviction + TTL to avoid unbounded growth.
  - Proper cleanup of abort controllers and timers to prevent leaks.

---

## 🚀 Usage Flows

### As an end user

1. Open the frontend at `http://localhost:5173`.  
2. Register with your email, phone, and password.  
3. Verify your email using the OTP sent to your inbox.  
4. Log in to receive an access token and refresh cookie.  
5. Use the dashboard to:
   - Browse trending/popular movies, TV, and people.
   - Use instant search to quickly find titles.
   - Mark movies as favorites, add to watchlist, and create watch history.
6. Visit Favorites / Watchlist / History pages to manage your library.

### As an admin

1. Mark your user in MongoDB with `role: 'admin'`.  
2. Log in; protected routing will redirect you to `/admin`.  
3. Manage curated movies via the Admin Movies view.  
4. Manage users (ban / unban / delete) via the Admin Users view.  

---

## 🧪 Testing

### Server tests

From `server`:

```bash
npm test
```

This runs Jest tests backed by `mongodb-memory-server` so no real MongoDB data is modified.

### Client checks

From `client`:

```bash
npm run lint
```

This runs ESLint over the React codebase.

---

## 📄 License

This project is licensed under the **ISC License** (see `server/package.json`).  
You are free to use, modify, and distribute this project in accordance with the ISC license terms.

