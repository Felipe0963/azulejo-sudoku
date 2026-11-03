# Azulejo (Sudoku) — Plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano tarefa por tarefa. Os passos usam caixas de seleção (`- [ ]`) para acompanhamento.

**Objetivo:** construir o Azulejo descrito em `docs/2026-11-03-azulejo-sudoku-design.md`: um Sudoku com gerador, solucionador e classificador de dificuldade próprios, apresentado como um painel de azulejos que vitrifica bloco a bloco.

**Arquitetura:** o motor (`src/game/`) é TypeScript puro. Candidatos são máscaras de 9 bits. Cada técnica de raciocínio é uma função pura que encontra um passo (colocação ou eliminações). O classificador aplica as técnicas em ordem e devolve o nível. Um script gera o banco de puzzles com esse motor. A interface (`src/ui/`) é Vue 3 com composables e componentes pequenos; as ações passam por `apply(state, action)`, que devolve o novo estado e eventos para animar e anunciar.

**Stack:** Node 24, Vite 8, Vue 3.5, TypeScript 6 estrito, vue-tsc 3, Vitest 5, fast-check 4, tsx, Playwright, @axe-core/playwright, ESLint 9 (typescript-eslint, eslint-plugin-vue, eslint-plugin-vuejs-accessibility), Prettier, Fontsource.

Roteiro seguido: `projetos/roteiro-jogos/roteiro.md`.

---

## Decisões de implementação

- **TypeScript 6 e ESLint 9:** as mesmas versões do Number Merge. O typescript-eslint ainda não aceita o TypeScript 7, e o ESLint 10 não é aceito por todos os plugins.
- **Candidatos como máscaras de bits:** `bit(d) = 1 << (d - 1)`; `0x1ff` = todos. Rápido e simples de testar.
- **Testes das técnicas com grades de candidatos montadas à mão:** em vez de procurar puzzles reais para cada técnica, os testes montam o estado de candidatos que dispara a técnica. Isso torna cada teste exato e fácil de ler.
- **Puzzle de referência:** o exemplo clássico da Wikipédia (`53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79`), com solução `534678912672195348198342567859761423426853791713924856961537284287419635345286179`. É usado nos testes do solucionador, do classificador e das ações.
- **Geração por nível:** os números são retirados em ordem aleatória; uma retirada só vale se o puzzle continua com solução única **e** com nível igual ou menor que o pedido. No fim, o puzzle só é aceito se o nível for exatamente o pedido. O script tenta sementes até completar o banco.
- **Banco:** `src/data/puzzles.json` com até 100 puzzles por nível (Expert pode ter menos, se o script não encontrar 100 no tempo-limite; o mínimo aceito é 30). A semente escolhe o puzzle: `seed % quantidade`.
- **Histórico não é salvo:** ao recarregar a página, a partida continua, mas desfazer e refazer recomeçam vazios.
- **Partida terminada:** depois da vitória, nenhuma ação muda o estado.
- **Dica sem alvo válido:** sem casa selecionada (ou se ela já está certa, é do puzzle ou está vitrificada), a dica vai para a primeira casa **vazia**, em ordem de leitura, fora de painel vitrificado. Só quando não há casa vazia ela corrige a primeira casa errada. Se a casa selecionada está errada, a dica corrige essa casa.
- **Texto novo para leitor de tela:** o tabuleiro tem o nome acessível `Sudoku board` (não estava na tabela do design; registrado aqui).

## Pré-requisitos

- Node 24; comandos em `projetos/sudoku/`; repositório com o design (`aae9d22`).

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `package.json`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.gitignore`, `playwright.config.ts`, `index.html`, `env.d.ts` | Projeto e ferramentas |
| `src/game/grid.ts` | Índices, unidades, vizinhos, `parse` e `format` |
| `src/game/candidates.ts` | Máscaras de bits e grade de candidatos |
| `src/game/validate.ts` | Conflitos e tabuleiro resolvido |
| `src/game/solver.ts` | Solução e contagem de soluções |
| `src/game/techniques/*.ts` | Uma técnica por arquivo, mais `types.ts` e `apply-step.ts` |
| `src/game/grade.ts` | Nível de um puzzle |
| `src/game/random.ts` | Gerador com semente |
| `src/game/generate.ts` | Solução completa e puzzle por nível |
| `src/game/game.ts` | Estado, ações e eventos |
| `src/game/serialize.ts` | Salvar e restaurar a partida |
| `src/game/bank.ts` | Escolha de puzzle no banco |
| `src/game/index.ts` | Exportações públicas |
| `scripts/build-puzzles.ts` | Gera o banco |
| `src/data/puzzles.json` | Banco de puzzles |
| `src/ui/content/copy.ts` | Textos e anúncios |
| `src/ui/composables/*.ts` | `useGame`, `useTimer`, `useKeyboard`, `usePersistence`, `useBestTimes`, `useAnnouncer` |
| `src/ui/components/*.vue` | `HomeScreen`, `LevelPicker`, `GameScreen`, `GameHeader`, `Board`, `Cell`, `NotesGrid`, `Toolbar`, `NumberPad`, `PauseOverlay`, `WinScreen`, `Mural` |
| `src/ui/styles/tokens.css`, `src/ui/styles/app.css` | Tokens e estilos |
| `src/App.vue`, `src/main.ts` | Montagem |
| `tests/unit/*.test.ts` | Testes do motor e dos textos |
| `tests/e2e/*.spec.ts` | Testes de navegador |

---

### Tarefa 1: criar o projeto

- [ ] **Passo 1: instalar**

```bash
npm init -y
npm install vue@3 @fontsource/young-serif @fontsource/atkinson-hyperlegible
npm install -D vite@8 @vitejs/plugin-vue@6 typescript@6 vue-tsc@3 @types/node@24 vitest@5 fast-check@4 tsx @playwright/test @axe-core/playwright eslint@9 @eslint/js@9 typescript-eslint eslint-plugin-vue vue-eslint-parser eslint-plugin-vuejs-accessibility eslint-config-prettier globals prettier
npx playwright install chromium
```

- [ ] **Passo 2: `package.json`** (manter as dependências instaladas; trocar o resto por):

```json
{
  "name": "azulejo-sudoku",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview",
    "typecheck": "vue-tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "puzzles": "tsx scripts/build-puzzles.ts"
  }
}
```

Depois, `npm install` para reescrever as dependências a partir do `package-lock.json`.

- [ ] **Passo 3: `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "noEmit": true,
    "jsx": "preserve",
    "types": ["vite/client", "node"]
  },
  "include": ["env.d.ts", "src", "tests", "scripts", "vite.config.ts", "playwright.config.ts"]
}
```

- [ ] **Passo 4: `env.d.ts`**

```ts
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent;
  export default component;
}
```

- [ ] **Passo 5: `vite.config.ts`**

```ts
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  test: { include: ['tests/unit/**/*.test.ts'] },
});
```

- [ ] **Passo 6: `eslint.config.js`**

```js
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import vue from 'eslint-plugin-vue';
import vueA11y from 'eslint-plugin-vuejs-accessibility';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

export default tseslint.config(
  { ignores: ['dist', 'playwright-report', 'test-results', 'src/data'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...vue.configs['flat/recommended'],
  ...vueA11y.configs['flat/recommended'],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
        parser: tseslint.parser,
      },
    },
    rules: {
      // Com noUncheckedIndexedAccess, `!` marca índices que o código já garante; proibir só geraria ruído.
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    // `.vue` usa o vue-eslint-parser, que repassa o <script> para o parser do TypeScript.
    files: ['**/*.vue'],
    languageOptions: { parser: vueParser, parserOptions: { parser: tseslint.parser } },
  },
  { files: ['**/*.js'], ...tseslint.configs.disableTypeChecked },
  prettier,
);
```

- [ ] **Passo 7: `.prettierrc.json`, `.prettierignore`, `.gitignore`**

`.prettierrc.json`: `{ "singleQuote": true, "printWidth": 110 }`

`.prettierignore`:

```
dist
playwright-report
test-results
package-lock.json
docs
src/data
```

`.gitignore`:

```
node_modules/
dist/
playwright-report/
test-results/
```

- [ ] **Passo 8: `index.html`, `src/main.ts`, `src/App.vue` provisório**

`index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="Azulejo: a sudoku in Portuguese tiles. Solve each panel to glaze it and complete the mural." />
    <title>Azulejo</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`src/main.ts`:

```ts
import '@fontsource/young-serif/400.css';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import './ui/styles/tokens.css';
import './ui/styles/app.css';
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
```

`src/App.vue` (provisório, substituído na Tarefa 11):

```vue
<template>
  <h1>Azulejo</h1>
</template>
```

Criar `src/ui/styles/tokens.css` e `src/ui/styles/app.css` vazios.

- [ ] **Passo 9: conferir e commitar**

`npm run build`, `npm run lint`, `npm run format:check` (rodar `npm run format` se preciso).

```bash
git add -A
git commit -m "chore: cria o projeto com Vite, Vue, TypeScript estrito, ESLint e Prettier

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 2: grade, candidatos e validação

**Arquivos:** `src/game/grid.ts`, `candidates.ts`, `validate.ts`; testes `tests/unit/grid.test.ts`, `tests/unit/validate.test.ts`, `tests/unit/fixtures.ts`.

- [ ] **Passo 1: `tests/unit/fixtures.ts`**

```ts
import { parse } from '../../src/game/grid';

/** Exemplo clássico da Wikipédia. */
export const CLASSIC = parse('53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79');
export const CLASSIC_SOLUTION = parse(
  '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
);
export const EMPTY = Array<number>(81).fill(0);
```

- [ ] **Passo 2: `tests/unit/grid.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { BOXES, COLS, PEERS, ROWS, UNITS, boxOf, cellAt, colOf, format, parse, rowOf } from '../../src/game/grid';
import { ALL, bit, count, digits, fromValues, has } from '../../src/game/candidates';
import { CLASSIC } from './fixtures';

describe('grid', () => {
  it('converte entre casa, linha, coluna e bloco', () => {
    expect([rowOf(40), colOf(40), boxOf(40)]).toEqual([4, 4, 4]);
    expect([rowOf(80), colOf(80), boxOf(80)]).toEqual([8, 8, 8]);
    expect(boxOf(cellAt(2, 6))).toBe(2);
    expect(cellAt(4, 4)).toBe(40);
  });

  it('tem 27 unidades de 9 casas', () => {
    expect(ROWS).toHaveLength(9);
    expect(COLS).toHaveLength(9);
    expect(BOXES).toHaveLength(9);
    expect(UNITS).toHaveLength(27);
    for (const unit of UNITS) expect(new Set(unit).size).toBe(9);
    expect(BOXES[0]).toEqual([0, 1, 2, 9, 10, 11, 18, 19, 20]);
  });

  it('cada casa tem 20 vizinhos, sem ela mesma', () => {
    for (let cell = 0; cell < 81; cell++) {
      expect(PEERS[cell]).toHaveLength(20);
      expect(PEERS[cell]).not.toContain(cell);
    }
  });

  it('parse e format são inversos', () => {
    const text = '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79';
    expect(format(parse(text))).toBe(text);
    expect(parse(text.replaceAll('.', '0'))).toEqual(parse(text));
  });

  it('parse recusa texto inválido', () => {
    expect(() => parse('123')).toThrow();
    expect(() => parse('x'.repeat(81))).toThrow();
  });
});

describe('candidates', () => {
  it('máscaras de bits', () => {
    expect(bit(1)).toBe(1);
    expect(bit(9)).toBe(256);
    expect(count(ALL)).toBe(9);
    expect(digits(bit(2) | bit(7))).toEqual([2, 7]);
    expect(has(bit(4), 4)).toBe(true);
    expect(has(bit(4), 5)).toBe(false);
  });

  it('fromValues tira dos candidatos os números dos vizinhos', () => {
    const grid = fromValues(CLASSIC);
    expect(grid.candidates[0]).toBe(0);
    // Linha 0 tem 5, 3, 7; coluna 2 tem 8; bloco 0 tem 5, 3, 6, 9, 8.
    expect(digits(grid.candidates[2]!)).toEqual([1, 2, 4]);
  });
});
```

- [ ] **Passo 3: `tests/unit/validate.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { conflicts, isSolved } from '../../src/game/validate';
import { CLASSIC, CLASSIC_SOLUTION } from './fixtures';

describe('validate', () => {
  it('o puzzle original não tem conflitos', () => {
    expect(conflicts(CLASSIC).size).toBe(0);
  });

  it('marca as duas casas de um número repetido', () => {
    const values = [...CLASSIC];
    values[2] = 5;
    expect([...conflicts(values)].sort((a, b) => a - b)).toEqual([0, 2]);
  });

  it('isSolved só é verdadeiro com o tabuleiro completo e sem conflitos', () => {
    expect(isSolved(CLASSIC_SOLUTION)).toBe(true);
    expect(isSolved(CLASSIC)).toBe(false);
    const wrong = [...CLASSIC_SOLUTION];
    [wrong[0], wrong[1]] = [wrong[1]!, wrong[0]!];
    expect(isSolved(wrong)).toBe(false);
  });
});
```

Rodar `npm test` → FAIL (módulos não encontrados).

- [ ] **Passo 4: `src/game/grid.ts`**

```ts
export const SIZE = 9;
export const CELLS = 81;

/** 81 números, em ordem de leitura; 0 é casa vazia. */
export type Values = readonly number[];

export const rowOf = (cell: number): number => Math.floor(cell / SIZE);
export const colOf = (cell: number): number => cell % SIZE;
export const boxOf = (cell: number): number => Math.floor(rowOf(cell) / 3) * 3 + Math.floor(colOf(cell) / 3);
export const cellAt = (row: number, col: number): number => row * SIZE + col;

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

export const ROWS: readonly (readonly number[])[] = range(SIZE).map((r) => range(SIZE).map((c) => cellAt(r, c)));
export const COLS: readonly (readonly number[])[] = range(SIZE).map((c) => range(SIZE).map((r) => cellAt(r, c)));
export const BOXES: readonly (readonly number[])[] = range(SIZE).map((b) =>
  range(SIZE).map((i) => cellAt(Math.floor(b / 3) * 3 + Math.floor(i / 3), (b % 3) * 3 + (i % 3))),
);
export const UNITS: readonly (readonly number[])[] = [...ROWS, ...COLS, ...BOXES];

/** As 20 casas que compartilham linha, coluna ou bloco com cada casa. */
export const PEERS: readonly (readonly number[])[] = range(CELLS).map((cell) => {
  const peers = new Set([...ROWS[rowOf(cell)]!, ...COLS[colOf(cell)]!, ...BOXES[boxOf(cell)]!]);
  peers.delete(cell);
  return [...peers].sort((a, b) => a - b);
});

/** Lê 81 caracteres: dígitos de 1 a 9, e `.` ou `0` para casa vazia. */
export function parse(text: string): number[] {
  if (text.length !== CELLS) throw new Error(`A puzzle needs ${String(CELLS)} characters.`);
  return [...text].map((char) => {
    if (char === '.' || char === '0') return 0;
    const digit = Number(char);
    if (!Number.isInteger(digit) || digit < 1 || digit > 9) throw new Error(`Invalid character "${char}".`);
    return digit;
  });
}

