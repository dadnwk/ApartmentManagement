# Apartment Management

TypeScript + Express + PostgreSQL.

1. Start PostgreSQL: `docker compose up -d` (or point `DATABASE_URL` at your own server;
   default `postgres://apartment:apartment@localhost:5432/apartment`)
2. `npm install`
3. `npm run dev` (builds, then serves http://localhost:3000)

Tables are created automatically on startup. `PORT` and `DATABASE_URL` are read from the environment.

## Login and users

Accounts live in the `users` table (passwords are stored as salted scrypt hashes) with the roles `admin`,
`management` and `person`. On first start an admin account is created from `ADMIN_USER` / `ADMIN_PASSWORD`
(`ADMIN_USER` defaults to `admin`). The password comes from `ADMIN_PASSWORD`, or from the file named by
`ADMIN_PASSWORD_FILE`; if neither is set a random one is generated and printed once in the server log. There is no
hard-coded default password. In production `DATABASE_URL` is required. Changing those variables later does not change an existing account.

| Role | Can do |
| --- | --- |
| `admin` | Everything, including the **Users** page: create, edit, delete, activate and inactivate users. |
| `management` | Everything the admin can, except: the admin account is invisible to them, and on the Users page they can only edit, delete and (in)activate `person` users (plus edit their own account), not other management users. |
| `person` | Read-only: the Rooms, Bills and Calendar of the room their linked person lives in. |

A `person` user must be linked to a person record (chosen on the user form); the room they see is that person's
current room. Inactive users cannot log in, and deactivating, deleting or re-roling a user takes effect on their
next request. The admin account and your own account cannot be deactivated or deleted.
Sessions last 8 hours and are kept in server memory, so restarting the server logs everyone out.

## Deployment (GitHub Actions)

`.github/workflows/deploy.yml` runs on every push and pull request: it installs, builds and smoke-tests the app
against a PostgreSQL service (login, UTF-8 names). On pushes to `main` it then

1. builds the `Dockerfile` and publishes `ghcr.io/<owner>/<repo>` (tags `latest` and `sha-<commit>`), and
2. deploys that exact image to an **Azure Web App for Containers** (`production` environment).

### One-time setup

In Azure:
- Create an Azure Database for PostgreSQL (UTF-8 is the default) and a Web App for Containers (Linux).
- In the Web App's *Environment variables* set:
  - `DATABASE_URL` = `postgres://USER:PASSWORD@HOST:5432/apartment?sslmode=require` (Azure requires SSL)
  - `ADMIN_USER` and `ADMIN_PASSWORD` 
  - `WEBSITES_PORT` = `3000`
  - if the GHCR package is private: `DOCKER_REGISTRY_SERVER_URL` = `https://ghcr.io`, `DOCKER_REGISTRY_SERVER_USERNAME`
    and `DOCKER_REGISTRY_SERVER_PASSWORD` (a GitHub token with `read:packages`)
- Download the Web App's *publish profile* (Overview → Get publish profile). Enable *SCM Basic Auth Publishing
  Credentials* in the Web App's Configuration if it is off, otherwise the profile is rejected.

In GitHub (Settings → Secrets and variables → Actions):
- secret `AZURE_WEBAPP_PUBLISH_PROFILE` = the full publish-profile XML
- variable `AZURE_WEBAPP_NAME` = the Web App name

Tables are created automatically on first start.
