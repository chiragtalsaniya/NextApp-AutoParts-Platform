# Architecture Overview

This project is organized into three main pieces:

## CRM frontend (`apps/NextApp-CRM/src`)

The React application lives in the `src` directory. It is built with Vite and TypeScript. API calls are made using Axios via the helper in `src/lib/database.ts`. The base URL for requests is configured with the `VITE_API_URL` environment variable. Authentication tokens are stored in `localStorage` and sent as `Authorization` headers.

## Backend (`apps/NextApp-API`)

The Express API is located in `apps/NextApp-API`. `index.js` sets up all REST endpoints under `/api/*`. It also handles security middleware, JWT authentication, and database access through MySQL. Static uploads are served from `/uploads`.

## Database (`MySQL`)

MySQL is the only authoritative application database. The Express API owns all
database access through `mysql2`, and the schema initializer lives under
`database/mysql/init-database.js`.

The files under `database/supabase/migrations` are historical/reference assets
only. They are not part of the runtime architecture and must not be used by the
CRM or Mobile application. Clients communicate with the API rather than using a
database SDK directly.

## How They Work Together

The CRM and Mobile applications communicate with the Express backend by sending
HTTP requests to the `/api` routes. Responses are returned as JSON and consumed
by the clients. The backend persists data in MySQL using the initializer script.
This keeps the UI, API, and database concerns isolated while allowing all
clients to share one source of truth.