export const format = (values: Values): string => values.map((v) => (v === 0 ? '.' : String(v))).join('');
```

- [ ] **Passo 5: `src/game/candidates.ts`**

```ts
import { CELLS, PEERS, type Values } from './grid';

/** Todos os candidatos, de 1 a 9. */
export const ALL = 0x1ff;

export const bit = (digit: number): number => 1 << (digit - 1);
export const has = (mask: number, digit: number): boolean => (mask & bit(digit)) !== 0;

export function count(mask: number): number {
  let total = 0;
  for (let m = mask; m !== 0; m &= m - 1) total++;
  return total;
}

export function digits(mask: number): number[] {
  const result: number[] = [];
  for (let digit = 1; digit <= 9; digit++) if (has(mask, digit)) result.push(digit);
  return result;
}

/** Números colocados e candidatos de cada casa vazia (0 nas casas preenchidas). Usada pelo solucionador e pelas técnicas. */
export interface CandidateGrid {
  values: number[];
  candidates: number[];
}

export function fromValues(values: Values): CandidateGrid {
  const candidates = Array.from({ length: CELLS }, (_, cell) => {
    if (values[cell] !== 0) return 0;
    let mask = ALL;
    for (const peer of PEERS[cell]!) if (values[peer]! !== 0) mask &= ~bit(values[peer]!);
    return mask;
  });
  return { values: [...values], candidates };
}

export const cloneGrid = (grid: Readonly<CandidateGrid>): CandidateGrid => ({
  values: [...grid.values],
  candidates: [...grid.candidates],
});

/** Coloca um número e o tira dos candidatos dos vizinhos. Altera `grid`. */
export function placeDigit(grid: CandidateGrid, cell: number, digit: number): void {
  grid.values[cell] = digit;
  grid.candidates[cell] = 0;
  for (const peer of PEERS[cell]!) grid.candidates[peer]! &= ~bit(digit);
}
```

- [ ] **Passo 6: `src/game/validate.ts`**

```ts
import { UNITS, type Values } from './grid';

/** Casas cujo número se repete em alguma linha, coluna ou bloco. */
export function conflicts(values: Values): Set<number> {
  const result = new Set<number>();
  for (const unit of UNITS) {
    const seen = new Map<number, number>();
    for (const cell of unit) {
      const value = values[cell]!;
      if (value === 0) continue;
      const first = seen.get(value);
      if (first === undefined) {
        seen.set(value, cell);
      } else {
        result.add(first);
        result.add(cell);
      }
    }
  }
  return result;
}

export const isComplete = (values: Values): boolean => values.every((value) => value !== 0);

export const isSolved = (values: Values): boolean => isComplete(values) && conflicts(values).size === 0;
```

- [ ] **Passo 7: rodar, conferir e commitar**

`npm test` → PASS; `npm run typecheck` e `npm run lint` → limpos.

```bash
git add src/game tests/unit
git commit -m "feat: grade, candidatos em máscara de bits e validação de conflitos

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 3: solucionador

**Arquivos:** `src/game/solver.ts`; teste `tests/unit/solver.test.ts`.

- [ ] **Passo 1: teste**

```ts
import { describe, expect, it } from 'vitest';
import { countSolutions, solve } from '../../src/game/solver';
import { CLASSIC, CLASSIC_SOLUTION, EMPTY } from './fixtures';

describe('solver', () => {
  it('resolve o puzzle clássico', () => {
    expect(solve(CLASSIC)).toEqual(CLASSIC_SOLUTION);
  });

  it('o puzzle clássico tem solução única', () => {
    expect(countSolutions(CLASSIC)).toBe(1);
  });

  it('o tabuleiro vazio tem mais de uma solução (para no limite)', () => {
    expect(countSolutions(EMPTY, 2)).toBe(2);
  });

  it('um puzzle com conflito não tem solução', () => {
    const broken = [...CLASSIC];
    broken[2] = 5;
    expect(countSolutions(broken)).toBe(0);
    expect(solve(broken)).toBeNull();
  });

  it('a solução sem uma casa continua única', () => {
    const almost = [...CLASSIC_SOLUTION];
    almost[40] = 0;
    expect(countSolutions(almost)).toBe(1);
  });

  it('não altera o tabuleiro recebido', () => {
    const copy = [...CLASSIC];
    solve(copy);
    expect(copy).toEqual(CLASSIC);
  });
});
```

Rodar → FAIL.

- [ ] **Passo 2: `src/game/solver.ts`**

```ts
import { cloneGrid, count, digits, fromValues, placeDigit, type CandidateGrid } from './candidates';
import type { Values } from './grid';
import { conflicts } from './validate';

/** Casa vazia com menos candidatos, ou -1 se não há casa vazia. */
function mostConstrained(grid: CandidateGrid): number {
  let best = -1;
  let fewest = 10;
  for (let cell = 0; cell < grid.values.length; cell++) {
    if (grid.values[cell] !== 0) continue;
    const options = count(grid.candidates[cell]!);
    if (options < fewest) {
      fewest = options;
      best = cell;
      if (options <= 1) break;
    }
  }
  return best;
}

/**
 * Busca em profundidade, sempre pela casa com menos candidatos. `onSolution` recebe cada solução e
 * devolve `true` para parar. Devolve `true` se a busca foi interrompida.
 */
function search(grid: CandidateGrid, onSolution: (values: number[]) => boolean): boolean {
  const cell = mostConstrained(grid);
  if (cell === -1) return onSolution(grid.values);
  for (const digit of digits(grid.candidates[cell]!)) {
    const next = cloneGrid(grid);
    placeDigit(next, cell, digit);
    if (search(next, onSolution)) return true;
  }
  return false;
}

/** Primeira solução encontrada, ou null. Não altera `values`. */
export function solve(values: Values): number[] | null {
  if (conflicts(values).size > 0) return null;
  let found: number[] | null = null;
  search(fromValues(values), (solution) => {
    found = [...solution];
    return true;
  });
  return found;
}

/** Número de soluções, contando até `limit` (2 basta para saber se é única). */
export function countSolutions(values: Values, limit = 2): number {
  if (conflicts(values).size > 0) return 0;
  let total = 0;
  search(fromValues(values), () => {
    total++;
    return total >= limit;
  });
  return total;
}
```

- [ ] **Passo 3: rodar, conferir e commitar**

```bash
git add src/game/solver.ts tests/unit/solver.test.ts
git commit -m "feat: solucionador com contagem de soluções

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 4: técnicas de raciocínio

**Arquivos:** `src/game/techniques/{types,apply-step,naked-single,hidden-single,locked-candidates,naked-pair,hidden-pair,x-wing}.ts`; teste `tests/unit/techniques.test.ts`.

- [ ] **Passo 1: teste**

Cada teste monta uma grade de candidatos em que **só** a técnica testada (e nenhuma anterior a ela no mesmo tipo de varredura) encontra o passo esperado.

```ts
import { describe, expect, it } from 'vitest';
import { ALL, bit, type CandidateGrid } from '../../src/game/candidates';
import { ROWS } from '../../src/game/grid';
import { applyStep } from '../../src/game/techniques/apply-step';
import { hiddenPair } from '../../src/game/techniques/hidden-pair';
import { hiddenSingle } from '../../src/game/techniques/hidden-single';
import { lockedCandidates } from '../../src/game/techniques/locked-candidates';
import { nakedPair } from '../../src/game/techniques/naked-pair';
import { nakedSingle } from '../../src/game/techniques/naked-single';
import { xWing } from '../../src/game/techniques/x-wing';

/** Grade vazia com todos os candidatos em todas as casas. */
const open = (): CandidateGrid => ({ values: Array<number>(81).fill(0), candidates: Array<number>(81).fill(ALL) });
const without = (digit: number) => ALL & ~bit(digit);
const eliminated = (step: ReturnType<typeof nakedPair>) =>
  (step?.eliminate ?? []).map((e) => `${String(e.cell)}:${String(e.digit)}`).sort();

describe('nakedSingle', () => {
  it('coloca o único candidato de uma casa', () => {
    const grid = open();
    grid.candidates[40] = bit(5);
    expect(nakedSingle(grid)).toEqual({ technique: 'nakedSingle', place: { cell: 40, digit: 5 }, eliminate: [] });
  });

  it('não acha nada quando toda casa tem vários candidatos', () => {
    expect(nakedSingle(open())).toBeNull();
  });
});

describe('hiddenSingle', () => {
  it('coloca o número que só cabe numa casa da linha', () => {
    const grid = open();
    for (const cell of ROWS[0]!) grid.candidates[cell] = without(7);
    grid.candidates[3] = ALL;
    expect(hiddenSingle(grid)).toEqual({ technique: 'hiddenSingle', place: { cell: 3, digit: 7 }, eliminate: [] });
  });
});

describe('lockedCandidates', () => {
  it('pointing: o 4 do bloco 0 só está na linha 0, então sai do resto da linha', () => {
    const grid = open();
    for (const cell of [2, 9, 10, 11, 18, 19, 20]) grid.candidates[cell] = without(4);
    const step = lockedCandidates(grid);
    expect(step?.technique).toBe('pointing');
    expect(eliminated(step)).toEqual(['3:4', '4:4', '5:4', '6:4', '7:4', '8:4']);
  });

  it('claiming: o 4 da linha 0 só está no bloco 0, então sai do resto do bloco', () => {
    const grid = open();
    for (const cell of [2, 3, 4, 5, 6, 7, 8]) grid.candidates[cell] = without(4);
    const step = lockedCandidates(grid);
    expect(step?.technique).toBe('pointing');
    expect(eliminated(step)).toEqual(['10:4', '11:4', '18:4', '19:4', '20:4', '9:4']);
  });
});

describe('nakedPair', () => {
  it('duas casas com o mesmo par tiram esses números do resto da linha', () => {
    const grid = open();
    grid.candidates[0] = bit(1) | bit(2);
    grid.candidates[1] = bit(1) | bit(2);
    const step = nakedPair(grid);
    expect(step?.technique).toBe('nakedPair');
    const expected = [2, 3, 4, 5, 6, 7, 8].flatMap((cell) => [`${String(cell)}:1`, `${String(cell)}:2`]).sort();
    expect(eliminated(step)).toEqual(expected);
  });
});

describe('hiddenPair', () => {
  it('dois números que só cabem nas mesmas duas casas tiram os outros candidatos delas', () => {
    const grid = open();
    for (const cell of [2, 3, 4, 5, 6, 7, 8]) grid.candidates[cell] = ALL & ~bit(1) & ~bit(2);
    const step = hiddenPair(grid);
    expect(step?.technique).toBe('hiddenPair');
    const expected = [0, 1].flatMap((cell) => [3, 4, 5, 6, 7, 8, 9].map((d) => `${String(cell)}:${String(d)}`)).sort();
    expect(eliminated(step)).toEqual(expected);
  });
});

describe('xWing', () => {
  it('o 5 só nas colunas 2 e 6 das linhas 1 e 4 sai dessas colunas nas outras linhas', () => {
    const grid = open();
    for (const row of [1, 4]) {
      for (const cell of ROWS[row]!) grid.candidates[cell] = without(5);
      grid.candidates[row * 9 + 2] = ALL;
      grid.candidates[row * 9 + 6] = ALL;
    }
    const step = xWing(grid);
    expect(step?.technique).toBe('xWing');
    const expected = [0, 2, 3, 5, 6, 7, 8]
      .flatMap((row) => [row * 9 + 2, row * 9 + 6].map((cell) => `${String(cell)}:5`))
      .sort();
    expect(eliminated(step)).toEqual(expected);
  });
});

describe('applyStep', () => {
  it('aplica uma colocação e tira o número dos vizinhos', () => {
    const grid = open();
    applyStep(grid, { technique: 'nakedSingle', place: { cell: 0, digit: 3 }, eliminate: [] });
    expect(grid.values[0]).toBe(3);
    expect(grid.candidates[1]! & bit(3)).toBe(0);
  });

  it('aplica eliminações', () => {
    const grid = open();
    applyStep(grid, { technique: 'nakedPair', eliminate: [{ cell: 5, digit: 9 }] });
    expect(grid.candidates[5]! & bit(9)).toBe(0);
  });
});
```

No teste de `lockedCandidates` (claiming), as casas do bloco 1 e 2 na linha 0 não têm o 4; por isso o pointing dos blocos 1 e 2 não acha nada (o 4 está em duas linhas nesses blocos), e a varredura chega ao claiming da linha 0. Se a implementação achar outro passo antes, conferir a ordem da varredura descrita no código abaixo.

Rodar → FAIL.

- [ ] **Passo 2: `techniques/types.ts`**

```ts
import type { CandidateGrid } from '../candidates';

export type TechniqueId = 'nakedSingle' | 'hiddenSingle' | 'pointing' | 'nakedPair' | 'hiddenPair' | 'xWing';

export interface Placement {
  readonly cell: number;
  readonly digit: number;
}

/** Um passo de raciocínio: uma colocação, ou candidatos a eliminar. */
export interface Step {
  readonly technique: TechniqueId;
  readonly place?: Placement;
  readonly eliminate: readonly Placement[];
}

/** Procura um passo que faça progresso. Não altera a grade. */
export type Technique = (grid: Readonly<CandidateGrid>) => Step | null;
```

- [ ] **Passo 3: `techniques/apply-step.ts`**

```ts
import { bit, placeDigit, type CandidateGrid } from '../candidates';
import type { Step } from './types';

/** Aplica um passo à grade. Altera `grid`. */
export function applyStep(grid: CandidateGrid, step: Step): void {
  if (step.place) placeDigit(grid, step.place.cell, step.place.digit);
  for (const { cell, digit } of step.eliminate) grid.candidates[cell]! &= ~bit(digit);
}
```

- [ ] **Passo 4: `techniques/naked-single.ts`**

```ts
import { count, digits } from '../candidates';
import type { Technique } from './types';

/** Casa vazia com um único candidato. */
export const nakedSingle: Technique = (grid) => {
  for (let cell = 0; cell < grid.values.length; cell++) {
    if (grid.values[cell] === 0 && count(grid.candidates[cell]!) === 1) {
      return { technique: 'nakedSingle', place: { cell, digit: digits(grid.candidates[cell]!)[0]! }, eliminate: [] };
    }
  }
  return null;
};
```

- [ ] **Passo 5: `techniques/hidden-single.ts`**

```ts
import { has } from '../candidates';
import { UNITS } from '../grid';
import type { Technique } from './types';

/** Número que só cabe numa casa de uma linha, coluna ou bloco. */
export const hiddenSingle: Technique = (grid) => {
  for (const unit of UNITS) {
    for (let digit = 1; digit <= 9; digit++) {
      if (unit.some((cell) => grid.values[cell] === digit)) continue;
      const spots = unit.filter((cell) => grid.values[cell] === 0 && has(grid.candidates[cell]!, digit));
      if (spots.length === 1) return { technique: 'hiddenSingle', place: { cell: spots[0]!, digit }, eliminate: [] };
    }
  }
  return null;
};
```

- [ ] **Passo 6: `techniques/locked-candidates.ts`**

```ts
import { has } from '../candidates';
import { BOXES, COLS, ROWS, boxOf, colOf, rowOf } from '../grid';
import type { Placement, Step, Technique } from './types';

