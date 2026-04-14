# Creator Incubator

Early-stage accelerator landing page + application portal.
React frontend · Express API · MongoDB · OTP email auth · JWT

---

## File Structure

```
creator-incubator/
│
├── server.js          ← Express API + OTP + MongoDB (all backend in one file)
├── package.json       ← All dependencies (React + Node combined)
├── vite.config.js     ← Vite config (root: client/, proxy /api → :6002)
├── .env               ← Your local secrets (git-ignored)
├── .env.example       ← Template to copy from
├── .gitignore
├── README.md
│
└── client/
    ├── index.html
    └── src/
        ├── main.jsx   ← React DOM mount
        └── App.jsx    ← Entire frontend (landing, auth modal, dashboard)
```

---

## Quick Start

```bash
# 1. Install everything
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env — fill in MONGO_URI, JWT_SECRET, and SMTP settings

# 3. Run dev (client :3000 + server :6002 concurrently)
npm run dev
```

Visit http://localhost:3000

---

## Environment Variables

| Variable              | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `PORT`                | Express port (default: 6002)                         |
| `MONGO_URI`           | MongoDB connection string                            |
| `JWT_SECRET`          | Long random string for signing tokens                |
| `JWT_EXPIRES_IN`      | Token expiry, e.g. `7d`                              |
| `OTP_EXPIRES_MINUTES` | OTP validity window (default: 10)                    |
| `SMTP_HOST`           | SMTP server (e.g. smtp.gmail.com)                    |
| `SMTP_PORT`           | SMTP port (587 for TLS)                              |
| `SMTP_SECURE`         | `true` for SSL/465, `false` for TLS/587              |
| `SMTP_USER`           | SMTP username / Gmail address                        |
| `SMTP_PASS`           | SMTP password / Gmail App Password                   |
| `EMAIL_FROM`          | Sender display name + address                        |
| `CLIENT_ORIGIN`       | Allowed CORS origin (default: http://localhost:3000) |

---

## API Reference

All routes are prefixed with `/api`.

### Auth

| Method | Route                   | Body                               | Description               |
| ------ | ----------------------- | ---------------------------------- | ------------------------- |
| POST   | `/auth/register`        | `{ name, email, password, role? }` | Register, sends OTP email |
| POST   | `/auth/verify-email`    | `{ email, otp }`                   | Verify email, returns JWT |
| POST   | `/auth/login`           | `{ email, password }`              | Login, returns JWT        |
| POST   | `/auth/forgot-password` | `{ email }`                        | Sends reset OTP           |
| POST   | `/auth/reset-password`  | `{ email, otp, newPassword }`      | Resets password           |
| POST   | `/auth/resend-otp`      | `{ email, purpose }`               | Resend OTP                |

**Roles:** `creator` · `mentor` · `investor`
**Purposes:** `verify-email` · `reset-password`

### User

| Method | Route      | Auth | Body              | Description     |
| ------ | ---------- | ---- | ----------------- | --------------- |
| GET    | `/user/me` | ✓    | —                 | Get own profile |
| PATCH  | `/user/me` | ✓    | `{ name?, bio? }` | Update profile  |

### Applications

| Method | Route                | Auth | Body                                                        | Description            |
| ------ | -------------------- | ---- | ----------------------------------------------------------- | ---------------------- |
| POST   | `/applications`      | ✓    | `{ projectName, stage, description, website?, askAmount? }` | Submit application     |
| GET    | `/applications/mine` | ✓    | —                                                           | Get own applications   |
| GET    | `/applications/:id`  | ✓    | —                                                           | Get single application |

**Stages:** `idea` · `mvp` · `growth`
**Statuses:** `pending` · `reviewing` · `accepted` · `rejected`

### Other

| Method | Route     | Description  |
| ------ | --------- | ------------ |
| GET    | `/health` | Health check |

---

## Validation Rules

### Registration

- `name` — required, 2–80 chars, letters/spaces/punctuation
- `email` — required, valid email format
- `password` — min 8 chars, 1 uppercase, 1 number

### OTP

- Must be exactly 6 numeric digits
- Expires after `OTP_EXPIRES_MINUTES` (default: 10)
- Auto-deleted from DB after expiry (MongoDB TTL index)
- Max 3 OTP requests per 5 min per IP

### Application

- `projectName` — required, max 120 chars
- `stage` — required, one of: idea / mvp / growth
- `description` — required, 50–2000 chars
- `website` — optional, must be valid URL if provided
- `askAmount` — optional, positive number

---

## Rate Limits

| Endpoint group   | Limit                     |
| ---------------- | ------------------------- |
| Auth (login/reg) | 10 requests / 15 min / IP |
| OTP send/resend  | 3 requests / 5 min / IP   |

---

## Production Build

```bash
# Build React into /dist
npm run build

# Start Express (serves React + API on PORT)
npm start
```

---

## Gmail SMTP Setup

1. Go to Google Account → Security → 2-Step Verification → App Passwords
2. Create an App Password for "Mail"
3. Use your Gmail address as `SMTP_USER` and the App Password as `SMTP_PASS`

# TURE_SHAPE
