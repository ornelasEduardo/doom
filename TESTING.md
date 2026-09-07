# Testing Doom

Tests are organized by what they protect and where they run:

| Suite | Location | Command |
| --- | --- | --- |
| Focused logic and component contracts | `components/**`, colocated with source | `npm test` |
| Real-browser component regressions | `tests/browser/<Component>/*.test.tsx` | `npm run test:browser` |
| Story examples and interactions | `play` functions in `*.stories.tsx` | `npm run test:storybook` |
| Built-package imports | `tests/package/*.test.ts` | `npm run build && npm run test:package` |

`test:integration` remains an alias for `test:package` for existing callers.
`npm run verify` validates the built package, its exports, and package-import tests.

## Storybook interaction tests

Use `play` for assertions that describe the story itself: its example values,
expected interactions, and presentation. Import `expect`, `userEvent`, and
`waitFor` from `storybook/test`, scope queries to `canvasElement`, and use named
`step` calls so failures are understandable in Storybook's Interactions panel.
Await interactions and assertions; wait for the observable result rather than
using fixed sleeps.

With Storybook already running on port 6006:

```sh
npm run test:storybook
npm run test:storybook -- --includeTags interaction
```

The `interaction` tag selects our explicit interaction examples. The default
command also smoke-tests the remaining stories. To target another running
instance, pass `--url http://127.0.0.1:<port>`.

The current Webpack-based Storybook uses `@storybook/test-runner`, which runs
stories and their play functions in Chromium. The Interactions panel is built
into our Storybook version. A future Vite migration could replace this runner
with Storybook's Vitest addon without changing the play assertions.

For the same static-build execution used in CI:

```sh
npm run build-storybook
npm run test:storybook:ci
```

This command starts a static server, waits for `index.json`, runs the tests,
propagates their exit status, and stops the server. It requires a free port 6006.
To keep a local development server running, use:

```sh
STORYBOOK_TEST_PORT=6010 npm run test:storybook:ci
```

Install Chromium once with `npx playwright install chromium`. CI additionally
installs its Linux system dependencies.

## What stays outside stories

Use the dedicated browser suite for lifecycle, remount, resize, multiple-instance,
and edge-case scenarios that need fixtures beyond a published example. These
use Vitest Browser Mode with Playwright and retain real browser input/layout
coverage. A story play function simulates DOM interactions; it does not replace
all pointer-coordinate or native-browser regression tests.

Keep scale/store calculations and small component contracts near their source.
Put built-artifact import tests under `tests/package`; they must import `dist`,
not source. No suite should rely on another suite having run first except the
explicit package-build prerequisite.

When moving tests, compare discovery counts before and after and preserve the
assertions. Add regression tests to the suite that owns the behavior instead
of duplicating the same check in a story and a browser fixture.

## CI

Doom CI runs focused tests, the dedicated Chromium suite, package validation,
and the Storybook build with its render/interaction tests. Chromatic remains a
separate visual-comparison workflow; it is not a substitute for play assertions.
