# NextApp Auto Parts Platform

## Applications

- `apps/NextApp-CRM`: React and TypeScript administration portal
- `apps/Nextapp-Mobile`: Expo and React Native mobile application
- `apps/Nextapp-API`: Node.js and Express REST API
- `packages/shared-types`: Shared TypeScript API contracts

## Architecture Rules

- Web and mobile use the same REST API.
- Do not duplicate API interfaces inside applications.
- Shared interfaces belong in `packages/shared-types`.
- Do not share React web components with React Native.
- Role authorization must be enforced by the API, not only the UI.
- Never place secrets or database credentials in frontend code.
- Do not use public CORS proxy services.
- Preserve existing endpoints unless all consumers are updated.
- Run lint, type checking, and relevant tests after changes.

## Roles

Super Admin, Admin, Manager, Storeman, Salesman, Retailer.

## Completion Requirement

A feature is complete only when its database, API, web, mobile, authorization,
validation, loading, empty, and error states are addressed.
