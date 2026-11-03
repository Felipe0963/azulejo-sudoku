import { describe, expect, it } from 'vitest';
import { announcementFor, copy, formatTime } from '../../src/ui/content/copy';

describe('copy', () => {
  it('formatTime', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(61_500)).toBe('01:01');
    expect(formatTime(3_600_000)).toBe('60:00');
  });

  it('nome acessível das casas', () => {
    expect(
      copy.cellLabel({ cell: 15, value: 5, given: true, notes: [], conflict: false, glazed: false }),
    ).toBe('Row 2, column 7, 5, given');
    expect(
      copy.cellLabel({ cell: 15, value: 0, given: false, notes: [], conflict: false, glazed: false }),
    ).toBe('Row 2, column 7, empty');
    expect(
      copy.cellLabel({ cell: 15, value: 0, given: false, notes: [1, 4, 9], conflict: false, glazed: false }),
    ).toBe('Row 2, column 7, notes 1, 4, 9');
    expect(
      copy.cellLabel({ cell: 15, value: 3, given: false, notes: [], conflict: true, glazed: false }),
    ).toBe('Row 2, column 7, 3, conflict');
    expect(
      copy.cellLabel({ cell: 15, value: 3, given: false, notes: [], conflict: false, glazed: true }),
    ).toBe('Row 2, column 7, 3, glazed');
  });

  it('anúncios', () => {
    expect(announcementFor([{ type: 'glazed', box: 3 }])).toBe('Panel 4 glazed.');
    expect(
      announcementFor([
        { type: 'placed', cell: 2, digit: 5 },
        { type: 'conflict', cells: [0, 2] },
      ]),
    ).toBe('Conflict.');
    expect(announcementFor([{ type: 'blocked', cell: 0, reason: 'given' }])).toBe(
      'This number is part of the puzzle.',
    );
    expect(announcementFor([{ type: 'blocked', cell: 0, reason: 'glazed' }])).toBe('This panel is glazed.');
    expect(
      announcementFor([
        { type: 'hinted', cell: 13, digit: 7 },
        { type: 'placed', cell: 13, digit: 7 },
      ]),
    ).toBe('Hint: row 2, column 5 is 7.');
    // A vitória é anunciada dentro do diálogo de vitória, não na região da página.
    expect(announcementFor([{ type: 'glazed', box: 8 }, { type: 'won' }])).toBe('');
    expect(announcementFor([{ type: 'placed', cell: 2, digit: 4 }])).toBe('');
  });
});
