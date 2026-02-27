# Squadbul.com

PUBG Mobile Clan & Player Matching Platform

## 🎯 Project Overview

Squadbul is a mobile-first, API-driven recruitment and matchmaking platform for PUBG Mobile players and clans in Turkey and Europe.

## 🛠 Tech Stack

### Backend
- NestJS (TypeScript)
- PostgreSQL 16
- Redis 7
- TypeORM
- Passport.js (JWT Authentication)
- Swagger/OpenAPI

### Frontend
- Next.js 14.2.18 (App Router) - Secure version
- TypeScript
- TailwindCSS
- React Query
- Zustand
- Shadcn/ui

### Infrastructure
- Docker & docker-compose
- Nginx (reverse proxy)
- Ubuntu 24.04 LTS
- Let's Encrypt SSL

## 📋 Prerequisites

- Node.js 20.x LTS
- Docker & Docker Compose
- Git
- pnpm (recommended) or npm

## 🚀 Quick Start

### Development Environment

1. Clone the repository:
```bash
git clone <repository-url>
cd squadbul
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Start Docker services:
```bash
docker-compose up -d
```

4. Install dependencies:
```bash
# Backend
cd backend
pnpm install

# Frontend
cd ../frontend
pnpm install
```

5. Run migrations:
```bash
cd backend
pnpm run migration:run
```

6. Start development servers:
```bash
# Backend (Terminal 1)
cd backend
pnpm run start:dev

# Frontend (Terminal 2)
cd frontend
pnpm run dev
```

7. Access the application:
- Frontend: http://localhost:3003
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api/docs
- PostgreSQL: localhost:5433
- Redis: localhost:6379

### Admin Setup

To create an admin user:

1. First, register a normal user at http://localhost:3003/register

2. Connect to PostgreSQL:
```bash
docker exec -it squadbul-postgres psql -U squadbul -d squadbul
```

3. Make the user admin:
```sql
-- Replace 'your_username' with your actual username
UPDATE users SET is_admin = true WHERE username = 'your_username';

-- Verify
SELECT username, email, is_admin FROM users WHERE is_admin = true;

-- Exit
\q
```

4. Login and access admin panel at http://localhost:3003/admin

**Default Admin Credentials (for testing):**
- Create any user via registration
- Use the SQL command above to make them admin
- No default admin account for security reasons

## 📁 Project Structure

```
squadbul/
├── backend/              # NestJS backend
│   ├── src/
│   │   ├── auth/        # Authentication module
│   │   ├── users/       # User management
│   │   ├── posts/       # Post system
│   │   ├── applications/# Application system
│   │   ├── common/      # Shared utilities
│   │   └── main.ts      # Entry point
│   ├── test/
│   ├── Dockerfile
│   └── package.json
├── frontend/            # Next.js frontend
│   ├── src/
│   │   ├── app/         # App router pages
│   │   ├── components/  # React components
│   │   ├── lib/         # Utilities
│   │   └── types/       # TypeScript types
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── nginx/               # Nginx configuration
├── scripts/             # Utility scripts
├── docker-compose.yml   # Development
├── docker-compose.prod.yml # Production
├── .env.example
├── prd.md              # Product Requirements
└── README.md
```

## 🧪 Testing

### Backend API Endpoints

#### Authentication
```bash
# Register
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456","username":"test_user","region":"TR","language":"TR"}'

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'

# Get profile
curl -X GET http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Posts
```bash
# Create post
curl -X POST http://localhost:3001/api/v1/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"type":"CLAN_RECRUIT","title":"Looking for players","description":"We need skilled players...","region":"TR","mode":"RANKED","language":"TR","required_roles":["IGL"],"tier_requirement":"ACE"}'

# List posts with filters
curl -X GET "http://localhost:3001/api/v1/posts?type=CLAN_RECRUIT&region=TR&page=1&limit=20&sort=newest"

# Search posts
curl -X GET "http://localhost:3001/api/v1/posts?search=clan&region=TR"

# Get post detail
curl -X GET http://localhost:3001/api/v1/posts/POST_ID

# Get SEO meta tags
curl -X GET http://localhost:3001/api/v1/posts/POST_ID/meta

# Get sitemap
curl -X GET http://localhost:3001/api/v1/posts/sitemap

# Pause post
curl -X POST http://localhost:3001/api/v1/posts/POST_ID/pause \
  -H "Authorization: Bearer YOUR_TOKEN"

# Resume post
curl -X POST http://localhost:3001/api/v1/posts/POST_ID/resume \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Unit Tests
```bash
# Backend unit tests
cd backend
pnpm run test

# Backend e2e tests
pnpm run test:e2e

# Frontend tests
cd frontend
pnpm run test
```

## 🎯 Current Progress

### ✅ Completed Sprints
- Sprint 0: Infrastructure & Setup (24 Feb 2026)
- Sprint 1: Authentication & Profile System (24 Feb 2026)
- Sprint 2: Post System (24 Feb 2026)
- Sprint 3: Applications & Favorites (24 Feb 2026)
- Sprint 4: Moderation & Reports (24 Feb 2026)
- Sprint 5: Monetization Infrastructure (24 Feb 2026)

### 🎉 Backend MVP Complete! (100%)

All core backend features implemented:
- 50+ REST API endpoints
- 10 database tables
- Full authentication & authorization
- Post system with advanced filtering
- Application & favorites system
- Notifications
- Reports & moderation
- Admin panel endpoints
- Premium & boost infrastructure
- SEO & sitemap

### 📱 Frontend Progress (100%)

Completed:
- ✅ Modern UI design (dark theme, glassmorphism, animations)
- ✅ Landing page
- ✅ Login/Register pages with validation
- ✅ Posts listing with filters & search
- ✅ Post detail page with apply form
- ✅ Post creation form
- ✅ User dashboard (My Posts, Incoming Applications, Applications, Favorites)
- ✅ Notifications page
- ✅ Profile page with edit mode & validation
- ✅ Public profile page
- ✅ About & Pricing pages
- ✅ Navbar (sticky, auth-aware, mobile menu)
- ✅ Footer (links, social media)
- ✅ Loading skeletons (all pages)
- ✅ Toast notifications (react-hot-toast)
- ✅ Form validation (react-hook-form + zod)
- ✅ SEO optimization (meta tags, Open Graph, Twitter Cards, sitemap, robots.txt)
- ✅ Performance optimization (Next.js config, font optimization, caching, Web Vitals)
- ✅ Error tracking (Sentry - Server, Client, Edge configs + ErrorBoundary)
- ✅ Admin panel UI (Dashboard, Users, Posts, Reports, Analytics)
- ✅ API integration
- ✅ State management (Zustand)
- ✅ Responsive design (mobile-first)

Next Steps:
- 🚧 Testing (unit, integration, E2E)
- 🚧 DevOps setup (Docker production, Nginx, SSL, Backup)

## 📦 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🔒 Security

- JWT authentication with refresh tokens
- Rate limiting on all endpoints
- CORS configuration
- Helmet.js security headers
- Input validation & sanitization
- SQL injection prevention
- XSS prevention

## 📊 Monitoring

- Sentry (error tracking)
- Health check endpoint: `/api/health`
- Uptime monitoring
- Performance monitoring

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development rules and guidelines.

## 📄 License

Proprietary - All rights reserved

## 👤 Author

Mehmet Acar

## 📞 Support

For support, email: support@squadbul.com
