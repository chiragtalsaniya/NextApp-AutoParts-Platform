# Initial Bolt Review Prompt

After importing the repository, use this prompt before making code changes:

```text
Review the entire NextApp Auto Parts monorepo before making changes.

Applications:
- apps/NextApp-CRM: React CRM administration portal
- apps/Nextapp-Mobile: Expo React Native mobile app
- apps/Nextapp-API: Node.js/Express API
- packages/shared-types: shared API contracts

First:
1. Read AGENTS.md and all files under docs.
2. Inspect all package.json files and environment examples.
3. Map every web and mobile feature to its actual API endpoint.
4. Find duplicate or conflicting TypeScript models.
5. Identify mocked, incomplete, hardcoded, and undocumented features.
6. Check role permissions on both the client and server.
7. Check JWT login and refresh-token behaviour.
8. Do not change code yet.

Create a prioritized implementation report covering:
- broken functionality
- missing API endpoints
- API response mismatches
- security issues
- incomplete mobile screens
- incomplete web screens
- missing tests
- inaccurate README claims
```

After reviewing the report, give Bolt one bounded feature at a time. Do not ask it
to complete the entire system in one prompt.
