# Agent Guidelines: Envocc Media

## Development Principles
- **Surgical Changes:** Favor targeted updates using the `replace` tool over full file rewrites.
- **Type Safety:** Always use TypeScript. Ensure new components and API routes are properly typed.
- **Styling:** Use Tailwind CSS utility classes. Maintain consistency with existing UI components.
- **Validation:** Always verify changes by running `npm run build` or `npm run lint` within the `frontend` directory when possible.
- **Database:** When modifying the schema, remember to run `npx prisma generate` and consider if a migration is needed.

## Security Standards
- **Role Verification:** Always check for session and role in API routes using `getServerSession` or the shared `protectApi` utility if available.
- **Sensitive Data:** Never log passwords, tokens, or personal information.
- **Input Validation:** Use `zod` for validating API request bodies and query parameters.

## Workflow
1. **Research:** Analyze existing patterns in `src/app/api` and `src/components`.
2. **Implementation:**
   - Create/Update models in `schema.prisma` if necessary.
   - Implement backend logic in API routes.
   - Implement frontend UI components and pages.
3. **Integration:** Connect frontend with backend using `axios` or `fetch`.
4. **Notification:** Ensure relevant actions (like new requests or status changes) trigger the appropriate notifications (Line/Email).

## Component Guidelines
- Use Functional Components with React Hooks.
- Prefer client components (`'use client'`) only when necessary for interactivity.
- Use shared components from `src/components` (e.g., `AlertModal`, `ConfirmModal`) to maintain UI consistency.

## API Guidelines
- Follow RESTful conventions where appropriate.
- Return consistent error structures (e.g., `{ error: "Message" }`).
- Use appropriate HTTP status codes (200, 201, 400, 401, 403, 404, 500).
