This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## ArmorIQ Audit Logging (v1)

This project instruments critical auth + mutation routes with ArmorIQ best-effort audit emission.
In `ARMORIQ_MODE=observe` mode, ArmorIQ failures should not break the API endpoints.

### Rollout switches
- `ARMORIQ_ENABLED` (`true`/`false`): enable/disable audit emission.
- `ARMORIQ_MODE` (`observe`/`enforce`): v1 best-effort is recommended (`observe`).

### Required env vars (when enabled)
- `ARMORIQ_API_KEY`
- `ARMORIQ_AGENT_ID`
- `ARMORIQ_CONTEXT_ID` (defaults to `default`)

### Audit MCP/action config (must match your onboarded MCP registry)
- `ARMORIQ_AUDIT_MCP` (default `audit-mcp`)
- `ARMORIQ_AUDIT_ACTION` (default `emit_event`)
- `ARMORIQ_AUDIT_LLM` (default `gpt-4`)
- `ARMORIQ_AUDIT_TOKEN_TTL_SECONDS` (default `300`)

### Disabled-by-default risk telemetry
- `ARMORIQ_RISK_HOOKS` (default `false`)
- Risk hookpoints currently emit telemetry only in v1 (future enforcement is planned).

### Event catalog (v1)
Auth
- `auth.login.success`
- `auth.login.failed`
- `auth.logout`
- `auth.token.invalid`

Summaries / visibility / sharing
- `summary.created`
- `summary.updated`
- `summary.deleted`
- `summary.visibility_changed`
- `summary.share_enabled`

Tags
- `tag.created`
- `tag.updated`
- `tag.deleted`

Workspaces
- `workspace.created`
- `workspace.updated`
- `workspace.deleted`

Social interactions
- `social.like.added`
- `social.like.removed`
- `social.save.added`
- `social.save.removed`
- `social.comment.added`
- `social.comment.removed`

Notifications
- `notification.mark_seen`

Risk telemetry (only when `ARMORIQ_RISK_HOOKS=true`)
- `risk.decision.summary_create`
- `risk.decision.summary_update`
- `risk.decision.comment_create`

### Local validation
1. Set the env vars in `web/.env.local`.
2. Start the dev server (`npm run dev`).
3. Exercise flows that hit instrumented endpoints:
   - Google OAuth login + logout
   - Create/update/delete summary, tags, and workspaces
   - Like/save/comment and mark notifications seen
4. Verify audit events are emitted in the ArmorIQ control plane.