const spotsOf = (grid: Parameters<Technique>[0], unit: readonly number[], digit: number) =>
  unit.filter((cell) => grid.values[cell] === 0 && has(grid.candidates[cell]!, digit));

const eliminations = (grid: Parameters<Technique>[0], cells: readonly number[], digit: number): Placement[] =>
  spotsOf(grid, cells, digit).map((cell) => ({ cell, digit }));

const step = (eliminate: Placement[]): Step | null =>
  eliminate.length > 0 ? { technique: 'pointing', eliminate } : null;

/**
 * Pointing: num bloco, o número só aparece numa linha (ou coluna), então sai do resto dessa linha.
 * Claiming: numa linha (ou coluna), o número só aparece num bloco, então sai do resto do bloco.
 * Ambos contam como a mesma técnica de nível. Varre blocos primeiro, depois linhas e colunas.
 */
export const lockedCandidates: Technique = (grid) => {
  for (const [box, cells] of BOXES.entries()) {
    for (let digit = 1; digit <= 9; digit++) {
      const spots = spotsOf(grid, cells, digit);
      if (spots.length < 2) continue;
      const rows = new Set(spots.map(rowOf));
      if (rows.size === 1) {
        const found = step(eliminations(grid, ROWS[rowOf(spots[0]!)]!.filter((c) => boxOf(c) !== box), digit));
        if (found) return found;
      }
      const cols = new Set(spots.map(colOf));
      if (cols.size === 1) {
        const found = step(eliminations(grid, COLS[colOf(spots[0]!)]!.filter((c) => boxOf(c) !== box), digit));
        if (found) return found;
      }
    }
  }
  for (const line of [...ROWS, ...COLS]) {
    for (let digit = 1; digit <= 9; digit++) {
      const spots = spotsOf(grid, line, digit);
      if (spots.length < 2) continue;
      const boxes = new Set(spots.map(boxOf));
      if (boxes.size !== 1) continue;
      const found = step(eliminations(grid, BOXES[boxOf(spots[0]!)]!.filter((c) => !line.includes(c)), digit));
      if (found) return found;
    }
  }
  return null;
};
```

- [ ] **Passo 7: `techniques/naked-pair.ts`**

```ts
import { count, digits, has } from '../candidates';
import { UNITS } from '../grid';
import type { Placement, Technique } from './types';

/** Duas casas de uma unidade com o mesmo par de candidatos: esses números saem das outras casas. */
export const nakedPair: Technique = (grid) => {
  for (const unit of UNITS) {
    const pairs = unit.filter((cell) => grid.values[cell] === 0 && count(grid.candidates[cell]!) === 2);
    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        const mask = grid.candidates[pairs[i]!]!;
        if (mask !== grid.candidates[pairs[j]!]) continue;
        const eliminate: Placement[] = [];
        for (const cell of unit) {
          if (cell === pairs[i] || cell === pairs[j] || grid.values[cell] !== 0) continue;
          for (const digit of digits(mask)) if (has(grid.candidates[cell]!, digit)) eliminate.push({ cell, digit });
        }
        if (eliminate.length > 0) return { technique: 'nakedPair', eliminate };
      }
    }
  }
  return null;
};
```

- [ ] **Passo 8: `techniques/hidden-pair.ts`**

```ts
import { digits, has } from '../candidates';
import { UNITS } from '../grid';
import type { Placement, Technique } from './types';

/** Dois números que, numa unidade, só cabem nas mesmas duas casas: os outros candidatos dessas casas saem. */
export const hiddenPair: Technique = (grid) => {
  for (const unit of UNITS) {
    const spots = (digit: number) =>
      unit.filter((cell) => grid.values[cell] === 0 && has(grid.candidates[cell]!, digit));
    for (let a = 1; a <= 9; a++) {
      const first = spots(a);
      if (first.length !== 2) continue;
      for (let b = a + 1; b <= 9; b++) {
        const second = spots(b);
        if (second.length !== 2 || second[0] !== first[0] || second[1] !== first[1]) continue;
        const eliminate: Placement[] = first.flatMap((cell) =>
          digits(grid.candidates[cell]!)
            .filter((digit) => digit !== a && digit !== b)
            .map((digit) => ({ cell, digit })),
        );
        if (eliminate.length > 0) return { technique: 'hiddenPair', eliminate };
      }
    }
  }
  return null;
};
```

- [ ] **Passo 9: `techniques/x-wing.ts`**

```ts
import { has } from '../candidates';
import { COLS, ROWS } from '../grid';
import type { Placement, Technique } from './types';

/**
 * Se um número, em duas linhas, só cabe nas mesmas duas colunas, ele sai dessas colunas nas outras linhas.
 * O mesmo vale trocando linhas por colunas.
 */
export const xWing: Technique = (grid) => {
  const orientations = [
    { lines: ROWS, crosses: COLS },
    { lines: COLS, crosses: ROWS },
  ];
  for (let digit = 1; digit <= 9; digit++) {
    for (const { lines, crosses } of orientations) {
      const positions = lines.map((line) =>
        line.flatMap((cell, index) => (grid.values[cell] === 0 && has(grid.candidates[cell]!, digit) ? [index] : [])),
      );
      for (let i = 0; i < 9; i++) {
        if (positions[i]!.length !== 2) continue;
        for (let j = i + 1; j < 9; j++) {
          const [a, b] = positions[i]!;
          if (positions[j]!.length !== 2 || positions[j]![0] !== a || positions[j]![1] !== b) continue;
          const base = new Set([...lines[i]!, ...lines[j]!]);
          const eliminate: Placement[] = [crosses[a!]!, crosses[b!]!]
            .flat()
            .filter((cell) => !base.has(cell) && grid.values[cell] === 0 && has(grid.candidates[cell]!, digit))
            .map((cell) => ({ cell, digit }));
          if (eliminate.length > 0) return { technique: 'xWing', eliminate };
        }
      }
    }
  }
  return null;
};
```

- [ ] **Passo 10: rodar, conferir e commitar**

`npm test` → PASS. Se um teste falhar, conferir à mão o estado montado e a ordem de varredura antes de mudar o código; só ajustar o teste se a expectativa estiver errada em relação à definição da técnica, e explicar.

```bash
git add src/game/techniques tests/unit/techniques.test.ts
git commit -m "feat: técnicas de raciocínio do Sudoku, uma por arquivo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 5: classificador, sorteio e gerador

**Arquivos:** `src/game/grade.ts`, `random.ts`, `generate.ts`; testes `tests/unit/grade.test.ts`, `tests/unit/generate.test.ts`.

- [ ] **Passo 1: `tests/unit/grade.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { LEVELS, grade } from '../../src/game/grade';
import { CLASSIC, CLASSIC_SOLUTION, EMPTY } from './fixtures';

describe('grade', () => {
  it('a solução completa é Easy', () => {
    expect(grade(CLASSIC_SOLUTION)).toBe('easy');
  });

  it('o puzzle clássico se resolve só com casas e números únicos', () => {
    expect(['easy', 'medium']).toContain(grade(CLASSIC));
  });

  it('o tabuleiro vazio não se resolve por lógica', () => {
    expect(grade(EMPTY)).toBeNull();
  });

  it('a solução sem uma casa é Easy', () => {
    const almost = [...CLASSIC_SOLUTION];
    almost[0] = 0;
    expect(grade(almost)).toBe('easy');
  });

  it('os níveis vêm em ordem', () => {
    expect(LEVELS).toEqual(['easy', 'medium', 'hard', 'expert']);
  });
});
```

- [ ] **Passo 2: `tests/unit/generate.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { generateForLevel, generateSolution } from '../../src/game/generate';
import { grade } from '../../src/game/grade';
import { createRandom } from '../../src/game/random';
import { countSolutions } from '../../src/game/solver';
import { isSolved } from '../../src/game/validate';

describe('random', () => {
  it('é determinístico e fica entre 0 e 1', () => {
    const a = createRandom(42);
    const b = createRandom(42);
    const first = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(first);
    for (const value of first) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('generateSolution', () => {
  it('gera uma grade completa e válida, igual para a mesma semente', () => {
    const solution = generateSolution(createRandom(7));
    expect(isSolved(solution)).toBe(true);
    expect(generateSolution(createRandom(7))).toEqual(solution);
    expect(generateSolution(createRandom(8))).not.toEqual(solution);
  });
});

describe('generateForLevel', () => {
  it('gera puzzles Easy e Medium com solução única e no nível pedido', () => {
    for (const level of ['easy', 'medium'] as const) {
      let found = null;
      for (let seed = 1; seed <= 30 && !found; seed++) found = generateForLevel(seed, level);
      expect(found).not.toBeNull();
      expect(countSolutions(found!.puzzle)).toBe(1);
      expect(grade(found!.puzzle)).toBe(level);
      expect(isSolved(found!.solution)).toBe(true);
    }
  });

  it('a mesma semente gera o mesmo puzzle', () => {
    expect(generateForLevel(3, 'easy')).toEqual(generateForLevel(3, 'easy'));
  });
});
```

Rodar → FAIL.

- [ ] **Passo 3: `src/game/grade.ts`**

```ts
import { fromValues } from './candidates';
import type { Values } from './grid';
import { applyStep } from './techniques/apply-step';
import { hiddenPair } from './techniques/hidden-pair';
import { hiddenSingle } from './techniques/hidden-single';
import { lockedCandidates } from './techniques/locked-candidates';
import { nakedPair } from './techniques/naked-pair';
import { nakedSingle } from './techniques/naked-single';
import type { Technique } from './techniques/types';
import { xWing } from './techniques/x-wing';

export const LEVELS = ['easy', 'medium', 'hard', 'expert'] as const;
export type Level = (typeof LEVELS)[number];

/** Técnicas da mais simples para a mais difícil, com o nível que cada uma representa. */
const ORDER: readonly { technique: Technique; level: number }[] = [
  { technique: nakedSingle, level: 0 },
  { technique: hiddenSingle, level: 1 },
  { technique: lockedCandidates, level: 2 },
  { technique: nakedPair, level: 2 },
  { technique: hiddenPair, level: 3 },
  { technique: xWing, level: 3 },
];

/**
 * Resolve como uma pessoa: a cada passo, usa a técnica mais simples que faz progresso. O nível é o da
 * técnica mais difícil que foi necessária. Devolve null se as técnicas não resolvem o puzzle.
 */
export function grade(values: Values): Level | null {
  const grid = fromValues(values);
  let hardest = 0;
  for (;;) {
    if (grid.values.every((value) => value !== 0)) return LEVELS[hardest]!;
    if (grid.values.some((value, cell) => value === 0 && grid.candidates[cell] === 0)) return null;
    let progressed = false;
    for (const { technique, level } of ORDER) {
      const step = technique(grid);
      if (!step) continue;
      applyStep(grid, step);
      hardest = Math.max(hardest, level);
      progressed = true;
      break;
    }
    if (!progressed) return null;
  }
}

export const levelIndex = (level: Level): number => LEVELS.indexOf(level);
```

- [ ] **Passo 4: `src/game/random.ts`**

```ts
export type Random = () => number;

/** Gerador mulberry32: devolve números em [0, 1), sempre a mesma sequência para a mesma semente. */
export function createRandom(seed: number): Random {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let r = Math.imul(state ^ (state >>> 15), state | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], random: Random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const current = result[i]!;
    result[i] = result[j]!;
    result[j] = current;
  }
  return result;
}
```

- [ ] **Passo 5: `src/game/generate.ts`**

```ts
import { cloneGrid, digits, fromValues, placeDigit, type CandidateGrid } from './candidates';
import { grade, levelIndex, type Level } from './grade';
import { CELLS } from './grid';
import { createRandom, shuffle, type Random } from './random';
import { countSolutions } from './solver';

function fill(grid: CandidateGrid, random: Random): CandidateGrid | null {
  const cell = grid.values.indexOf(0);
  if (cell === -1) return grid;
  for (const digit of shuffle(digits(grid.candidates[cell]!), random)) {
    const next = cloneGrid(grid);
    placeDigit(next, cell, digit);
    const done = fill(next, random);
    if (done) return done;
  }
  return null;
}

/** Uma grade completa e válida, embaralhada a partir do gerador. */
export function generateSolution(random: Random): number[] {
  const solved = fill(fromValues(Array<number>(CELLS).fill(0)), random);
  if (!solved) throw new Error('Could not build a solution.');
  return solved.values;
}

export interface Generated {
  readonly seed: number;
  readonly puzzle: number[];
  readonly solution: number[];
}

/**
 * Tira números em ordem aleatória. Uma retirada só fica se o puzzle continua com solução única e com nível
 * até `level`. No fim, o puzzle só é aceito se o nível for exatamente `level`; senão, devolve null.
 */
export function generateForLevel(seed: number, level: Level): Generated | null {
  const random = createRandom(seed);
  const solution = generateSolution(random);
  const puzzle = [...solution];
  const target = levelIndex(level);
  for (const cell of shuffle(Array.from({ length: CELLS }, (_, i) => i), random)) {
    const kept = puzzle[cell]!;
    puzzle[cell] = 0;
    const graded = grade(puzzle);
    if (countSolutions(puzzle) !== 1 || graded === null || levelIndex(graded) > target) puzzle[cell] = kept;
  }
  return grade(puzzle) === level ? { seed, puzzle, solution } : null;
}
```

- [ ] **Passo 6: rodar, conferir e commitar**

`npm test` → PASS (o teste do gerador pode levar alguns segundos).

```bash
git add src/game tests/unit
git commit -m "feat: classificador de dificuldade, sorteio com semente e gerador por nível

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 6: banco de puzzles

**Arquivos:** `scripts/build-puzzles.ts`, `src/data/puzzles.json`, `src/game/bank.ts`; teste `tests/unit/bank.test.ts`.

- [ ] **Passo 1: `scripts/build-puzzles.ts`**

```ts
import { writeFileSync } from 'node:fs';
import { generateForLevel } from '../src/game/generate';
import { LEVELS, type Level } from '../src/game/grade';
import { format } from '../src/game/grid';

const TARGET = 100;
const MINIMUM = 30;
const TIME_LIMIT_MS = 10 * 60 * 1000;

const bank: Record<Level, string[]> = { easy: [], medium: [], hard: [], expert: [] };
const started = Date.now();

for (let seed = 1; LEVELS.some((level) => bank[level].length < TARGET); seed++) {
  if (Date.now() - started > TIME_LIMIT_MS) break;
  for (const level of LEVELS) {
    if (bank[level].length >= TARGET) continue;
    const generated = generateForLevel(seed * 4 + LEVELS.indexOf(level), level);
    if (generated) bank[level].push(format(generated.puzzle));
  }
  if (seed % 50 === 0) console.log(seed, LEVELS.map((level) => `${level}=${String(bank[level].length)}`).join(' '));
}

for (const level of LEVELS) {
  if (bank[level].length < MINIMUM) throw new Error(`Only ${String(bank[level].length)} ${level} puzzles were found.`);
}

