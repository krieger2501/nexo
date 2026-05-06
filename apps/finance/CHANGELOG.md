# Changelog

## [2.1.4](https://github.com/krieger2501/buffer/compare/v2.1.3...v2.1.4) (2026-05-05)

### Bug Fixes

- **pwa:** remove double safe-area-inset-bottom padding below nav ([33c5e9c](https://github.com/krieger2501/buffer/commit/33c5e9c7b1c84ddec1845e7c1bec618b5aed6778))
- use type assertion to satisfy typescript ([bfeb370](https://github.com/krieger2501/buffer/commit/bfeb370438ec68dd1304f3516faf7fcfc413683c))

## [2.1.3](https://github.com/krieger2501/buffer/compare/v2.1.2...v2.1.3) (2026-05-05)

### Bug Fixes

- **pwa:** use 100dvh with box-sizing to prevent footer from being pushed up ([d5abe4d](https://github.com/krieger2501/buffer/commit/d5abe4dc06a565786f314366cefb63195d026b66))

## [2.1.2](https://github.com/krieger2501/buffer/compare/v2.1.1...v2.1.2) (2026-05-05)

### Bug Fixes

- **pwa:** fix scrolling nav, disable input zoom, wire display name, idempotent rls ([ec184cb](https://github.com/krieger2501/buffer/commit/ec184cbc333510f5fdbc8d7cae6501908ed72f9d))

### Documentation

- refresh contributing guide and add PR template ([555665a](https://github.com/krieger2501/buffer/commit/555665a858a9e2b1cd1bac666c7853bdd010cb58))

## [2.1.1](https://github.com/krieger2501/buffer/compare/v2.1.0...v2.1.1) (2026-05-05)

### Bug Fixes

- **pwa:** offset content and account menu below safe-area-inset-top ([2380706](https://github.com/krieger2501/buffer/commit/23807065b19596d4dbdaf3ab24592d8ea95584e8))

## [2.1.0](https://github.com/krieger2501/buffer/compare/v2.0.1...v2.1.0) (2026-05-05)

### Features

- fix PWA nav safe area, add account menu, add settings page ([b9b769f](https://github.com/krieger2501/buffer/commit/b9b769f637b7fcbb849b24fb1dcb170bf7c4ca2d))
- **settings:** persist settings to user_settings DB table ([bdac64e](https://github.com/krieger2501/buffer/commit/bdac64e1d5841dc45dc9242cfe0aa175b3e24992))

### Bug Fixes

- **ci:** consolidate to single release job, move configs to .github/ ([64b150b](https://github.com/krieger2501/buffer/commit/64b150bd703cfb6a0d9f5d3a01b3eb58651af679))
- **ci:** use pr_number output for alpha auto-merge ([dcc21d6](https://github.com/krieger2501/buffer/commit/dcc21d68d9d39722f7bfad0f74679aef95b28938))

## [2.0.1](https://github.com/krieger2501/buffer/compare/v2.0.0...v2.0.1) (2026-05-05)

### Bug Fixes

- **ci:** correct Pages output dir to .svelte-kit/cloudflare ([f452ed7](https://github.com/krieger2501/buffer/commit/f452ed7bc341d00ab05d323fe5bbd4eba6027009))

## [2.0.0](https://github.com/krieger2501/buffer/compare/v1.0.0...v2.0.0) (2026-05-05)

### ⚠ BREAKING CHANGES

- **data:** requires running `pnpm db:migrate` and applying drizzle/rls.sql in the Supabase SQL Editor before existing rows are accessible.

### Features

- **auth:** add Google + Apple OAuth via Supabase SSR ([c909594](https://github.com/krieger2501/buffer/commit/c909594f7d669eb092cc792ae8ca40e58982a2d2))
- **data:** scope all data to authenticated user ([a74d903](https://github.com/krieger2501/buffer/commit/a74d9039e1ae33f83c7bce9f3c927f7a5677388a))
- **forecast:** replace due_date with day_of_month for recurring items ([d0b8695](https://github.com/krieger2501/buffer/commit/d0b8695fd792f2fd018f02f91860cd421e5ce43d))
- initial project setup ([c20cc11](https://github.com/krieger2501/buffer/commit/c20cc1188d68423ad1e3b8280945b0bca99fd87c))
- **pwa:** fix manifest, generate icons, correct apple-touch-icon ([b7f596a](https://github.com/krieger2501/buffer/commit/b7f596a67a8f8be548c8f36fe55571fb730f879d))

### Bug Fixes

- **db:** add GRANT privileges to rls.sql, fix drizzle.config.ts node types ([8235dc7](https://github.com/krieger2501/buffer/commit/8235dc7738212eca53b1202d787a945e3daeb884))
- **ui:** extract BottomSheet component, fix nav overlap, slide-up animation ([6882270](https://github.com/krieger2501/buffer/commit/688227084fe6164903af3eaa497d618a9e10a8b1))

## 1.0.0 (2026-05-05)

### ⚠ BREAKING CHANGES

- **data:** requires running `pnpm db:migrate` and applying drizzle/rls.sql in the Supabase SQL Editor before existing rows are accessible.

### Features

- **auth:** add Google + Apple OAuth via Supabase SSR ([c909594](https://github.com/krieger2501/buffer/commit/c909594f7d669eb092cc792ae8ca40e58982a2d2))
- **data:** scope all data to authenticated user ([a74d903](https://github.com/krieger2501/buffer/commit/a74d9039e1ae33f83c7bce9f3c927f7a5677388a))
- **forecast:** replace due_date with day_of_month for recurring items ([d0b8695](https://github.com/krieger2501/buffer/commit/d0b8695fd792f2fd018f02f91860cd421e5ce43d))
- initial project setup ([c20cc11](https://github.com/krieger2501/buffer/commit/c20cc1188d68423ad1e3b8280945b0bca99fd87c))

### Bug Fixes

- **db:** add GRANT privileges to rls.sql, fix drizzle.config.ts node types ([8235dc7](https://github.com/krieger2501/buffer/commit/8235dc7738212eca53b1202d787a945e3daeb884))
- **ui:** extract BottomSheet component, fix nav overlap, slide-up animation ([6882270](https://github.com/krieger2501/buffer/commit/688227084fe6164903af3eaa497d618a9e10a8b1))
