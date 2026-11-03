import { describe, expect, it } from 'vitest';
import { newGame } from '../../src/game/game';
import { useGame } from '../../src/ui/composables/useGame';
import { CLASSIC } from './fixtures';

describe('useGame', () => {
  it('carregar uma partida salva desliga o modo de anotações e tira a seleção', () => {
    const game = useGame();
    game.start('easy', 1);
    game.toggleNotes();
    game.selected.value = 2;
    expect(game.notesMode.value).toBe(true);
    game.load(newGame('easy', CLASSIC));
    expect(game.notesMode.value).toBe(false);
    expect(game.selected.value).toBeNull();
  });
});
