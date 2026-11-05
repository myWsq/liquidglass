---
name: release
description: Version and publish liquidglass to npm with changesets (fixed mode). Use when asked to release, publish, cut a version, or ship liquidglass to npm.
---

# Release liquidglass

Every package shares one version (changesets `fixed`). Only `@myna/liquidglass` is published;
`@myna/liquidglass-pages` is private and only gets the version bump.

1. **Describe the change.** `pnpm changeset`: pick `@myna/liquidglass`, choose the bump, write a
   user-facing summary. The changeset file is committed with the work it describes.
2. **Version.** `pnpm version-packages` consumes the changesets, bumps every package and
   writes `CHANGELOG.md`. Review the diff.
3. **Check.** `pnpm fmt:check && pnpm lint && pnpm typecheck && pnpm build`, then the
   Acceptance list in `AGENTS.md` against `pnpm dev`.
4. **Inspect the tarball.** `cd packages/liquidglass && pnpm pack --dry-run`. Expect `dist/`,
   `src/`, `README.md`, `LICENSE`, `package.json`, and nothing else.
5. **Publish.** It is public and permanent, so the user must confirm the version first.
   `npm whoami` must succeed as `mywsq` (otherwise ask the user to run `! npm login`).
   An expired token makes npm answer a scoped publish with a misleading **404**. Then
   `pnpm release`, which builds and runs `changeset publish`; 2FA asks the user to
   approve in the browser.
   The `@myna` org uses **staged publishing**: the upload is held, and the registry only
   shows a `0.0.0-stage` placeholder until the user approves the version on npmjs.com.
   A 404 or `0.0.0-stage` right after publishing is expected, not a failure.
6. **Verify.** `npm view @myna/liquidglass version dist-tags`, and install it in a scratch Vite
   app to confirm `import { Glass } from "@myna/liquidglass"` and `@myna/liquidglass/styles.css` resolve.
