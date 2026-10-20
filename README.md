# Apartment Management

TypeScript + Express + PostgreSQL.

1. Start PostgreSQL: `docker compose up -d` (or point `DATABASE_URL` at your own server;
   default `postgres://apartment:apartment@localhost:5432/apartment`)
2. `npm install`
3. `npm run dev` (builds, then serves http://localhost:3000)

Tables are created automatically on startup. `PORT` and `DATABASE_URL` are read from the environment.

## Login

The app requires login. Default credentials: user `admin`, password `****`.
Override with the `ADMIN_USER` and `ADMIN_PASSWORD` environment variables. Sessions last 8 hours and are kept in
server memory, so restarting the server logs everyone out.