writeFileSync(new URL('../src/data/puzzles.json', import.meta.url), `${JSON.stringify({ version: 1, ...bank }, null, 1)}\n`);
console.log('Done:', LEVELS.map((level) => `${level}=${String(bank[level].length)}`).join(' '));
```

- [ ] **Passo 2: gerar o banco**

Rodar `npm run puzzles`. Se o Expert não chegar ao mínimo no tempo-limite, aumentar `TIME_LIMIT_MS` e rodar de novo; registrar no relatório quantos puzzles de cada nível saíram e quanto tempo levou.

- [ ] **Passo 3: `tests/unit/bank.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { bankSize, pickPuzzle } from '../../src/game/bank';
import { LEVELS, grade } from '../../src/game/grade';
import { countSolutions } from '../../src/game/solver';

describe('bank', () => {
  for (const level of LEVELS) {
    it(`todo puzzle ${level} tem solução única e está no nível ${level}`, () => {
      expect(bankSize(level)).toBeGreaterThanOrEqual(30);
      for (let index = 0; index < bankSize(level); index++) {
        const puzzle = pickPuzzle(level, index);
        expect(countSolutions(puzzle)).toBe(1);
        expect(grade(puzzle)).toBe(level);
      }
    });
  }

  it('a semente escolhe o puzzle de forma estável', () => {
    expect(pickPuzzle('hard', 5)).toEqual(pickPuzzle('hard', 5 + bankSize('hard')));
  });
});
```

- [ ] **Passo 4: `src/game/bank.ts`**

```ts
import data from '../data/puzzles.json';
import type { Level } from './grade';
import { parse } from './grid';

const puzzles: Record<Level, readonly string[]> = data;

export const bankSize = (level: Level): number => puzzles[level].length;

/** Puzzle do banco escolhido pela semente. */
export function pickPuzzle(level: Level, seed: number): number[] {
  const list = puzzles[level];
  return parse(list[Math.abs(Math.trunc(seed)) % list.length]!);
}
```

Se o TypeScript reclamar do tipo do JSON (por causa da chave `version`), tipar com `const puzzles = data as Record<Level, readonly string[]> & { version: number };`.

- [ ] **Passo 5: rodar, conferir e commitar**

```bash
git add scripts src/data src/game/bank.ts tests/unit/bank.test.ts
git commit -m "feat: banco de puzzles gerado pelo próprio motor, com teste de cada puzzle

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 7: estado e ações do jogo

**Arquivos:** `src/game/game.ts`, `src/game/index.ts`; testes `tests/unit/game.test.ts`, `tests/unit/properties.test.ts`.

- [ ] **Passo 1: `tests/unit/game.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { bit } from '../../src/game/candidates';
import { apply, newGame, type GameState } from '../../src/game/game';
import { CLASSIC, CLASSIC_SOLUTION } from './fixtures';

const start = () => newGame('easy', CLASSIC);
const run = (state: GameState, ...actions: Parameters<typeof apply>[1][]) =>
  actions.reduce((current, action) => apply(current, action).state, state);
const emptyCells = CLASSIC.flatMap((value, cell) => (value === 0 ? [cell] : []));

describe('newGame', () => {
  it('começa com os números do puzzle, sem anotações, painéis ou dicas', () => {
    const state = start();
    expect(state.values).toEqual(CLASSIC);
    expect(state.solution).toEqual(CLASSIC_SOLUTION);
    expect(state.glazed.every((g) => !g)).toBe(true);
    expect(state).toMatchObject({ hints: 0, won: false, past: [], future: [] });
  });
});

describe('place e erase', () => {
  it('número do puzzle não muda e a ação é bloqueada', () => {
    const state = start();
    const result = apply(state, { type: 'place', cell: 0, digit: 9 });
    expect(result.state).toBe(state);
    expect(result.events).toEqual([{ type: 'blocked', cell: 0, reason: 'given' }]);
  });

  it('coloca um número e guarda o histórico', () => {
    const result = apply(start(), { type: 'place', cell: 2, digit: 4 });
    expect(result.state.values[2]).toBe(4);
    expect(result.state.past).toHaveLength(1);
    expect(result.events[0]).toEqual({ type: 'placed', cell: 2, digit: 4 });
  });

  it('conflito gera evento com as casas envolvidas', () => {
    const result = apply(start(), { type: 'place', cell: 2, digit: 5 });
    expect(result.events).toContainEqual({ type: 'conflict', cells: [0, 2] });
  });

  it('colocar tira o número das anotações dos vizinhos', () => {
    const noted = run(start(), { type: 'toggleNote', cell: 3, digit: 4 }, { type: 'place', cell: 2, digit: 4 });
    expect(noted.notes[3]! & bit(4)).toBe(0);
  });

  it('apagar tira o número; apagar casa vazia sem anotações não faz nada', () => {
    const placed = run(start(), { type: 'place', cell: 2, digit: 4 });
    expect(apply(placed, { type: 'erase', cell: 2 }).state.values[2]).toBe(0);
    const empty = start();
    expect(apply(empty, { type: 'erase', cell: 2 }).state).toBe(empty);
  });

  it('repetir o mesmo número não faz nada', () => {
    const placed = run(start(), { type: 'place', cell: 2, digit: 4 });
    expect(apply(placed, { type: 'place', cell: 2, digit: 4 }).state).toBe(placed);
  });
});

describe('anotações', () => {
  it('liga e desliga um candidato numa casa vazia', () => {
    const on = run(start(), { type: 'toggleNote', cell: 2, digit: 1 });
    expect(on.notes[2]).toBe(bit(1));
    expect(run(on, { type: 'toggleNote', cell: 2, digit: 1 }).notes[2]).toBe(0);
  });

  it('não anota em casa preenchida', () => {
    const state = start();
    expect(apply(state, { type: 'toggleNote', cell: 0, digit: 1 }).state).toBe(state);
  });
});

describe('vitrificação e vitória', () => {
  it('bloco completo e certo é vitrificado e trancado', () => {
    const glazed = run(
      start(),
      { type: 'place', cell: 2, digit: 4 },
      { type: 'place', cell: 10, digit: 7 },
      { type: 'place', cell: 11, digit: 2 },
    );
    const result = apply(glazed, { type: 'place', cell: 18, digit: 1 });
    expect(result.events).toContainEqual({ type: 'glazed', box: 0 });
    expect(result.state.glazed[0]).toBe(true);
    expect(apply(result.state, { type: 'erase', cell: 2 }).events).toEqual([
      { type: 'blocked', cell: 2, reason: 'glazed' },
    ]);
  });

  it('bloco completo mas errado não é vitrificado', () => {
    const wrong = run(
      start(),
      { type: 'place', cell: 2, digit: 7 },
      { type: 'place', cell: 10, digit: 4 },
      { type: 'place', cell: 11, digit: 2 },
      { type: 'place', cell: 18, digit: 1 },
    );
    expect(wrong.glazed[0]).toBe(false);
  });

  it('preencher tudo certo vence, e depois disso nada muda', () => {
    const won = emptyCells.reduce(
      (state, cell) => apply(state, { type: 'place', cell, digit: CLASSIC_SOLUTION[cell]! }).state,
      start(),
    );
    expect(won.won).toBe(true);
    expect(won.glazed.every(Boolean)).toBe(true);
    expect(apply(won, { type: 'undo' }).state).toBe(won);
  });
});

describe('dica', () => {
  it('sem casa, revela a primeira casa diferente da solução', () => {
    const result = apply(start(), { type: 'hint', cell: null });
    expect(result.state.values[2]).toBe(4);
    expect(result.state.hints).toBe(1);
    expect(result.events).toContainEqual({ type: 'hinted', cell: 2, digit: 4 });
  });

  it('com casa errada selecionada, corrige essa casa', () => {
    const wrong = run(start(), { type: 'place', cell: 10, digit: 1 });
    expect(apply(wrong, { type: 'hint', cell: 10 }).state.values[10]).toBe(7);
  });
});

describe('desfazer e refazer', () => {
  it('desfaz e refaz uma jogada', () => {
    const placed = run(start(), { type: 'place', cell: 2, digit: 4 });
    const undone = apply(placed, { type: 'undo' }).state;
    expect(undone.values[2]).toBe(0);
    expect(undone.future).toHaveLength(1);
    expect(apply(undone, { type: 'redo' }).state.values[2]).toBe(4);
  });

  it('sem histórico, não faz nada', () => {
    const state = start();
    expect(apply(state, { type: 'undo' }).state).toBe(state);
    expect(apply(state, { type: 'redo' }).state).toBe(state);
  });

  it('uma jogada nova apaga o refazer', () => {
    const undone = run(start(), { type: 'place', cell: 2, digit: 4 }, { type: 'undo' });
    expect(run(undone, { type: 'place', cell: 2, digit: 1 }).future).toHaveLength(0);
  });
});
```

Rodar → FAIL.

- [ ] **Passo 2: `src/game/game.ts`**

```ts
import { bit } from './candidates';
import type { Level } from './grade';
import { BOXES, PEERS, UNITS, boxOf, type Values } from './grid';
import { solve } from './solver';

/** A parte do estado que desfazer e refazer guardam. */
export interface Snapshot {
  readonly values: Values;
  /** Máscara de anotações de cada casa. */
  readonly notes: readonly number[];
  readonly glazed: readonly boolean[];
  readonly hints: number;
}

export interface GameState extends Snapshot {
  readonly level: Level;
  readonly puzzle: Values;
  readonly solution: Values;
  readonly past: readonly Snapshot[];
  readonly future: readonly Snapshot[];
  readonly won: boolean;
}

export type Action =
  | { readonly type: 'place'; readonly cell: number; readonly digit: number }
  | { readonly type: 'erase'; readonly cell: number }
  | { readonly type: 'toggleNote'; readonly cell: number; readonly digit: number }
  | { readonly type: 'hint'; readonly cell: number | null }
  | { readonly type: 'undo' }
  | { readonly type: 'redo' };

export type GameEvent =
  | { readonly type: 'placed'; readonly cell: number; readonly digit: number }
  | { readonly type: 'erased'; readonly cell: number }
  | { readonly type: 'noted'; readonly cell: number }
  | { readonly type: 'blocked'; readonly cell: number; readonly reason: 'given' | 'glazed' }
  | { readonly type: 'conflict'; readonly cells: readonly number[] }
  | { readonly type: 'glazed'; readonly box: number }
  | { readonly type: 'hinted'; readonly cell: number; readonly digit: number }
  | { readonly type: 'undone' }
  | { readonly type: 'redone' }
  | { readonly type: 'won' };

export interface Result {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
}

const unchanged = (state: GameState): Result => ({ state, events: [] });

export function newGame(level: Level, puzzle: Values): GameState {
  const solution = solve(puzzle);
  if (!solution) throw new Error('This puzzle has no solution.');
  return {
    level,
    puzzle: [...puzzle],
    solution,
    values: [...puzzle],
    notes: Array<number>(81).fill(0),
    glazed: BOXES.map((box) => box.every((cell) => puzzle[cell] === solution[cell])),
    hints: 0,
    past: [],
    future: [],
    won: false,
  };
}

const snapshotOf = ({ values, notes, glazed, hints }: Snapshot): Snapshot => ({ values, notes, glazed, hints });

function blockedReason(state: GameState, cell: number): 'given' | 'glazed' | null {
  if (state.puzzle[cell] !== 0) return 'given';
  if (state.glazed[boxOf(cell)]) return 'glazed';
  return null;
}

/** Casas que têm o mesmo número que `cell` em alguma unidade dela (incluindo `cell`), ou vazio. */
function conflictsAt(values: Values, cell: number): number[] {
  const digit = values[cell]!;
  const found = new Set<number>();
  for (const unit of UNITS) {
    if (!unit.includes(cell)) continue;
    for (const other of unit) if (other !== cell && values[other] === digit) found.add(other);
  }
  if (found.size === 0) return [];
  return [...found, cell].sort((a, b) => a - b);
}

/** Registra a jogada no histórico, aplica as mudanças e confere vitrificação e vitória. */
function commit(state: GameState, next: Snapshot, events: GameEvent[], touched: number | null): Result {
  let glazed = next.glazed;
  if (touched !== null) {
    const box = boxOf(touched);
    if (!glazed[box] && BOXES[box]!.every((cell) => next.values[cell] === state.solution[cell])) {
      glazed = glazed.map((value, index) => (index === box ? true : value));
      events.push({ type: 'glazed', box });
    }
  }
  const won = next.values.every((value, cell) => value === state.solution[cell]);
  if (won) events.push({ type: 'won' });
  return {
    state: { ...state, ...next, glazed, won, past: [...state.past, snapshotOf(state)], future: [] },
    events,
  };
}

function placeDigit(state: GameState, cell: number, digit: number, extra: GameEvent[] = []): Result {
  const values = state.values.map((value, index) => (index === cell ? digit : value));
  const peers = new Set(PEERS[cell]);
  const notes = state.notes.map((mask, index) => (index === cell ? 0 : peers.has(index) ? mask & ~bit(digit) : mask));
  const events: GameEvent[] = [...extra, { type: 'placed', cell, digit }];
  const conflicting = conflictsAt(values, cell);
  if (conflicting.length > 0) events.push({ type: 'conflict', cells: conflicting });
  return commit(state, { ...snapshotOf(state), values, notes }, events, cell);
}

function hintTarget(state: GameState, cell: number | null): number | null {
  if (cell !== null && blockedReason(state, cell) === null && state.values[cell] !== state.solution[cell]) return cell;
  const index = state.values.findIndex((value, i) => value !== state.solution[i] && blockedReason(state, i) === null);
  return index === -1 ? null : index;
}

/** Aplica uma ação. Devolve o novo estado e os eventos; uma ação sem efeito devolve o mesmo estado. */
export function apply(state: GameState, action: Action): Result {
  if (state.won) return unchanged(state);

  switch (action.type) {
    case 'place': {
      const reason = blockedReason(state, action.cell);
      if (reason) return { state, events: [{ type: 'blocked', cell: action.cell, reason }] };
      if (state.values[action.cell] === action.digit) return unchanged(state);
      return placeDigit(state, action.cell, action.digit);
    }
    case 'erase': {
      const reason = blockedReason(state, action.cell);
      if (reason) return { state, events: [{ type: 'blocked', cell: action.cell, reason }] };
      if (state.values[action.cell] !== 0) {
        const values = state.values.map((value, index) => (index === action.cell ? 0 : value));
        return commit(state, { ...snapshotOf(state), values }, [{ type: 'erased', cell: action.cell }], null);
      }
      if (state.notes[action.cell] !== 0) {
        const notes = state.notes.map((mask, index) => (index === action.cell ? 0 : mask));
        return commit(state, { ...snapshotOf(state), notes }, [{ type: 'erased', cell: action.cell }], null);
      }
      return unchanged(state);
    }
    case 'toggleNote': {
      const reason = blockedReason(state, action.cell);
      if (reason) return { state, events: [{ type: 'blocked', cell: action.cell, reason }] };
      if (state.values[action.cell] !== 0) return unchanged(state);
      const notes = state.notes.map((mask, index) => (index === action.cell ? mask ^ bit(action.digit) : mask));
      return commit(state, { ...snapshotOf(state), notes }, [{ type: 'noted', cell: action.cell }], null);
    }
    case 'hint': {
      const cell = hintTarget(state, action.cell);
      if (cell === null) return unchanged(state);
      const digit = state.solution[cell]!;
      const result = placeDigit(state, cell, digit, [{ type: 'hinted', cell, digit }]);
      return { ...result, state: { ...result.state, hints: state.hints + 1 } };
    }
    case 'undo': {
      const previous = state.past.at(-1);
      if (!previous) return unchanged(state);
      return {
        state: { ...state, ...previous, past: state.past.slice(0, -1), future: [...state.future, snapshotOf(state)] },
        events: [{ type: 'undone' }],
      };
    }
    case 'redo': {
      const next = state.future.at(-1);
      if (!next) return unchanged(state);
      return {
        state: { ...state, ...next, past: [...state.past, snapshotOf(state)], future: state.future.slice(0, -1) },
        events: [{ type: 'redone' }],
      };
    }
  }
}
```

