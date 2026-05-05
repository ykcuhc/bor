# JareApp | جار آب

Kuwait's Hyper-Local Neighborhood Social Platform — connecting verified residents across all six governorates.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS + Zustand |
| Backend | Node.js + Express + TypeScript + Prisma |
| Database | PostgreSQL 15 |
| Cache / Real-time | Redis 7 + Socket.io |
| Auth | JWT + OTP (Twilio SMS) |
| Storage | AWS S3 / Cloudflare R2 |

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- (Optional) Twilio account for real SMS OTPs

## One-Command Setup

```bash
cd jareapp
docker compose up --build
```

This starts:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- API server on `http://localhost:4000`
- Web frontend on `http://localhost:3000`

The API server automatically runs migrations and seeds the database on startup.

## Manual Development Setup

### Backend

```bash
cd packages/api
cp .env.example .env
# Edit .env with your values
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

### Frontend

```bash
cd apps/web
npm install
npm run dev
```

## Database Migrations

```bash
cd packages/api
npx prisma migrate dev --name migration_name
```

## Seed Database

```bash
cd packages/api
npm run seed
```

Seeds:
- All 6 Kuwait governorates with 12 neighborhoods each
- Admin user
- Neighborhood Champion user  
- Sample posts, alert, event, and business

## Default Credentials

| Role | Phone | Email | Password |
|------|-------|-------|----------|
| Admin | +96512345678 | admin@jareapp.kw | Admin@123 |
| Champion | +96598765432 | champion@jareapp.kw | Champion@123 |

## API Documentation

Swagger UI available at: `http://localhost:4000/api/docs`

## Key API Endpoints

```
POST /api/auth/send-otp          Send OTP to Kuwait phone
POST /api/auth/verify-otp        Verify OTP, get JWT tokens
POST /api/auth/register          Complete registration
GET  /api/feed                   Neighborhood feed (paginated)
POST /api/posts                  Create post
GET  /api/alerts                 Active neighborhood alerts
GET  /api/events                 Upcoming events
GET  /api/businesses             Local business directory
GET  /api/messages/conversations Message threads
GET  /api/admin/stats            Admin dashboard stats
```

## Features

- **Auth**: Kuwait phone OTP + JWT (15min access, 30d refresh)
- **Feed**: Category-filtered, cursor-paginated neighborhood posts
- **Safety Alerts**: Severity-color-coded real-time alerts
- **Events**: RSVP (Going/Maybe/Not Going)
- **Business Directory**: Reviews, ratings, sponsored listings
- **Messaging**: Real-time private messages via Socket.io
- **Notifications**: In-app notification system
- **Admin Dashboard**: Reports queue, user management, broadcast alerts
- **i18n**: Full Arabic RTL + English LTR toggle
- **PWA**: Installable on Android Chrome

## Governorates & Neighborhoods

All 6 Kuwait governorates seeded with 12 neighborhoods each:
- **العاصمة** Capital (CAP)
- **حولي** Hawalli (HAW)
- **الفروانية** Farwaniya (FAR)
- **الأحمدي** Ahmadi (AHM)
- **الجهراء** Jahra (JAH)
- **مبارك الكبير** Mubarak Al-Kabeer (MAK)

## Security

- AES-256 encrypted address storage
- OTP rate limited: 3/phone/hour
- Post rate limited: 10/user/hour
- JWT access tokens expire in 15 minutes
- Neighborhood-scoped data queries
