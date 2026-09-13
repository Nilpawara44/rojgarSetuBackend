# RojgarSetu Backend API

Express + MongoDB (Mongoose) REST API for the RojgarSetu job portal. Handles
public job listings and an admin-only login to create, edit and delete jobs.

## Stack
- Node.js + Express
- MongoDB Atlas via Mongoose
- JWT auth (bcrypt-hashed admin password)
- helmet, cors, express-rate-limit, morgan for production hardening/logging

## Project structure
```
job-portal-backend/
├── server.js                    Entry point
├── src/
│   ├── config/db.js              MongoDB connection
│   ├── models/
│   │   ├── Job.js                 Job schema
│   │   └── Admin.js               Admin schema (bcrypt password hashing)
│   ├── controllers/
│   │   ├── jobController.js       CRUD logic for jobs
│   │   └── authController.js      Login + "who am I" logic
│   ├── routes/
│   │   ├── jobRoutes.js
│   │   └── authRoutes.js
│   ├── middleware/
│   │   ├── auth.js                JWT verification ("protect")
│   │   └── errorHandler.js        404 + centralized error formatting
│   ├── utils/
│   │   ├── slugify.js
│   │   └── generateToken.js
│   ├── data/jobs.seed.json        Same 8 sample jobs as the frontend
│   └── scripts/seed.js            Populates jobs + creates the first admin
├── .env.example
└── package.json
```

## 1. MongoDB Atlas setup
1. Create a free cluster at https://cloud.mongodb.com if you haven't already.
2. Database Access → add a database user with a username/password.
3. Network Access → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`).
   Render's servers use dynamic IPs, so this is required unless you're on an
   Atlas tier that supports private networking/VPC peering.
4. Database → Connect → Drivers → copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```
   Add your database name before the `?`, e.g. `.../rojgarsetu?retryWrites=...`.
   **URL-encode** any special characters in your password (e.g. `@` → `%40`).

## 2. Local setup
```bash
cd job-portal-backend
npm install
cp .env.example .env
# then edit .env: paste your MONGODB_URI, set a real JWT_SECRET,
# set ADMIN_USERNAME / ADMIN_PASSWORD for the seed script
npm run seed      # loads the 8 sample jobs + creates your admin account
npm run dev        # starts on http://localhost:5000 with nodemon
```
Test it:
```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/jobs
```

## 3. API Reference

### Public
| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | Uptime check |
| GET | `/api/jobs` | List jobs. Query params: `category`, `search`, `sort` (`latest`\|`closing`\|`vacancies`), `page`, `limit` |
| GET | `/api/jobs/:id` | Get one job by its slug id (e.g. `ssc-cgl-2026`) |
| POST | `/api/auth/login` | `{ "username": "...", "password": "..." }` → returns `{ token, ... }` |

### Private — send `Authorization: Bearer <token>`
| Method | Route | Description |
|---|---|---|
| GET | `/api/auth/me` | Verify a token / fetch the logged-in admin's profile |
| GET | `/api/jobs/admin/all` | List every job, including unpublished ones |
| POST | `/api/jobs` | Create a job. Required: `title`, `department`, `category`, `location`, `vacancies`, `description`, `applyLink`, `officialWebsite`, `importantDates.applicationEnd`. Slug `id` is auto-generated from the title if you don't provide one. |
| PUT | `/api/jobs/:id` | Partial update — send only the fields you're changing |
| DELETE | `/api/jobs/:id` | Delete a job |

**Example — login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"ChangeThisPassword123!"}'
```

**Example — create a job:**
```bash
curl -X POST http://localhost:5000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Junior Engineer Recruitment 2026",
    "department": "Public Works Department",
    "category": "PSU",
    "location": "Maharashtra",
    "vacancies": 250,
    "description": "...",
    "applyLink": "https://example.gov.in/apply",
    "officialWebsite": "https://example.gov.in",
    "importantDates": { "applicationEnd": "2026-12-01" }
  }'
```

All responses follow `{ success: boolean, data?: ..., message?: "..." }`, and
list endpoints also include `count`, `total`, `page`, `pages`.

## 4. Deploying to Render
1. Push this `job-portal-backend` folder to its own GitHub repo (keep it
   separate from the frontend repo — you said the frontend goes to Vercel).
2. On https://render.com → New → Web Service → connect the repo.
3. Settings:
   - **Root Directory**: leave blank if the repo root *is* this folder, or
     set it to `job-portal-backend` if it's a subfolder of a larger repo.
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free is fine to start.
4. Environment → add every variable from `.env.example` (with your real
   values) — `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`,
   `NODE_ENV=production`. Render sets `PORT` automatically; the app already
   reads `process.env.PORT`, so don't hardcode it.
5. Deploy. Once live, your API is at `https://<your-service>.onrender.com`.
6. Run the seed script once against production — easiest way is to
   temporarily set your local `.env`'s `MONGODB_URI` to the same Atlas
   connection string Render uses, then run `npm run seed` from your machine.
7. Update `CORS_ORIGIN` to include your real Vercel frontend URL, and update
   `SITE.baseUrl`-style references in the frontend to point at your Render
   API URL instead of `data/jobs.json` (see "Connecting the frontend" below).

## 5. Connecting the frontend (Vercel)
The frontend currently fetches a local `jobs.json` file. To point it at this
API instead, in the frontend's `common.js`, change:
```js
jobsJsonPath: "jobs.json"
```
to something like:
```js
API_BASE: "https://<your-service>.onrender.com/api"
```
and update `loadJobs()` to `fetch(`${API_BASE}/jobs`)`, plus update
`job-details.js` to fetch `${API_BASE}/jobs/${id}`. Happy to wire this up
for you — just ask once your Render URL is live.

## 6. Security notes
- The admin account is created only via the seed script from `.env`
  credentials — there is intentionally **no public registration endpoint**.
- Change `JWT_SECRET` to a long random string before deploying (e.g.
  `openssl rand -hex 32`), and change the default admin password immediately.
- `/api/auth/login` is rate-limited (10 attempts / 15 min per IP).
- Never commit your real `.env` file — `.gitignore` already excludes it.
"# rojgarSetuBackend" 