Na dica, `hints` sobe **depois** de `placeDigit`, que já empilhou o snapshot anterior (com o contador antigo). Desfazer devolve o contador antigo; desfazer empilha no `future` o estado atual (com o contador novo), então refazer o devolve. O teste de propriedade confere isso.

- [ ] **Passo 3: `tests/unit/properties.test.ts`**

```ts
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { BOXES } from '../../src/game/grid';
import { apply, newGame, type Action, type GameState } from '../../src/game/game';
import { CLASSIC } from './fixtures';

const cell = fc.integer({ min: 0, max: 80 });
const digit = fc.integer({ min: 1, max: 9 });
const action: fc.Arbitrary<Action> = fc.oneof(
  fc.record({ type: fc.constant('place' as const), cell, digit }),
  fc.record({ type: fc.constant('erase' as const), cell }),
  fc.record({ type: fc.constant('toggleNote' as const), cell, digit }),
  fc.record({ type: fc.constant('hint' as const), cell: fc.option(cell, { nil: null }) }),
  fc.constant({ type: 'undo' } as const),
  fc.constant({ type: 'redo' } as const),
);
const actions = fc.array(action, { minLength: 20, maxLength: 150 });

const play = (list: readonly Action[]): GameState[] => {
  const states = [newGame('easy', CLASSIC)];
  for (const a of list) states.push(apply(states.at(-1)!, a).state);
  return states;
};

describe('propriedades do jogo', () => {
  it('os números do puzzle nunca mudam', () => {
    fc.assert(
      fc.property(actions, (list) => {
        for (const state of play(list)) {
          CLASSIC.forEach((value, index) => {
            if (value !== 0) expect(state.values[index]).toBe(value);
          });
        }
      }),
      { numRuns: 200 },
    );
  });

  it('um painel só fica vitrificado quando é igual à solução', () => {
    fc.assert(
      fc.property(actions, (list) => {
        for (const state of play(list)) {
          BOXES.forEach((box, index) => {
            if (state.glazed[index]) for (const c of box) expect(state.values[c]).toBe(state.solution[c]);
          });
        }
      }),
      { numRuns: 200 },
    );
  });

  it('desfazer tudo volta ao começo; refazer tudo volta ao fim', () => {
    fc.assert(
      fc.property(actions, (list) => {
        const states = play(list);
        const last = states.at(-1)!;
        if (last.won) return;
        let current = last;
        while (current.past.length > 0) current = apply(current, { type: 'undo' }).state;
        expect(current.values).toEqual(states[0]!.values);
        expect(current.notes).toEqual(states[0]!.notes);
        expect(current.hints).toBe(0);
        while (current.future.length > 0) current = apply(current, { type: 'redo' }).state;
        expect(current.values).toEqual(last.values);
        expect(current.notes).toEqual(last.notes);
        expect(current.glazed).toEqual(last.glazed);
        expect(current.hints).toBe(last.hints);
      }),
      { numRuns: 200 },
    );
  });

  it('vence exatamente quando o tabuleiro é igual à solução', () => {
    fc.assert(
      fc.property(actions, (list) => {
        for (const state of play(list)) {
          expect(state.won).toBe(state.values.every((value, index) => value === state.solution[index]));
        }
      }),
      { numRuns: 200 },
    );
  });
});
```

- [ ] **Passo 4: `src/game/index.ts`**

```ts
export { BOXES, cellAt, colOf, format, parse, rowOf, boxOf } from './grid';
export { conflicts } from './validate';
export { LEVELS, type Level } from './grade';
export { bankSize, pickPuzzle } from './bank';
export { apply, newGame, type Action, type GameEvent, type GameState, type Result } from './game';
export { deserialize, serialize, type Saved } from './serialize';
export { digits } from './candidates';
```

Até a Tarefa 8, deixar a linha de `serialize` comentada.

- [ ] **Passo 5: rodar, conferir e commitar**

```bash
git add src/game tests/unit
git commit -m "feat: estado do jogo, ações, vitrificação, dica, desfazer e refazer

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 8: salvar e restaurar

**Arquivos:** `src/game/serialize.ts`; teste `tests/unit/serialize.test.ts`.

- [ ] **Passo 1: teste**

```ts
import { describe, expect, it } from 'vitest';
import { apply, newGame } from '../../src/game/game';
import { deserialize, serialize } from '../../src/game/serialize';
import { CLASSIC } from './fixtures';

const played = () => {
  let state = newGame('hard', CLASSIC);
  state = apply(state, { type: 'place', cell: 2, digit: 4 }).state;
  state = apply(state, { type: 'toggleNote', cell: 3, digit: 6 }).state;
  state = apply(state, { type: 'hint', cell: null }).state;
  return state;
};

describe('serialize', () => {
  it('salvar e restaurar mantém o tabuleiro, as anotações, os painéis, as dicas e o tempo', () => {
    const state = played();
    const restored = deserialize(serialize(state, 61_000))!;
    expect(restored.elapsedMs).toBe(61_000);
    expect(restored.state).toMatchObject({
      level: 'hard',
      values: state.values,
      notes: state.notes,
      glazed: state.glazed,
      hints: state.hints,
      past: [],
      future: [],
    });
  });

  it.each([
    ['texto que não é JSON', 'not json'],
    ['versão diferente', JSON.stringify({ version: 99 })],
    ['objeto incompleto', JSON.stringify({ version: 1, level: 'easy' })],
  ])('recusa %s', (_, text) => {
    expect(deserialize(text)).toBeNull();
  });

  it('recusa uma partida em que um número do puzzle foi alterado', () => {
    const saved = JSON.parse(serialize(played(), 0)) as { values: string };
    saved.values = `9${saved.values.slice(1)}`;
    expect(deserialize(JSON.stringify(saved))).toBeNull();
  });
});
```

- [ ] **Passo 2: `src/game/serialize.ts`**

```ts
import { newGame, type GameState } from './game';
import { LEVELS, type Level } from './grade';
import { BOXES, format, parse } from './grid';

const VERSION = 1;

export interface Saved {
  readonly state: GameState;
  readonly elapsedMs: number;
}

interface Stored {
  version: number;
  level: Level;
  puzzle: string;
  values: string;
  notes: number[];
  hints: number;
  elapsedMs: number;
}

export function serialize(state: GameState, elapsedMs: number): string {
  const stored: Stored = {
    version: VERSION,
    level: state.level,
    puzzle: format(state.puzzle),
    values: format(state.values),
    notes: [...state.notes],
    hints: state.hints,
    elapsedMs: Math.max(0, Math.round(elapsedMs)),
  };
  return JSON.stringify(stored);
}

const isStored = (value: unknown): value is Stored => {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.version === VERSION &&
    typeof v.level === 'string' &&
    (LEVELS as readonly string[]).includes(v.level) &&
    typeof v.puzzle === 'string' &&
    typeof v.values === 'string' &&
    Array.isArray(v.notes) &&
    v.notes.length === 81 &&
    v.notes.every((mask) => Number.isInteger(mask) && mask >= 0 && mask <= 0x1ff) &&
    Number.isInteger(v.hints) &&
    typeof v.elapsedMs === 'number'
  );
};

/** Restaura uma partida salva. Qualquer coisa inválida ou de outra versão devolve null. */
export function deserialize(text: string): Saved | null {
  try {
    const raw: unknown = JSON.parse(text);
    if (!isStored(raw)) return null;
    const puzzle = parse(raw.puzzle);
    const values = parse(raw.values);
    if (puzzle.some((value, cell) => value !== 0 && values[cell] !== value)) return null;
    const fresh = newGame(raw.level, puzzle);
    const glazed = BOXES.map((box) => box.every((cell) => values[cell] === fresh.solution[cell]));
    const won = values.every((value, cell) => value === fresh.solution[cell]);
    return { state: { ...fresh, values, notes: raw.notes, hints: raw.hints, glazed, won }, elapsedMs: raw.elapsedMs };
  } catch {
    return null;
  }
}
```

- [ ] **Passo 3: rodar, conferir e commitar**

Descomentar a exportação de `serialize` em `src/game/index.ts`.

```bash
git add src/game tests/unit/serialize.test.ts
git commit -m "feat: salvar e restaurar a partida com validação

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 9: textos e estilos

**Arquivos:** `src/ui/content/copy.ts`, `src/ui/styles/tokens.css`, `src/ui/styles/app.css`; teste `tests/unit/copy.test.ts`.

- [ ] **Passo 1: teste**

```ts
import { describe, expect, it } from 'vitest';
import { announcementFor, copy, formatTime } from '../../src/ui/content/copy';

describe('copy', () => {
  it('formatTime', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(61_500)).toBe('01:01');
    expect(formatTime(3_600_000)).toBe('60:00');
  });

  it('nome acessível das casas', () => {
    expect(copy.cellLabel({ cell: 15, value: 5, given: true, notes: [], conflict: false, glazed: false })).toBe(
      'Row 2, column 7, 5, given',
    );
    expect(copy.cellLabel({ cell: 15, value: 0, given: false, notes: [], conflict: false, glazed: false })).toBe(
      'Row 2, column 7, empty',
    );
    expect(copy.cellLabel({ cell: 15, value: 0, given: false, notes: [1, 4, 9], conflict: false, glazed: false })).toBe(
      'Row 2, column 7, notes 1, 4, 9',
    );
    expect(copy.cellLabel({ cell: 15, value: 3, given: false, notes: [], conflict: true, glazed: false })).toBe(
      'Row 2, column 7, 3, conflict',
    );
    expect(copy.cellLabel({ cell: 15, value: 3, given: false, notes: [], conflict: false, glazed: true })).toBe(
      'Row 2, column 7, 3, glazed',
    );
  });

  it('anúncios', () => {
    expect(announcementFor([{ type: 'glazed', box: 3 }])).toBe('Panel 4 glazed.');
    expect(announcementFor([{ type: 'placed', cell: 2, digit: 5 }, { type: 'conflict', cells: [0, 2] }])).toBe('Conflict.');
    expect(announcementFor([{ type: 'blocked', cell: 0, reason: 'given' }])).toBe('This number is part of the puzzle.');
    expect(announcementFor([{ type: 'blocked', cell: 0, reason: 'glazed' }])).toBe('This panel is glazed.');
    expect(announcementFor([{ type: 'hinted', cell: 13, digit: 7 }, { type: 'placed', cell: 13, digit: 7 }])).toBe(
      'Hint: row 2, column 5 is 7.',
    );
    expect(announcementFor([{ type: 'won' }])).toBe('The mural is complete.');
    expect(announcementFor([{ type: 'placed', cell: 2, digit: 4 }])).toBe('');
  });
});
```

- [ ] **Passo 2: `src/ui/content/copy.ts`**

```ts
import { colOf, rowOf, type GameEvent, type Level } from '../../game';

export function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

const position = (cell: number) => `Row ${String(rowOf(cell) + 1)}, column ${String(colOf(cell) + 1)}`;

export interface CellDescription {
  cell: number;
  value: number;
  given: boolean;
  notes: readonly number[];
  conflict: boolean;
  glazed: boolean;
}

export const copy = {
  title: 'Azulejo',
  subtitle: 'Sudoku, glazed one panel at a time.',
  chooseLevel: 'Choose a level',
  levels: { easy: 'Easy', medium: 'Medium', hard: 'Hard', expert: 'Expert' } satisfies Record<Level, string>,
  continue: 'Continue',
  continueDetail: (level: Level, ms: number) => `${copy.levels[level]} · ${formatTime(ms)}`,
  replaceWarning: 'Starting a new game replaces the one in progress.',
  time: 'Time',
  undo: 'Undo',
  redo: 'Redo',
  erase: 'Erase',
  notes: 'Notes',
  notesOn: 'Notes on',
  notesOff: 'Notes off',
  hint: 'Hint',
  pause: 'Pause',
  paused: 'Paused',
  resume: 'Resume',
  boardLabel: 'Sudoku board',
  placeLabel: (digit: number, left: number) => `Place ${String(digit)}, ${String(left)} left`,
  cellLabel: ({ cell, value, given, notes, conflict, glazed }: CellDescription) => {
    const content =
      value !== 0
        ? `${String(value)}${given ? ', given' : ''}`
        : notes.length > 0
          ? `notes ${notes.join(', ')}`
          : 'empty';
    return `${position(cell)}, ${content}${conflict ? ', conflict' : ''}${glazed ? ', glazed' : ''}`;
  },
  glazedPanel: (box: number) => `Panel ${String(box + 1)} glazed.`,
  conflict: 'Conflict.',
  givenBlocked: 'This number is part of the puzzle.',
  glazedBlocked: 'This panel is glazed.',
  hinted: (cell: number, digit: number) =>
    `Hint: row ${String(rowOf(cell) + 1)}, column ${String(colOf(cell) + 1)} is ${String(digit)}.`,
  won: 'The mural is complete.',
  level: 'Level',
  hints: 'Hints',
  bestTime: 'Best time',
  newBestTime: 'New best time',
  playAgain: 'Play again',
  changeLevel: 'Change level',
} as const;

/** O que a região aria-live anuncia depois de uma ação. A vitória tem prioridade, depois o resto em ordem. */
export function announcementFor(events: readonly GameEvent[]): string {
  if (events.some((event) => event.type === 'won')) return copy.won;
  const parts: string[] = [];
  for (const event of events) {
    if (event.type === 'hinted') parts.push(copy.hinted(event.cell, event.digit));
    if (event.type === 'conflict') parts.push(copy.conflict);
    if (event.type === 'glazed') parts.push(copy.glazedPanel(event.box));
    if (event.type === 'blocked') parts.push(event.reason === 'given' ? copy.givenBlocked : copy.glazedBlocked);
  }
  return parts.join(' ');
}
```

- [ ] **Passo 3: `src/ui/styles/tokens.css`**

```css
:root {
  /* A parede de azulejos. Contraste a conferir na Tarefa 12: cobalto sobre glaze e branco sobre cobalto ≥ 4,5:1. */
  --wall: #eef0ea;
  --glaze: #f5f8fc;
  --grout: #b9c0c9;
  --cobalt: #1f3f8f;
  --cobalt-deep: #0f2557;
  --cobalt-soft: #5b7fd1;
  --veil: #dfe8f7;
  --same: #c7d6f2;
  --ochre: #f3d9a4;
  --ochre-deep: #7a4d00;
  --white: #ffffff;

  --font-digit: 'Young Serif', Georgia, serif;
  --font-ui: 'Atkinson Hyperlegible', system-ui, sans-serif;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --radius: 0.4rem;

  color-scheme: light;
}
```

- [ ] **Passo 4: `src/ui/styles/app.css`**

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: var(--wall);
  color: var(--cobalt-deep);
  font-family: var(--font-ui);
}

