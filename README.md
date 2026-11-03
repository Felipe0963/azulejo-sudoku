# Azulejo

A sudoku in Portuguese tiles. The board is a wall of glazed tiles: solve a 3×3 panel correctly and it glazes, revealing its part of a cobalt mural. Solve all nine to complete the mural.

## How to play

- Select a cell (click, tap, or arrow keys) and type 1–9, or use the number pad. Delete or Backspace erases.
- **Notes** (N) toggles pencil marks. Placing a number clears it from the notes of every cell in the same row, column and panel.
- Repeated numbers in a row, column or panel are marked as a conflict straight away.
- A panel that matches the solution glazes and locks. Puzzle numbers are locked too.
- **Undo** / **Redo**: Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z (or Ctrl+Y).
- **Hint** reveals the selected cell, or the first empty cell. Hints are counted in the result.
- The timer pauses with **Pause** and when the tab is hidden. The game saves itself, and the best time per level is kept.

Four levels, graded by the hardest technique a person needs: **Easy** (naked singles), **Medium** (+ hidden singles), **Hard** (+ pointing/claiming, naked pairs), **Expert** (+ hidden pairs, X-Wing). Every puzzle has exactly one solution.

## Commands

| Command                | What it does                                                |
| ---------------------- | ----------------------------------------------------------- |
| `npm run dev`          | Development server                                          |
| `npm test`             | Engine and UI unit tests (Vitest + fast-check)              |
| `npm run test:e2e`     | Browser tests on desktop and mobile (Playwright + axe)      |
| `npm run typecheck`    | TypeScript, strict (vue-tsc)                                |
| `npm run lint`         | ESLint (typescript-eslint strict, Vue, vuejs-accessibility) |
| `npm run format:check` | Prettier                                                    |
| `npm run build`        | Production build in `dist/`                                 |
| `npm run puzzles`      | Regenerates the puzzle bank in `src/data/puzzles.json`      |

Open `?level=hard&seed=123` to play a specific puzzle. The URL always reflects the current game, so reloading keeps it.

## Structure

| Folder                     | Contents                                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `src/game/`                | The engine: pure TypeScript, no Vue. Grid, bitmask candidates, validation, solver, grader, generator, game. |
| `src/game/techniques/`     | One solving technique per file, each a pure function that finds one step.                                   |
| `scripts/build-puzzles.ts` | Builds the puzzle bank with the engine's own generator and grader.                                          |
| `src/ui/composables/`      | Game state, timer, keyboard, saving, best times, announcements.                                             |
| `src/ui/components/`       | Board, cells, notes, toolbar, number pad, header, pause, mural, home and win screens.                       |
| `src/ui/content/copy.ts`   | Every piece of text in the game.                                                                            |
| `src/ui/styles/`           | Design tokens and styles.                                                                                   |
| `tests/unit/`              | Techniques, solver, grader, every puzzle in the bank, soundness, game rules and property tests.             |
| `tests/e2e/`               | Browser tests: the engine solves the puzzle and the test types the answer; keyboard, pause, motion, axe.    |
| `docs/`                    | Design and implementation plan.                                                                             |

## Key decisions

- **The engine returns events.** `apply(state, action)` returns the new state and a list of events (placed, conflict, glazed, hinted, blocked, won). The UI animates and announces from those events.
- **Grading like a person.** The grader applies the simplest technique that makes progress, step by step. A puzzle's level is the hardest technique it needed. A soundness test checks that no technique ever removes a true candidate.
- **A generated, tested bank.** 100 puzzles per level, made offline by the engine. A unit test checks that each one has a unique solution and the declared level.
- **Glazing is permanent.** Undo and redo skip moves inside a glazed panel, and a hint stays counted after undo.
- **Accessible.** One tab stop for the grid with arrow keys, descriptive cell names, a polite live region, a real modal pause, contrast measured at 4.5:1 or more, and full reduced-motion support.

## Stack

Vite, Vue 3.5, TypeScript 6 (strict), vue-tsc, Vitest, fast-check, Playwright, axe, ESLint, Prettier, Fontsource (Young Serif, Atkinson Hyperlegible).
