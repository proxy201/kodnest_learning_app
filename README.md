# LMS Deployment Scaffold

Deployment-ready monorepo for an LMS with:

- `frontend/`: Next.js 15 + Tailwind CSS
- `backend/`: Express + TypeScript
- `render.yaml`: Render Blueprint for both services

## Project Structure

```text
.
|-- backend/
|-- frontend/
|-- scripts/
|-- render.yaml
`-- README.md
```

## How This Repo Runs

The frontend now uses a same-origin `/api/*` proxy route in development and production.

- Browser requests go to the frontend first.
- The frontend proxies `/api/*` calls to the backend.
- Auth cookies stay attached to the frontend origin, which is much more reliable on Render.
- You no longer need to expose the backend URL to client-side code for the recommended setup.

## Local Setup

1. Create `backend/.env` from `backend/.env.example`
2. Create `frontend/.env.local` from `frontend/.env.example`
3. Install dependencies:

```bash
npm install
```

4. Start both apps together:

```bash
npm run dev
```

Default local URLs:

- Frontend app: `http://localhost:3000`
- Frontend-proxied API health: `http://localhost:3000/api/health`
- Backend direct URL: `http://localhost:4000`
- Backend direct health: `http://localhost:4000/api/health`
- Login: `http://localhost:3000/auth/login`
- Register: `http://localhost:3000/auth/register`
- Dashboard: `http://localhost:3000/dashboard`

The recommended frontend local env is:

```text
INTERNAL_API_ORIGIN=http://localhost:4000
NEXT_PUBLIC_YOUTUBE_NOCOOKIE=true
```

## Backend Environment Variables

Defined in `backend/.env.example`:

- `NODE_ENV`
- `PORT`
- `APP_ORIGIN`
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`
- `MYSQL_SSL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES`
- `JWT_REFRESH_EXPIRES`
- `OPENAI_API_KEY`
- `HUGGING_FACE_API_KEY`
- `HF_TOKEN`
- `HUGGING_FACE_MODEL`

`APP_ORIGIN` is still useful if you ever call the backend directly from a browser. With the recommended frontend proxy flow, normal app traffic does not depend on it.

## Frontend Environment Variables

Defined in `frontend/.env.example`:

- `INTERNAL_API_ORIGIN`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_YOUTUBE_NOCOOKIE`

`INTERNAL_API_ORIGIN` is server-only and should point at the backend origin the frontend proxy should use.

## AI Assistant

The app includes an in-product AI study assistant.

- Frontend widget: available on pages that use the shared app shell.
- Backend endpoint: `POST /api/chat`
- Provider: Hugging Face chat completions
- It can answer LMS questions, Java/web course questions, and general study prompts.

Set these backend env vars to enable it:

```text
HF_TOKEN=your_hugging_face_token
HUGGING_FACE_MODEL=Qwen/Qwen2.5-7B-Instruct
```

## Deploy On Render

1. Push this monorepo to GitHub.
2. In Render, click `New +` -> `Blueprint`.
3. Select this repository and keep the root `render.yaml`.
4. Render provisions two Node web services on the free plan:
   - `lms-api`
   - `lms-frontend`
5. During the first Blueprint setup, provide these prompted values for `lms-api`:
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`
   - optional `HF_TOKEN`
6. Let the first deploy complete.
7. Open the frontend Render URL for `lms-frontend`.
8. Verify these URLs:
   - Frontend app: `https://<your-frontend>.onrender.com`
   - Frontend-proxied API health: `https://<your-frontend>.onrender.com/api/health`
   - Backend direct health: `https://<your-api>.onrender.com/api/health`

### What the Blueprint Configures Automatically

- `INTERNAL_API_ORIGIN` on `lms-frontend` points to `lms-api` over Render's private network.
- `APP_ORIGIN` on `lms-api` is linked to the frontend's public Render URL.
- `MYSQL_SSL` is set to `true` for Aiven-style MySQL connections.
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are generated automatically.
- `JWT_ACCESS_EXPIRES` is `15m`.
- `JWT_REFRESH_EXPIRES` is `30d`.
- `NEXT_PUBLIC_YOUTUBE_NOCOOKIE` is `true`.

### If You Need to Update Secrets Later

Render only prompts for `sync: false` values during the first Blueprint creation flow. If you add or change secret values later, open the individual Render service and update them in the Environment tab, then redeploy.

### Manual Render Setup Fallback

If you do not want to use Blueprint deploys, create two Render web services from the same repo:

1. `lms-api`
   - Runtime: `Node`
   - Build command: `npm ci && npm --workspace backend run build`
   - Start command: `npm --workspace backend run start`
   - Health check path: `/api/health`
2. `lms-frontend`
   - Runtime: `Node`
   - Build command: `npm ci && npm --workspace frontend run build`
   - Start command: `npm --workspace frontend run start -- --hostname 0.0.0.0`
   - Health check path: `/`
3. Set these env vars manually:
   - `lms-api`: `APP_ORIGIN`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_SSL=true`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES=15m`, `JWT_REFRESH_EXPIRES=30d`, optional `HF_TOKEN`, optional `HUGGING_FACE_MODEL`
   - `lms-frontend`: `INTERNAL_API_ORIGIN=http://<private-api-host>:<private-api-port>`, `NEXT_PUBLIC_YOUTUBE_NOCOOKIE=true`

## Render Notes

- The Blueprint builds from the repo root with `npm ci`, so it uses the workspace lockfile consistently.
- Build filters prevent backend-only changes from rebuilding the frontend, and vice versa.
- The frontend remains the only URL your users need.
- The frontend proxy means browser traffic stays same-origin on the frontend service.
- If you add a custom domain to the frontend and later call the backend directly from the browser, update `APP_ORIGIN` to include that custom domain.

## Production Notes

- Frontend API calls are centralized in `frontend/lib/api.ts` and always send credentials.
- The frontend proxy lives at `frontend/app/api/[...path]/route.ts`.
- The backend uses `APP_ORIGIN` for CORS when it receives direct browser traffic.
- Auth cookies are configured with `secure: true` and `sameSite: "none"` in production.
- The MySQL pool enables SSL when `MYSQL_SSL=true`.

## Auth Endpoints

The backend includes:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

`register` expects:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "strongpassword"
}
```

`login` expects:

```json
{
  "email": "jane@example.com",
  "password": "strongpassword"
}
```

Refresh tokens are stored as hashed values in the `users` table and sent through the `lms_refresh_token` HTTP-only cookie.

The backend auto-applies SQL files in `backend/src/sql/` on startup, so the auth table is created automatically when the API boots.