button {
  font: inherit;
  color: inherit;
}

:focus-visible {
  outline: 3px solid var(--cobalt);
  outline-offset: 2px;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

.app {
  min-height: 100dvh;
  width: min(100% - 2rem, 60rem);
  margin: 0 auto;
  padding-block: var(--space-4);
}

/* Início */
.home {
  display: grid;
  gap: var(--space-6);
  justify-items: center;
  padding-block: 10vh;
  text-align: center;
}

.home h1 {
  margin: 0;
  font-family: var(--font-digit);
  font-weight: 400;
  font-size: clamp(2.5rem, 9vw, 4rem);
  color: var(--cobalt);
}

.home p {
  margin: 0;
}

.levels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 8rem));
  gap: var(--space-3);
}

@media (min-width: 640px) {
  .levels {
    grid-template-columns: repeat(4, minmax(0, 8rem));
  }
}

.level-tile,
.continue {
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  padding: var(--space-3);
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--cobalt);
  background: var(--glaze);
  border: 2px solid var(--cobalt);
  border-radius: var(--radius);
  cursor: pointer;
}

.continue {
  aspect-ratio: auto;
  gap: var(--space-1);
  color: var(--white);
  background: var(--cobalt);
}

/* Jogo */
.game {
  display: grid;
  gap: var(--space-4);
}

@media (min-width: 900px) {
  .game {
    grid-template-columns: minmax(0, 1fr) 18rem;
    grid-template-areas:
      'board header'
      'board panel';
    align-items: start;
  }

  .game-header {
    grid-area: header;
  }

  .board-wrap {
    grid-area: board;
  }

  .panel {
    grid-area: panel;
  }
}

.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.game-header .time {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}

.board-wrap {
  position: relative;
  width: min(100%, calc(100dvh - 15rem), 40rem);
  justify-self: center;
}

.board {
  position: relative;
  display: grid;
  grid-template-rows: repeat(9, minmax(0, 1fr));
  aspect-ratio: 1;
  padding: 4px;
  background: var(--grout);
  border-radius: var(--radius);
}

.board__row {
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
}

.board__mural {
  position: absolute;
  inset: 4px;
  width: calc(100% - 8px);
  height: calc(100% - 8px);
  pointer-events: none;
}

.cell {
  position: relative;
  display: grid;
  place-items: center;
  margin: 1px;
  font-family: var(--font-digit);
  font-size: clamp(1rem, 4.6vw, 1.9rem);
  line-height: 1;
  color: var(--cobalt-deep);
  background: var(--glaze);
  cursor: pointer;
  user-select: none;
}

.board__row:nth-child(3n + 1) .cell {
  margin-top: 3px;
}

.board__row .cell:nth-child(3n + 1) {
  margin-left: 3px;
}

.cell--given {
  color: var(--cobalt);
}

.cell--peer {
  background: var(--veil);
}

.cell--same {
  background: var(--same);
}

.cell--selected {
  box-shadow: inset 0 0 0 3px var(--cobalt);
}

.cell--conflict {
  background: var(--ochre);
  color: var(--ochre-deep);
  text-decoration: underline dashed var(--ochre-deep) 2px;
  text-underline-offset: 4px;
}

.cell--glazed {
  color: var(--white);
  background: transparent;
}

.cell__value--player {
  font-style: italic;
}

.notes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: 100%;
  height: 100%;
  padding: 2px;
  font-family: var(--font-ui);
  font-size: clamp(0.5rem, 1.6vw, 0.75rem);
  color: var(--cobalt);
}

.notes span {
  display: grid;
  place-items: center;
}

.panel {
  display: grid;
  gap: var(--space-3);
  align-content: start;
}

.toolbar {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--space-2);
}

.tool {
  padding: var(--space-2);
  font-size: 0.875rem;
  background: var(--glaze);
  border: 1px solid var(--grout);
  border-radius: var(--radius);
  cursor: pointer;
}

.tool[aria-pressed='true'] {
  color: var(--white);
  background: var(--cobalt);
  border-color: var(--cobalt);
}

.number-pad {
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  gap: var(--space-1);
}

@media (min-width: 900px) {
  .number-pad {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.number-key {
  display: grid;
  gap: 2px;
  justify-items: center;
  padding: var(--space-2) 0;
  font-family: var(--font-digit);
  font-size: 1.375rem;
  color: var(--cobalt);
  background: var(--glaze);
  border: 1px solid var(--grout);
  border-radius: var(--radius);
  cursor: pointer;
}

.number-key small {
  font-family: var(--font-ui);
  font-size: 0.6875rem;
  color: var(--cobalt-deep);
}

.number-key:disabled {
  opacity: 0.45;
  cursor: default;
}

.pause-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  gap: var(--space-3);
  background: var(--cobalt);
  color: var(--white);
  border-radius: var(--radius);
}

.pause-overlay button {
  padding: var(--space-2) var(--space-4);
  color: var(--cobalt);
  background: var(--white);
  border: 0;
  border-radius: var(--radius);
  cursor: pointer;
}

.win {
  width: min(100% - 2rem, 26rem);
  padding: var(--space-6);
  color: var(--cobalt-deep);
  background: var(--glaze);
  border: 3px solid var(--cobalt);
  border-radius: var(--radius);
}

.win::backdrop {
  background: rgb(15 37 87 / 0.55);
}

.win h2 {
  margin: 0 0 var(--space-4);
  font-family: var(--font-digit);
  font-weight: 400;
}

.win dl {
  display: grid;
  grid-template-columns: auto auto;
  gap: var(--space-2) var(--space-4);
  margin: 0 0 var(--space-4);
}

.win dd {
  margin: 0;
  text-align: right;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.win .actions {
  display: flex;
  gap: var(--space-2);
}

.win .actions button {
  flex: 1;
  padding: var(--space-3);
  border: 2px solid var(--cobalt);
  border-radius: var(--radius);
  cursor: pointer;
}

.win .actions button:first-child {
  color: var(--white);
  background: var(--cobalt);
}

/* Animações */
.stamp-enter-active {
  transition:
    transform 140ms ease-out,
    opacity 140ms ease-out;
}

.stamp-enter-from {
  transform: scale(1.35);
  opacity: 0;
}

.mural__panel {
  opacity: 0;
  transition: opacity 500ms ease-out;
}

.mural__panel--glazed {
  opacity: 1;
  animation: glaze 700ms ease-out;
}

@keyframes glaze {
  from { clip-path: circle(0% at 50% 50%); filter: brightness(1.6); }
  to { clip-path: circle(75% at 50% 50%); filter: brightness(1); }
}

@media (prefers-reduced-motion: reduce) {
  .stamp-enter-active,
  .mural__panel {
    transition: opacity 120ms linear;
  }

  .stamp-enter-from {
    transform: none;
  }

  .mural__panel--glazed {
    animation: none;
  }
}
```

- [ ] **Passo 5: rodar, conferir e commitar**

```bash
git add src/ui tests/unit/copy.test.ts
git commit -m "feat: textos, anúncios e estilos da parede de azulejos

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 10: composables

**Arquivos:** `src/ui/composables/{useGame,useTimer,useKeyboard,usePersistence,useBestTimes,useAnnouncer}.ts`.

- [ ] **Passo 1: `useGame.ts`**

```ts
import { computed, ref, shallowRef } from 'vue';
import {
  apply,
  conflicts,
  newGame,
  pickPuzzle,
  type Action,
  type GameEvent,
  type GameState,
  type Level,
} from '../../game';

/** Estado da partida e ações. O motor decide tudo; aqui só guardamos o estado e os últimos eventos. */
export function useGame() {
  const state = shallowRef<GameState | null>(null);
  const events = shallowRef<readonly GameEvent[]>([]);
  /** Aumenta a cada ação, para anúncios e animações reagirem mesmo com eventos iguais. */
  const actionId = ref(0);
  const selected = ref<number | null>(null);
  const notesMode = ref(false);

  function start(level: Level, seed: number) {
    state.value = newGame(level, pickPuzzle(level, seed));
    events.value = [];
    selected.value = null;
    notesMode.value = false;
  }

  function load(saved: GameState) {
    state.value = saved;
    events.value = [];
    selected.value = null;
  }

  function dispatch(action: Action) {
    if (!state.value) return;
    const result = apply(state.value, action);
    state.value = result.state;
    events.value = result.events;
    actionId.value++;
  }

  function input(digit: number) {
    const cell = selected.value;
    if (cell === null) return;
    dispatch(notesMode.value ? { type: 'toggleNote', cell, digit } : { type: 'place', cell, digit });
  }

  const erase = () => {
    if (selected.value !== null) dispatch({ type: 'erase', cell: selected.value });
  };
  const hint = () => {
    dispatch({ type: 'hint', cell: selected.value });
  };
  const undo = () => {
    dispatch({ type: 'undo' });
  };
  const redo = () => {
    dispatch({ type: 'redo' });
  };
  const toggleNotes = () => {
    notesMode.value = !notesMode.value;
  };
  const quit = () => {
    state.value = null;
  };

  const conflicting = computed(() => (state.value ? conflicts(state.value.values) : new Set<number>()));
  const remaining = computed(() => {
    const left = Array<number>(10).fill(9);
    for (const value of state.value?.values ?? []) if (value !== 0) left[value]!--;
    return left;
  });

  return {
    state,
    events,
    actionId,
    selected,
    notesMode,
    conflicting,
    remaining,
    start,
    load,
    input,
    erase,
    hint,
    undo,
    redo,
    toggleNotes,
    quit,
  };
}
```

- [ ] **Passo 2: `useTimer.ts`**

```ts
import { onBeforeUnmount, onMounted, ref } from 'vue';

/** Cronômetro em milissegundos. Pausa com a aba oculta e quando `pause` é chamado. */
export function useTimer() {
  const elapsedMs = ref(0);
  const running = ref(false);
  let startedAt = 0;
  let base = 0;
  let interval = 0;

  const tick = () => {
    elapsedMs.value = base + (performance.now() - startedAt);
  };

  function resume() {
    if (running.value) return;
    running.value = true;
    startedAt = performance.now();
    interval = window.setInterval(tick, 250);
  }

  function pause() {
    if (!running.value) return;
    tick();
    base = elapsedMs.value;
    running.value = false;
    window.clearInterval(interval);
  }

  function reset(ms = 0) {
    pause();
    base = ms;
    elapsedMs.value = ms;
  }

  let pausedByVisibility = false;
  const onVisibility = () => {
    if (document.visibilityState === 'hidden' && running.value) {
      pausedByVisibility = true;
      pause();
    } else if (document.visibilityState === 'visible' && pausedByVisibility) {
      pausedByVisibility = false;
      resume();
    }
  };

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibility);
  });
  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.clearInterval(interval);
  });

  return { elapsedMs, running, resume, pause, reset };
}
```

- [ ] **Passo 3: `useKeyboard.ts`**

```ts
import { cellAt, colOf, rowOf } from '../../game';

export interface KeyboardActions {
  select: (cell: number) => void;
  input: (digit: number) => void;
  erase: () => void;
  toggleNotes: () => void;
  undo: () => void;
  redo: () => void;
}

const MOVES: Record<string, readonly [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

/** Teclas do tabuleiro: setas, 1–9, Delete/Backspace, N, Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z e Ctrl+Y. */
export function useKeyboard(selected: () => number | null, actions: KeyboardActions) {
  return function onKeydown(event: KeyboardEvent) {
    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) actions.redo();
      else actions.undo();
      return;
    }
    if (modifier && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      actions.redo();
      return;
    }
    const move = MOVES[event.key];
    if (move) {
      event.preventDefault();
      const cell = selected() ?? 0;
      const row = Math.min(8, Math.max(0, rowOf(cell) + move[0]));
      const col = Math.min(8, Math.max(0, colOf(cell) + move[1]));
      actions.select(cellAt(row, col));
      return;
    }
    if (/^[1-9]$/.test(event.key)) {
      event.preventDefault();
      actions.input(Number(event.key));
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      actions.erase();
      return;
    }
    if (event.key.toLowerCase() === 'n' && !modifier) {
      event.preventDefault();
      actions.toggleNotes();
    }
  };
}
```

- [ ] **Passo 4: `usePersistence.ts`**

```ts
import { deserialize, serialize, type GameState, type Saved } from '../../game';

const KEY = 'azulejo:game';

/** Partida salva no navegador. Qualquer falha de armazenamento é ignorada. */
export function usePersistence() {
  function read(): Saved | null {
    try {
      const text = window.localStorage.getItem(KEY);
      return text ? deserialize(text) : null;
    } catch {
      return null;
    }
  }

  function save(state: GameState, elapsedMs: number) {
    try {
      window.localStorage.setItem(KEY, serialize(state, elapsedMs));
    } catch {
      // Sem armazenamento: o jogo segue sem salvar.
    }
  }

  function clear() {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // Ignorado pelo mesmo motivo.
    }
  }

  return { read, save, clear };
}
```

- [ ] **Passo 5: `useBestTimes.ts`**

```ts
import { ref } from 'vue';
import type { Level } from '../../game';

const KEY = 'azulejo:best-times';

function readAll(): Partial<Record<Level, number>> {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? '{}');
    return typeof parsed === 'object' && parsed !== null ? (parsed as Partial<Record<Level, number>>) : {};
  } catch {
    return {};
  }
}

/** Melhor tempo por nível. `record` devolve true quando o tempo é um novo recorde. */
export function useBestTimes() {
  const best = ref(readAll());

  function record(level: Level, ms: number): boolean {
    const previous = best.value[level];
    if (previous !== undefined && previous <= ms) return false;
    best.value = { ...best.value, [level]: ms };
    try {
      window.localStorage.setItem(KEY, JSON.stringify(best.value));
    } catch {
      // Sem armazenamento: o recorde vale só nesta visita.
    }
    return true;
  }

  return { best, record };
}
```

- [ ] **Passo 6: `useAnnouncer.ts`**

```ts
import { ref, watch, type Ref } from 'vue';

/** Texto da região aria-live. Limpa e preenche de novo a cada ação, para repetir mensagens iguais. */
export function useAnnouncer(message: Ref<string>, id: Ref<number>) {
  const text = ref('');
  let timer = 0;
  watch([message, id], ([next]) => {
    window.clearTimeout(timer);
    text.value = '';
    if (!next) return;
    timer = window.setTimeout(() => {
      text.value = next;
    }, 50);
  });
  return text;
}
```

- [ ] **Passo 7: conferir e commitar**

`npm run typecheck` e `npm run lint` → limpos.

```bash
git add src/ui/composables
git commit -m "feat: composables da partida, cronômetro, teclado, salvamento, recordes e anúncios

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 11: componentes e App

**Arquivos:** os componentes em `src/ui/components/`; substituir `src/App.vue`.

- [ ] **Passo 1: `Mural.vue`**

```vue
<script setup lang="ts">
defineProps<{ glazed: readonly boolean[] }>();

const PANEL = 300;
const panels = Array.from({ length: 9 }, (_, index) => ({
  index,
  x: (index % 3) * PANEL,
  y: Math.floor(index / 3) * PANEL,
}));
const petals = Array.from({ length: 16 }, (_, i) => i * 22.5);
const corners = [
  [0, 0],
  [900, 0],
  [0, 900],
  [900, 900],
] as const;
</script>

<template>
  <svg class="board__mural" viewBox="0 0 900 900" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <clipPath v-for="panel in panels" :id="`mural-panel-${panel.index}`" :key="panel.index">
        <rect :x="panel.x" :y="panel.y" :width="PANEL" :height="PANEL" />
      </clipPath>
      <g id="mural-art">
        <rect width="900" height="900" fill="var(--cobalt)" />
        <g fill="none" stroke="var(--cobalt-soft)" stroke-width="10">
          <circle v-for="r in [420, 330, 240, 150]" :key="r" cx="450" cy="450" :r="r" />
          <ellipse
            v-for="angle in petals"
            :key="angle"
            cx="450"
            cy="250"
            rx="46"
            ry="150"
            :transform="`rotate(${angle} 450 450)`"
          />
          <circle v-for="[x, y] in corners" :key="`${x}-${y}`" :cx="x" :cy="y" r="180" />
          <circle v-for="[x, y] in corners" :key="`inner-${x}-${y}`" :cx="x" :cy="y" r="110" />
        </g>
        <g fill="none" stroke="var(--white)" stroke-opacity="0.35" stroke-width="3">
          <path d="M450 0 L900 450 L450 900 L0 450 Z" />
          <circle cx="450" cy="450" r="60" />
        </g>
      </g>
    </defs>
    <g
      v-for="panel in panels"
      :key="panel.index"
      class="mural__panel"
      :class="{ 'mural__panel--glazed': glazed[panel.index] }"
      :clip-path="`url(#mural-panel-${panel.index})`"
    >
      <use href="#mural-art" />
    </g>
  </svg>
</template>
```

- [ ] **Passo 2: `NotesGrid.vue`**

```vue
<script setup lang="ts">
defineProps<{ notes: readonly number[] }>();
</script>

<template>
  <span class="notes" aria-hidden="true">
    <span v-for="digit in 9" :key="digit">{{ notes.includes(digit) ? digit : '' }}</span>
  </span>
</template>
```

- [ ] **Passo 3: `Cell.vue`**

```vue
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { copy } from '../content/copy';
import NotesGrid from './NotesGrid.vue';

const props = defineProps<{
  cell: number;
  value: number;
  given: boolean;
  notes: readonly number[];
  selected: boolean;
  peer: boolean;
  same: boolean;
  conflict: boolean;
  glazed: boolean;
  shake: boolean;
  shakeKey: number;
}>();
const emit = defineEmits<{ select: [cell: number] }>();

const root = ref<HTMLElement | null>(null);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Tremor de conflito pela Web Animations API: reinicia a cada ação sem recriar a casa (que perderia o foco).
watch(
  () => props.shakeKey,
  () => {
    if (!props.shake || reducedMotion.matches) return;
    root.value?.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(0)' }],
      { duration: 260, easing: 'ease-in-out' },
    );
  },
);

const label = computed(() =>
  copy.cellLabel({
    cell: props.cell,
    value: props.value,
    given: props.given,
    notes: props.notes,
    conflict: props.conflict,
    glazed: props.glazed,
  }),
);
</script>

<template>
  <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -- o teclado é tratado no tabuleiro (role="grid") -->
  <div
    ref="root"
    role="gridcell"
    class="cell"
    :class="{
      'cell--given': given,
      'cell--selected': selected,
      'cell--peer': peer && !selected,
      'cell--same': same && !selected,
      'cell--conflict': conflict,
      'cell--glazed': glazed,
    }"
    :tabindex="selected ? 0 : -1"
    :aria-selected="selected"
    :aria-label="label"
    :data-cell="cell"
    @click="emit('select', cell)"
  >
    <Transition name="stamp">
      <span v-if="value !== 0" :key="value" :class="{ 'cell__value--player': !given }" aria-hidden="true">
        {{ value }}
      </span>
      <NotesGrid v-else-if="notes.length > 0" :notes="notes" />
    </Transition>
  </div>
