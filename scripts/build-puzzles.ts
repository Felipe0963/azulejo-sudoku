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
  if (seed % 50 === 0)
    console.log(seed, LEVELS.map((level) => `${level}=${String(bank[level].length)}`).join(' '));
}

for (const level of LEVELS) {
  if (bank[level].length < MINIMUM)
    throw new Error(`Only ${String(bank[level].length)} ${level} puzzles were found.`);
}

writeFileSync(
  new URL('../src/data/puzzles.json', import.meta.url),
  `${JSON.stringify({ version: 1, ...bank }, null, 1)}\n`,
);
console.log('Done:', LEVELS.map((level) => `${level}=${String(bank[level].length)}`).join(' '));
