# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

| Task | Command |
|------|---------|
| Install dependencies | `npm ci` |
| Start development server | `npm run dev` |
| Build production assets | `npm run build` |
| Run linting (ESLint) | `npm run lint` |
| Format code (Prettier) | `npm run format` |
| Run all tests | `npm test` |
| Run a single test file | `npm test -- <path/to/test>` |
| Watch tests in CI mode | `npm run test:watch` |

## High‑Level Architecture

The project is a **React + TypeScript** single‑page application bootstrapped with Vite.

* **`src/`** – All source code lives here. The main entry point is `src/main.tsx`, which mounts the React app into the `<div id="root">` element defined in `public/index.html`.
* **Components** – Functional components are organised by feature. Look for folders like `src/components/` and `src/pages/`. Each component file follows the `.tsx` convention and uses TypeScript for type safety.
* **Routing** – The app uses `react-router-dom` (check `src/routes.tsx`) to define the navigation graph. Routes are lazy‑loaded via `React.lazy` and wrapped in a `Suspense` fallback.
* **State Management** – The project currently relies on React Context for shared state. Look at `src/contexts/` for provider implementations.
* **Styling** – Vite serves static assets from `public/` and CSS modules are used in component styles (`*.module.css`).
* **Build** – Vite’s default configuration is used. The `vite.config.ts` file can be extended for custom asset handling or environment variables.

## Important Configuration Files

* **`vite.config.ts`** – Vite entry point, defines plugins and build options.
* **`.eslintrc.js`** – ESLint configuration. It includes TypeScript support and React rules.
* **`.prettierrc.json`** – Prettier formatting options.

## Helpful Scripts (see `package.json`)

* **`npm run dev`** – Starts Vite with hot‑module replacement.
* **`npm run build`** – Builds a production‑ready bundle in the `dist/` directory.
* **`npm run lint`** – Runs ESLint across the codebase.
* **`npm run format`** – Formats files with Prettier.
* **`npm test`** – Executes Jest tests.

## Running Tests Locally

```bash
# Run all tests once
npm test

# Watch mode (useful during development)
npm run test:watch

# Run a specific test file
npm test -- src/__tests__/MyComponent.test.tsx
```