</template>
```

Com movimento reduzido não há tremor; o conflito continua visível pela cor ocre e pelo sublinhado.

- [ ] **Passo 4: `Board.vue`**

```vue
<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { boxOf, colOf, digits, rowOf, type GameState } from '../../game';
import { copy } from '../content/copy';
import Cell from './Cell.vue';
import Mural from './Mural.vue';

const props = defineProps<{
  state: GameState;
  selected: number | null;
  conflicting: ReadonlySet<number>;
  shakeCells: ReadonlySet<number>;
  shakeKey: number;
}>();
const emit = defineEmits<{ select: [cell: number]; keydown: [event: KeyboardEvent] }>();

const grid = ref<HTMLElement | null>(null);
const rows = Array.from({ length: 9 }, (_, row) => Array.from({ length: 9 }, (_, col) => row * 9 + col));

const isPeer = (cell: number) => {
  const s = props.selected;
  if (s === null) return false;
  return rowOf(cell) === rowOf(s) || colOf(cell) === colOf(s) || boxOf(cell) === boxOf(s);
};

const isSame = (cell: number) => {
  const s = props.selected;
  if (s === null) return false;
  const value = props.state.values[s]!;
  return value !== 0 && cell !== s && props.state.values[cell] === value;
};

const glazedCell = (cell: number) => props.state.glazed[boxOf(cell)] === true;

// Leva o foco do teclado para a casa selecionada.
watch(
  () => props.selected,
  async (cell) => {
    if (cell === null) return;
    await nextTick();
    grid.value?.querySelector<HTMLElement>(`[data-cell="${String(cell)}"]`)?.focus();
  },
);
</script>

<template>
  <div
    ref="grid"
    class="board"
    role="grid"
    :aria-label="copy.boardLabel"
    :tabindex="selected === null ? 0 : -1"
    @keydown="emit('keydown', $event)"
    @focus="selected === null && emit('select', 0)"
  >
    <Mural :glazed="state.glazed" />
    <div v-for="(row, r) in rows" :key="r" role="row" class="board__row">
      <Cell
        v-for="index in row"
        :key="index"
        :cell="index"
        :value="state.values[index]!"
        :given="state.puzzle[index] !== 0"
        :notes="digits(state.notes[index]!)"
        :selected="selected === index"
        :peer="isPeer(index)"
        :same="isSame(index)"
        :conflict="conflicting.has(index)"
        :glazed="glazedCell(index)"
        :shake="shakeCells.has(index)"
        :shake-key="shakeKey"
        @select="emit('select', $event)"
      />
    </div>
  </div>
</template>
```


- [ ] **Passo 5: `Toolbar.vue`, `NumberPad.vue`, `GameHeader.vue`, `PauseOverlay.vue`**

`Toolbar.vue`:

```vue
<script setup lang="ts">
import { copy } from '../content/copy';

defineProps<{ notesMode: boolean; canUndo: boolean; canRedo: boolean }>();
const emit = defineEmits<{ undo: []; redo: []; erase: []; notes: []; hint: [] }>();
</script>

<template>
  <div class="toolbar">
    <button type="button" class="tool" :disabled="!canUndo" @click="emit('undo')">{{ copy.undo }}</button>
    <button type="button" class="tool" :disabled="!canRedo" @click="emit('redo')">{{ copy.redo }}</button>
    <button type="button" class="tool" @click="emit('erase')">{{ copy.erase }}</button>
    <button
      type="button"
      class="tool"
      :aria-pressed="notesMode"
      :aria-label="notesMode ? copy.notesOn : copy.notesOff"
      @click="emit('notes')"
    >
      {{ copy.notes }}
    </button>
    <button type="button" class="tool" @click="emit('hint')">{{ copy.hint }}</button>
  </div>
</template>
```

`NumberPad.vue`:

```vue
<script setup lang="ts">
import { copy } from '../content/copy';

defineProps<{ remaining: readonly number[] }>();
const emit = defineEmits<{ input: [digit: number] }>();
</script>

<template>
  <div class="number-pad">
    <button
      v-for="digit in 9"
      :key="digit"
      type="button"
      class="number-key"
      :aria-label="copy.placeLabel(digit, remaining[digit]!)"
      :disabled="remaining[digit] === 0"
      @click="emit('input', digit)"
    >
      <span aria-hidden="true">{{ digit }}</span>
      <small aria-hidden="true">{{ remaining[digit] }}</small>
    </button>
  </div>
</template>
```

`GameHeader.vue`:

```vue
<script setup lang="ts">
import type { Level } from '../../game';
import { copy, formatTime } from '../content/copy';

defineProps<{ level: Level; elapsedMs: number; paused: boolean }>();
const emit = defineEmits<{ pause: []; home: [] }>();
</script>

<template>
  <header class="game-header">
    <button type="button" class="tool" @click="emit('home')">{{ copy.changeLevel }}</button>
    <span>{{ copy.levels[level] }}</span>
    <span class="time"><span class="visually-hidden">{{ copy.time }} </span>{{ formatTime(elapsedMs) }}</span>
    <button type="button" class="tool" :disabled="paused" @click="emit('pause')">{{ copy.pause }}</button>
  </header>
</template>
```

`PauseOverlay.vue`:

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { copy } from '../content/copy';

const emit = defineEmits<{ resume: [] }>();
const button = ref<HTMLButtonElement | null>(null);
onMounted(() => {
  button.value?.focus();
});
</script>

<template>
  <div class="pause-overlay" role="dialog" aria-modal="true" :aria-label="copy.paused">
    <p>{{ copy.paused }}</p>
    <button ref="button" type="button" @click="emit('resume')">{{ copy.resume }}</button>
  </div>
</template>
```

- [ ] **Passo 6: `HomeScreen.vue` e `LevelPicker.vue`**

`LevelPicker.vue`:

```vue
<script setup lang="ts">
import { LEVELS, type Level } from '../../game';
import { copy } from '../content/copy';

const emit = defineEmits<{ choose: [level: Level] }>();
</script>

<template>
  <section aria-labelledby="choose-level">
    <h2 id="choose-level">{{ copy.chooseLevel }}</h2>
    <div class="levels">
      <button v-for="level in LEVELS" :key="level" type="button" class="level-tile" @click="emit('choose', level)">
        {{ copy.levels[level] }}
      </button>
    </div>
  </section>
</template>
```

`HomeScreen.vue`:

```vue
<script setup lang="ts">
import type { Level } from '../../game';
import { copy } from '../content/copy';
import LevelPicker from './LevelPicker.vue';

defineProps<{ saved: { level: Level; elapsedMs: number } | null }>();
const emit = defineEmits<{ choose: [level: Level]; continue: [] }>();
</script>

<template>
  <main class="home">
    <h1>{{ copy.title }}</h1>
    <p>{{ copy.subtitle }}</p>
    <template v-if="saved">
      <button type="button" class="continue" @click="emit('continue')">
        <span>{{ copy.continue }}</span>
        <small>{{ copy.continueDetail(saved.level, saved.elapsedMs) }}</small>
      </button>
      <p>{{ copy.replaceWarning }}</p>
    </template>
    <LevelPicker @choose="emit('choose', $event)" />
  </main>
</template>
```

- [ ] **Passo 7: `WinScreen.vue`**

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { Level } from '../../game';
import { copy, formatTime } from '../content/copy';

defineProps<{ level: Level; elapsedMs: number; hints: number; bestMs: number | undefined; isNewBest: boolean }>();
const emit = defineEmits<{ again: []; change: [] }>();
const dialog = ref<HTMLDialogElement | null>(null);
onMounted(() => {
  dialog.value?.showModal();
});
</script>

<template>
  <dialog ref="dialog" class="win" aria-labelledby="win-title" @cancel.prevent>
    <h2 id="win-title">{{ copy.won }}</h2>
    <p v-if="isNewBest">{{ copy.newBestTime }}</p>
    <dl>
      <dt>{{ copy.time }}</dt>
      <dd>{{ formatTime(elapsedMs) }}</dd>
      <dt>{{ copy.level }}</dt>
      <dd>{{ copy.levels[level] }}</dd>
      <dt>{{ copy.hints }}</dt>
      <dd>{{ hints }}</dd>
      <dt>{{ copy.bestTime }}</dt>
      <dd>{{ bestMs === undefined ? '—' : formatTime(bestMs) }}</dd>
    </dl>
    <div class="actions">
      <button type="button" @click="emit('again')">{{ copy.playAgain }}</button>
      <button type="button" @click="emit('change')">{{ copy.changeLevel }}</button>
    </div>
  </dialog>
</template>
```

- [ ] **Passo 8: `GameScreen.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue';
import type { GameEvent, GameState } from '../../game';
import Board from './Board.vue';
import GameHeader from './GameHeader.vue';
import NumberPad from './NumberPad.vue';
import PauseOverlay from './PauseOverlay.vue';
import Toolbar from './Toolbar.vue';

const props = defineProps<{
  state: GameState;
  events: readonly GameEvent[];
  actionId: number;
  selected: number | null;
  notesMode: boolean;
  conflicting: ReadonlySet<number>;
  remaining: readonly number[];
  elapsedMs: number;
  paused: boolean;
}>();
const emit = defineEmits<{
  select: [cell: number];
  keydown: [event: KeyboardEvent];
  input: [digit: number];
  erase: [];
  hint: [];
  undo: [];
  redo: [];
  notes: [];
  pause: [];
  resume: [];
  home: [];
}>();

const shakeCells = computed(() => {
  const conflict = props.events.find((event) => event.type === 'conflict');
  return new Set(conflict?.type === 'conflict' ? conflict.cells : []);
});
</script>

<template>
  <main class="game">
    <GameHeader :level="state.level" :elapsed-ms="elapsedMs" :paused="paused" @pause="emit('pause')" @home="emit('home')" />
    <div class="board-wrap">
      <Board
        :state="state"
        :selected="selected"
        :conflicting="conflicting"
        :shake-cells="shakeCells"
        :shake-key="actionId"
        @select="emit('select', $event)"
        @keydown="emit('keydown', $event)"
      />
      <PauseOverlay v-if="paused" @resume="emit('resume')" />
    </div>
    <div class="panel">
      <Toolbar
        :notes-mode="notesMode"
        :can-undo="state.past.length > 0"
        :can-redo="state.future.length > 0"
        @undo="emit('undo')"
        @redo="emit('redo')"
        @erase="emit('erase')"
        @notes="emit('notes')"
        @hint="emit('hint')"
      />
      <NumberPad :remaining="remaining" @input="emit('input', $event)" />
    </div>
  </main>
</template>
```

No celular, cabeçalho, tabuleiro e painel ficam empilhados; no computador, o `grid-template-areas` de `app.css` põe o cabeçalho e o painel na coluna da direita.

- [ ] **Passo 9: substituir `src/App.vue`**

```vue
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Level } from './game';
import GameScreen from './ui/components/GameScreen.vue';
import HomeScreen from './ui/components/HomeScreen.vue';
import WinScreen from './ui/components/WinScreen.vue';
import { announcementFor } from './ui/content/copy';
import { useAnnouncer } from './ui/composables/useAnnouncer';
import { useBestTimes } from './ui/composables/useBestTimes';
import { useGame } from './ui/composables/useGame';
import { useKeyboard } from './ui/composables/useKeyboard';
import { usePersistence } from './ui/composables/usePersistence';
import { useTimer } from './ui/composables/useTimer';

