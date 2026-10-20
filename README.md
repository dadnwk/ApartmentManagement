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

## Deployment (GitHub Actions)

`.github/workflows/deploy.yml` runs on every push and pull request: it installs, builds and smoke-tests the app
against a PostgreSQL service (login, UTF-8 names). On pushes to `main` it also builds the `Dockerfile` and publishes
the image to `ghcr.io/<owner>/<repo>` (tags `latest` and the commit SHA).

Run the image anywhere with a UTF-8 PostgreSQL database:

    docker run -p 3000:3000 -e DATABASE_URL=postgres://user:pass@host:5432/apartment \
      -e ADMIN_USER=admin -e ADMIN_PASSWORD=<choose one> ghcr.io/<owner>/<repo>:latest

Change the default admin password (`ADMIN_PASSWORD`) for any real deployment.
