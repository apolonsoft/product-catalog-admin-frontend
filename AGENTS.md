# Agent Guide for `vue-learning`

This file is written for AI coding agents working on the project. It assumes no prior knowledge of the codebase.

---

## Project overview

`vue-learning` is a single-page application (SPA) built with the Vue 3 official tooling. It is a client-side rendered web app that uses:

- **Vue 3** (`^3.5.38`) with the Composition API and `<script setup lang="ts">`.
- **Vue Router 5** (`^5.1.0`) for client-side routing.
- **Tailwind CSS v4** for CSS styling
- **Pinia 3** (`^3.0.4`) for state management.
- **Vite 8** (`^8.0.16`) as the dev server, build tool, and module bundler.
- **TypeScript 6** (`~6.0.0`) for static type checking.
- **Yarn** as the package manager (lock file: `yarn.lock`).

The project is derived from the standard Vue 3 + Vite starter template. It currently contains two routes (`/` and `/about`) and a small example store (`src/stores/counter.ts`).

---

## Runtime and build architecture

- The browser entry point is `index.html`, which loads `/src/main.ts` as a module.
- `src/main.ts` creates the Vue app, installs Pinia and the router, and mounts the root component `src/App.vue` into the `#app` element.
- Vite is configured in `vite.config.ts` with the Vue plugin, Vue DevTools plugin, and an alias `@` that points to `src/`.
- Production builds are output to the `dist/` directory as a static site.
- The project requires **Node.js `^22.18.0 || >=24.12.0`**.
- `vite.config.ts` also registers the Tailwind Vite plugin

---

## Project structure

```text
vue-learning/
├── e2e/                    # Playwright end-to-end tests
├── public/                 # Static assets copied as-is to dist/
├── src/
│   ├── assets/             # Global CSS and image assets
│   ├── components/         # Reusable Vue components
│   │   ├── __tests__/      # Unit tests for components
│   │   └── icons/          # SVG icon components
│   ├── router/             # Vue Router configuration
│   ├── stores/             # Pinia stores
│   ├── views/              # Route-level page components
│   ├── App.vue             # Root component
│   └── main.ts             # Application bootstrap
├── env.d.ts                # Vite client type declarations
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── vitest.config.ts        # Vitest configuration
├── playwright.config.ts    # Playwright configuration
├── eslint.config.ts        # ESLint flat config
├── .oxlintrc.json          # Oxlint configuration
├── tsconfig*.json          # TypeScript project references
└── .prettierrc.json        # Prettier formatting rules
```

### Module divisions

- **`src/views/`** – top-level route components (`HomeView.vue`, `AboutView.vue`).
- **`src/components/`** – reusable UI pieces such as `HelloWorld.vue`, `TheWelcome.vue`, `WelcomeItem.vue`, and icon components.
- **`src/router/index.ts`** – defines routes; `/about` is lazy-loaded for route-level code splitting.
- **`src/stores/counter.ts`** – example Pinia store using the Composition-API-style `defineStore`.
- **`src/assets/`** – `base.css` defines CSS custom properties and resets; `main.css` imports `base.css` and adds layout styles.
  `main.css` imports Tailwind and the existing custom CSS.

---

## Build and development commands

Use Yarn to run the scripts defined in `package.json`:

| Command            | Description                                                             |
| ------------------ | ----------------------------------------------------------------------- |
| `yarn install`     | Install dependencies.                                                   |
| `yarn dev`         | Start the Vite dev server (default `http://localhost:5173`).            |
| `yarn build`       | Type-check and build for production. Outputs to `dist/`.                |
| `yarn build-only`  | Run `vite build` without type checking.                                 |
| `yarn preview`     | Preview the production build locally (default `http://localhost:4173`). |
| `yarn type-check`  | Run `vue-tsc --build` for incremental type checking.                    |
| `yarn lint`        | Run all lint steps in sequence.                                         |
| `yarn lint:oxlint` | Run Oxlint with auto-fix.                                               |
| `yarn lint:eslint` | Run ESLint with auto-fix and caching.                                   |
| `yarn format`      | Format `src/` with Prettier.                                            |

The `build` script runs `type-check` and `build-only` in parallel via `npm-run-all2`.

---

## Testing instructions

### Unit tests

- **Runner:** Vitest
- **Environment:** jsdom
- **Test location:** `src/**/__tests__/*`
- **Example:** `src/components/__tests__/HelloWorld.spec.ts`

```sh
yarn test:unit
```

Vitest inherits the Vite configuration (`vite.config.ts`) and merges its own test settings in `vitest.config.ts`. The `e2e/` directory is excluded from unit test discovery.

### End-to-end tests

- **Runner:** Playwright
- **Test location:** `e2e/`
- **Browsers:** Chromium, Firefox, and WebKit are configured by default.

```sh
# Install Playwright browsers the first time
npx playwright install

# Run all e2e tests
yarn test:e2e

# Run only Chromium tests
yarn test:e2e --project=chromium

# Run a specific file
yarn test:e2e e2e/vue.spec.ts

# Debug mode
yarn test:e2e --debug
```

Playwright starts the dev server automatically when needed. On CI (`CI=true`) it uses the production preview server on port `4173`; locally it uses the dev server on port `5173`. Tests run headless on CI and use HTML reporting.

---

## Code style guidelines

- **Formatter:** Prettier, configured in `.prettierrc.json`:
  - `semi: false`
  - `singleQuote: true`
  - `printWidth: 100`
- **Editor settings:** `.editorconfig` enforces:
  - 2-space indentation
  - LF line endings
  - `max_line_length: 100`
  - UTF-8, final newline, trimmed trailing whitespace
- **Alias:** Use `@/` for imports from `src/`. Example: `import HelloWorld from '@/components/HelloWorld.vue'`.
- **Language:** Write Vue single-file components with `<script setup lang="ts">`.
- **Linting flow:** `yarn lint` runs Oxlint first, then ESLint. ESLint config (`eslint.config.ts`) extends:
  - Vue essential rules
  - Vue + TypeScript recommended rules
  - Playwright rules for `e2e/**/*.{test,spec}.{js,ts,jsx,tsx}`
  - Vitest rules for `src/**/__tests__/*`
  - Oxlint rules derived from `.oxlintrc.json`
  - `eslint-config-prettier` to disable conflicting formatting rules
- **Oxlint:** `.oxlintrc.json` enables the `eslint`, `typescript`, `unicorn`, `oxc`, `vue`, and `vitest` plugins and treats correctness rules as errors.

Run the following before committing:

```sh
yarn lint
yarn format
yarn type-check
```

---

## Security considerations

- The app is a static client-side SPA. There is no backend or authentication code in this repository.
- Runtime configuration should be supplied through Vite environment variables (`import.meta.env.*`). Do not commit `.env` files or other secrets.
- External links in the example components use `target="_blank"` with `rel="noopener"`. Keep this pattern when adding links that open in a new tab.
- No Content Security Policy, service worker, or runtime security headers are configured out of the box. If you deploy the `dist/` folder to a real host, configure those at the server/reverse-proxy level.

---

## Deployment

No deployment configuration (CI/CD pipeline, Dockerfile, etc.) is present in the repository.

To deploy manually:

```sh
yarn build
```

Then serve the contents of the generated `dist/` directory with any static file host or CDN. The production build can be previewed locally with:

```sh
yarn preview
```