const game = useGame();
const timer = useTimer();
const persistence = usePersistence();
const bestTimes = useBestTimes();
const paused = ref(false);
const isNewBest = ref(false);

const saved = ref(persistence.read());
const savedSummary = computed(() =>
  saved.value && !saved.value.state.won ? { level: saved.value.state.level, elapsedMs: saved.value.elapsedMs } : null,
);

function readUrl(): { level: Level | null; seed: number } {
  const params = new URLSearchParams(window.location.search);
  const level = params.get('level');
  const seed = Number(params.get('seed'));
  return {
    level: level === 'easy' || level === 'medium' || level === 'hard' || level === 'expert' ? level : null,
    seed: Number.isInteger(seed) && seed > 0 ? seed : Math.floor(Math.random() * 1_000_000) + 1,
  };
}

function startLevel(level: Level, seed = readUrl().seed) {
  game.start(level, seed);
  timer.reset(0);
  timer.resume();
  paused.value = false;
  isNewBest.value = false;
}

function continueSaved() {
  if (!saved.value) return;
  game.load(saved.value.state);
  timer.reset(saved.value.elapsedMs);
  timer.resume();
  paused.value = false;
}

function goHome() {
  if (game.state.value && !game.state.value.won) persistence.save(game.state.value, timer.elapsedMs.value);
  saved.value = persistence.read();
  timer.pause();
  game.quit();
}

const initial = readUrl();
if (initial.level) startLevel(initial.level, initial.seed);

watch(game.state, (state) => {
  if (!state) return;
  if (state.won) {
    timer.pause();
    isNewBest.value = bestTimes.record(state.level, timer.elapsedMs.value);
    persistence.clear();
    saved.value = null;
  } else {
    persistence.save(state, timer.elapsedMs.value);
  }
});

// Guarda o tempo também ao sair da página, não só a cada jogada.
window.addEventListener('pagehide', () => {
  if (game.state.value && !game.state.value.won) persistence.save(game.state.value, timer.elapsedMs.value);
});

const onKeydown = useKeyboard(() => game.selected.value, {
  select: (cell) => {
    game.selected.value = cell;
  },
  input: game.input,
  erase: game.erase,
  toggleNotes: game.toggleNotes,
  undo: game.undo,
  redo: game.redo,
});

const message = computed(() => announcementFor(game.events.value));
const announcement = useAnnouncer(message, game.actionId);

function pause() {
  paused.value = true;
  timer.pause();
}

function resume() {
  paused.value = false;
  timer.resume();
}
</script>

<template>
  <div class="app">
    <HomeScreen
      v-if="!game.state.value"
      :saved="savedSummary"
      @choose="startLevel($event)"
      @continue="continueSaved"
    />
    <template v-else>
      <GameScreen
        :state="game.state.value"
        :events="game.events.value"
        :action-id="game.actionId.value"
        :selected="game.selected.value"
        :notes-mode="game.notesMode.value"
        :conflicting="game.conflicting.value"
        :remaining="game.remaining.value"
        :elapsed-ms="timer.elapsedMs.value"
        :paused="paused"
        @select="game.selected.value = $event"
        @keydown="onKeydown"
        @input="game.input"
        @erase="game.erase"
        @hint="game.hint"
        @undo="game.undo"
        @redo="game.redo"
        @notes="game.toggleNotes"
        @pause="pause"
        @resume="resume"
        @home="goHome"
      />
      <WinScreen
        v-if="game.state.value.won"
        :level="game.state.value.level"
        :elapsed-ms="timer.elapsedMs.value"
        :hints="game.state.value.hints"
        :best-ms="bestTimes.best.value[game.state.value.level]"
        :is-new-best="isNewBest"
        @again="startLevel(game.state.value.level, Math.floor(Math.random() * 1_000_000) + 1)"
        @change="goHome"
      />
    </template>
    <p class="visually-hidden" aria-live="polite" data-testid="announcer">{{ announcement }}</p>
  </div>
</template>
```

Atenção: `useTimer` registra `onMounted`; como `App.vue` usa o composable no `setup`, isso funciona. O cálculo de "novo recorde" acontece quando o estado vira `won`, com o tempo já pausado.

- [ ] **Passo 10: conferir e commitar**

`npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build` → limpos. Rodar `npm run dev`, jogar um Easy e conferir que números entram, conflitos aparecem, painéis vitrificam e a vitória aparece.

```bash
git add -A
git commit -m "feat: tabuleiro, casas, anotações, ferramentas, teclado numérico, pausa, mural, início e vitória

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 12: conferência visual e testes de navegador

**Arquivos:** `playwright.config.ts`, `tests/e2e/helpers.ts`, `tests/e2e/game.spec.ts`, `tests/e2e/a11y.spec.ts`.

- [ ] **Passo 1: conferência visual**

Com `npm run build` e `npm run preview`, tirar capturas (fora do repositório) em 1280×800, 1440×900 e Pixel 7: início, jogo no começo, jogo com anotações e um conflito, um painel vitrificado, a pausa e a vitória com o mural completo.

Conferir:
- **Sem rolagem:** o jogo cabe na tela nos três tamanhos.
- **Contraste:** cobalto sobre `--glaze`, cobalto escuro sobre `--veil` e `--same`, ocre escuro sobre `--ochre` e branco sobre o mural, todos ≥ 4,5:1, medidos nas capturas.
- **Mural:** fica bonito e legível sob os números.
- **Anotações:** ficam legíveis no celular.
- **Painel do computador:** fica organizado, com cabeçalho, ferramentas e teclado na coluna da direita.

Ajustar CSS e o desenho do `Mural.vue` dentro do design e registrar cada ajuste.

- [ ] **Passo 2: `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  use: { baseURL: 'http://localhost:4180', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4180 --strictPort',
    url: 'http://localhost:4180',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Passo 3: `tests/e2e/helpers.ts`**

```ts
import { expect, type Page } from '@playwright/test';
import { pickPuzzle, type Level } from '../../src/game';
import { solve } from '../../src/game/solver';

export const LEVEL: Level = 'easy';
export const SEED = 7;
export const puzzle = () => pickPuzzle(LEVEL, SEED);
export const solution = () => solve(puzzle())!;

export const cell = (page: Page, index: number) => page.locator(`[data-cell="${String(index)}"]`);
export const board = (page: Page) => page.getByRole('grid', { name: 'Sudoku board' });

export async function openGame(page: Page, level: Level = LEVEL, seed = SEED): Promise<void> {
  await page.goto(`/?level=${level}&seed=${String(seed)}`);
  await expect(board(page)).toBeVisible();
}

/** Seleciona uma casa e digita um número pelo teclado. */
export async function type(page: Page, index: number, digit: number): Promise<void> {
  await cell(page, index).click();
  await page.keyboard.press(String(digit));
}

/** Preenche as casas vazias com a solução, exceto as listadas em `skip`. */
export async function fillSolution(page: Page, skip: ReadonlySet<number> = new Set()): Promise<void> {
  const values = puzzle();
  const answer = solution();
  for (let index = 0; index < 81; index++) {
    if (values[index] !== 0 || skip.has(index)) continue;
    await type(page, index, answer[index]!);
  }
}
```

- [ ] **Passo 4: `tests/e2e/game.spec.ts`**

```ts
import { expect, test } from '@playwright/test';
import { BOXES } from '../../src/game';
import { board, cell, fillSolution, openGame, puzzle, solution, type } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('o início mostra o título e os quatro níveis', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Azulejo' })).toBeVisible();
  for (const name of ['Easy', 'Medium', 'Hard', 'Expert']) {
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  }
});

test('escolher um nível abre o tabuleiro com os números do puzzle', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Easy', exact: true }).click();
  await expect(board(page)).toBeVisible();
  await expect(page.locator('[role="gridcell"]')).toHaveCount(81);
});

test('números do puzzle não mudam e a ação é anunciada', async ({ page }) => {
  await openGame(page);
  const given = puzzle().findIndex((value) => value !== 0);
  await type(page, given, 9 === puzzle()[given] ? 8 : 9);
  await expect(page.getByTestId('announcer')).toHaveText('This number is part of the puzzle.');
  await expect(cell(page, given)).toHaveAccessibleName(new RegExp(`, ${String(puzzle()[given])}, given$`));
});

test('conflito é marcado e anunciado', async ({ page }) => {
  await openGame(page);
  const values = puzzle();
  const row = [...Array(9).keys()];
  const givenInRow0 = row.find((c) => values[c] !== 0)!;
  const emptyInRow0 = row.find((c) => values[c] === 0)!;
  await type(page, emptyInRow0, values[givenInRow0]!);
  await expect(cell(page, emptyInRow0)).toHaveAccessibleName(/conflict/);
  await expect(page.getByTestId('announcer')).toHaveText('Conflict.');
});

test('anotações entram com N e saem ao colocar o número', async ({ page }) => {
  await openGame(page);
  const empty = puzzle().findIndex((value) => value === 0);
  await cell(page, empty).click();
  await page.keyboard.press('n');
  await page.keyboard.press('1');
  await page.keyboard.press('4');
  await expect(cell(page, empty)).toHaveAccessibleName(/notes 1, 4$/);
  await page.keyboard.press('n');
  await page.keyboard.press(String(solution()[empty]));
  await expect(cell(page, empty)).toHaveAccessibleName(new RegExp(`, ${String(solution()[empty])}$`));
});

test('completar um bloco certo vitrifica o painel', async ({ page }) => {
  await openGame(page);
  const box = BOXES.findIndex((cells) => cells.some((c) => puzzle()[c] === 0));
  for (const index of BOXES[box]!) if (puzzle()[index] === 0) await type(page, index, solution()[index]!);
  await expect(page.getByTestId('announcer')).toHaveText(`Panel ${String(box + 1)} glazed.`);
  await expect(cell(page, BOXES[box]![0]!)).toHaveAccessibleName(/glazed$/);
});

test('dica revela uma casa e conta no resultado', async ({ page }) => {
  await openGame(page);
  await page.getByRole('button', { name: 'Hint', exact: true }).click();
  await expect(page.getByTestId('announcer')).toHaveText(/^Hint: row \d, column \d is \d\.$/);
});

test('desfazer e refazer pelo teclado', async ({ page }) => {
  await openGame(page);
  const empty = puzzle().findIndex((value) => value === 0);
  await type(page, empty, solution()[empty]!);
  await page.keyboard.press('Control+z');
  await expect(cell(page, empty)).toHaveAccessibleName(/empty$/);
  await page.keyboard.press('Control+Shift+z');
  await expect(cell(page, empty)).toHaveAccessibleName(new RegExp(`, ${String(solution()[empty])}$`));
});

test('as setas movem a seleção', async ({ page }) => {
  await openGame(page);
  await cell(page, 0).click();
  await page.keyboard.press('ArrowRight');
  await expect(cell(page, 1)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(cell(page, 10)).toBeFocused();
});

test('a pausa cobre o tabuleiro e o cronômetro para', async ({ page }) => {
  await openGame(page);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Paused' })).toBeVisible();
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Paused' })).toBeHidden();
});

test('a partida continua depois de recarregar', async ({ page }) => {
  await openGame(page);
  const empty = puzzle().findIndex((value) => value === 0);
  await type(page, empty, solution()[empty]!);
  await page.goto('/');
  await page.getByRole('button', { name: /Continue/ }).click();
  await expect(cell(page, empty)).toHaveAccessibleName(new RegExp(`, ${String(solution()[empty])}$`));
});

test('resolver o puzzle inteiro mostra a vitória', async ({ page }) => {
  test.slow();
  await openGame(page);
  await fillSolution(page);
  await expect(page.getByRole('dialog', { name: 'The mural is complete.' })).toBeVisible();
  await expect(page.getByTestId('announcer')).toHaveText('The mural is complete.');
});

test('sem erros no console e sem pedidos para fora do site', async ({ page, baseURL }) => {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(error.message));
  page.on('request', (request) => {
    if (!request.url().startsWith(baseURL!)) problems.push(request.url());
  });
  await openGame(page);
  const empty = puzzle().findIndex((value) => value === 0);
  await type(page, empty, solution()[empty]!);
  expect(problems).toEqual([]);
});
```

Os testes importam o motor (e o banco em JSON) direto de `src/game`, para o motor jogar junto. Se o Playwright não carregar o JSON, trocar o `import data from '../data/puzzles.json'` de `bank.ts` por `import data from '../data/puzzles.json' with { type: 'json' };`, que o Vite e o Node aceitam.

- [ ] **Passo 5: `tests/e2e/a11y.spec.ts`**

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { fillSolution, openGame, puzzle, solution, type } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

const axe = async (page: import('@playwright/test').Page) => (await new AxeBuilder({ page }).analyze()).violations;

test('início sem violações', async ({ page }) => {
  await page.goto('/');
  expect(await axe(page)).toEqual([]);
});

test('jogo com anotações e conflito sem violações', async ({ page }) => {
  await openGame(page);
  const empty = puzzle().findIndex((value) => value === 0);
  await type(page, empty, solution()[empty]!);
  expect(await axe(page)).toEqual([]);
});

test('vitória sem violações', async ({ page }) => {
  test.slow();
  await openGame(page);
  await fillSolution(page);
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await axe(page)).toEqual([]);
});
```

- [ ] **Passo 6: rodar tudo duas vezes e commitar**

`npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, `npm run test:e2e` (duas vezes seguidas) → tudo passando nos dois projetos.

```bash
git add -A
git commit -m "test: partida no navegador com a solução do motor, conflitos, anotações, vitrificação e acessibilidade

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 13: README e documento

- [ ] **Passo 1:** `README.md` em inglês: o jogo, como jogar, comandos (incluindo `npm run puzzles`), estrutura, decisões (motor puro, técnicas como funções, banco gerado e testado, semente pela URL) e stack.
- [ ] **Passo 2:** no design, `Status: aprovado e implementado` e atualizar as tabelas de arquivos com o que mudou (por exemplo `GameHeader.vue`, `candidates.ts`, `serialize.ts`, `bank.ts`, `techniques/apply-step.ts`), o tamanho real do banco por nível e qualquer decisão tomada na implementação.
- [ ] **Passo 3:** `npm run format:check` e commit `docs: README e design atualizados`, com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

---

## Cobertura do design

| Requisito | Onde |
|---|---|
| Tabuleiro, regras e conflitos (§2) | Tarefas 2 e 7 |
| Níveis por técnica e solução única (§2) | Tarefas 3, 4, 5 e 6 |
| Banco e semente pela URL (§2, §5) | Tarefas 6 e 11 |
| Jogadas, anotações, limpeza automática, desfazer/refazer (§2) | Tarefas 7, 10 e 11 |
| Vitrificação e mural (§2, §3) | Tarefas 7, 9 e 11 |
| Dica (§2) | Tarefas 7 e 11 |
| Cronômetro, melhor tempo, partida salva (§2) | Tarefas 8, 10 e 11 |
| Visual, estados, tipografia, layout, animações, movimento reduzido (§3) | Tarefas 9, 11 e 12 |
| Telas (§3) | Tarefa 11 |
| Textos (§4) | Tarefa 9 |
| Acessibilidade (§5) | Tarefas 9, 10, 11 e 12 |
| Erros e casos de borda (§5) | Tarefas 7, 8 e 10 |
| Testes (§7) | Tarefas 2 a 9 e 12 |
