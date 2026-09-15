# Architecture Overview

This project is organized into three main pieces:

## Frontend (`src`)

The React application lives in the `src` directory. It is built with Vite and TypeScript. API calls are made using Axios via the helper in `src/lib/database.ts`. The base URL for requests is configured with the `VITE_API_URL` environment variable. Authentication tokens are stored in `localStorage` and sent as `Authorization` headers.

## Backend (`server`)

The Express API is located in the `server` folder. `server/index.js` sets up all REST endpoints under `/api/*`. It also handles security middleware, JWT authentication, and database access through MySQL. Static uploads are served from `/uploads`.

## Database Scripts (`supabase`)

SQL migration files live under `supabase/migrations`. These scripts create the database schema and can be applied using the Supabase CLI or any PostgreSQL tool.

## How They Work Together

The React frontend communicates with the Express backend by sending HTTP requests to the `/api` routes. Responses are returned as JSON and consumed by React components. The backend persists data in MySQL using the migration scripts. This separation keeps the UI, API, and database concerns isolated while allowing them to work together through standard HTTP requests.
