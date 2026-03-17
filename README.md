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
NEXT_PUBLIC_APP_URL=http://localhost:3000
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
- `HUGGING_FACE_MODEL`

`APP_ORIGIN` is still useful if you ever call the backend directly from a browser. With the recommended frontend proxy flow, normal app traffic does not depend on it.

## Frontend Environment Variables

Defined in `frontend/.env.example`:

- `INTERNAL_API_ORIGIN`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_YOUTUBE_NOCOOKIE`

`INTERNAL_API_ORIGIN` is server-only and should point at the backend origin the frontend proxy should use.

## Project Assistant

The app includes an in-product chatbot that is intentionally scoped to this LMS project.

- Frontend widget: available on pages that use the shared app shell.
- Backend endpoint: `POST /api/chat`
- Provider: Hugging Face chat completions
- Scope: subjects, auth, progress, dashboard flow, project structure, and deployment

Set these backend env vars to enable it:

```text
HUGGING_FACE_API_KEY=your_token
HUGGING_FACE_MODEL=your-hugging-face-model-id
```

If the chatbot is asked something unrelated to this project, it refuses and stays in project scope.

## Deploy On Render

1. Push this monorepo to GitHub.
2. In Render, create a new Blueprint from the repository root.
3. Render creates two web services: `lms-api` and `lms-frontend`.
4. Set backend env vars on `lms-api`:
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
   - optional `OPENAI_API_KEY`
5. Set frontend env vars on `lms-frontend`:
   - `INTERNAL_API_ORIGIN=https://<your-lms-api>.onrender.com`
   - `NEXT_PUBLIC_APP_URL=https://<your-lms-frontend>.onrender.com`
6. Redeploy the frontend after setting those values.

## Render Notes

- The Blueprint builds from the repo root with `npm ci`, so it uses the workspace lockfile consistently.
- Build filters prevent backend-only changes from rebuilding the frontend, and vice versa.
- The frontend remains the only URL your users need.
- If you later move the backend to a paid private service, the proxy pattern still works. You would only change `INTERNAL_API_ORIGIN`.

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
