import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GNT_BOOKS } from '@/io/gnt';
import { SBLGNT_BUNDLED_BOOKS } from '@/io/gnt-sblgnt';
import { lowfatToDocuments, sblgntDialect } from '@/io/lowfat';

/**
 * The first-launch walkthrough opens John 1:1 from the DEFAULT (SBLGNT)
 * edition, so John must be bundled and its first sentence must convert to a
 * document titled "John 1:1" (the title the walkthrough's checkbox target and
 * the picker bridge match on).
 */
describe('bundled SBLGNT John (first-run tutorial passage)', () => {
  it('marks John (4) as the one bundled SBLGNT book (Philippians was retired)', () => {
    expect(SBLGNT_BUNDLED_BOOKS.has(4)).toBe(true);
    expect(SBLGNT_BUNDLED_BOOKS.has(11)).toBe(false);
    expect(SBLGNT_BUNDLED_BOOKS.size).toBe(1);
  });

  it('maps book 4 to the bundled file name', () => {
    const john = GNT_BOOKS.find((b) => b.num === 4)!;
    expect(john.name).toBe('John');
    expect(john.file).toBe('04-john.xml');
  });

  it('ships real upstream XML whose first sentence converts to "John 1:1"', () => {
    const xml = readFileSync(resolve(process.cwd(), 'public/sblgnt/04-john.xml'), 'utf8');
    // Authoritative Clear-Bible lowfat markup, not hand-written.
    expect(xml).toContain('<book lang="el" id="JHN">');
    expect(xml).toContain('JHN 1:1');
    // Converting the whole 12 MB book is slow in tests; the walkthrough only
    // depends on the FIRST sentence, so convert just that one.
    const end = xml.indexOf('</sentence>') + '</sentence>'.length;
    const firstSentence = `${xml.slice(0, end)}\n</book>`;
    const docs = lowfatToDocuments(firstSentence, {
      book: 'John',
      dialect: sblgntDialect,
      docIdPrefix: 'sblgnt',
      sourceId: 'macula-greek-sblgnt-lowfat',
    });
    expect(docs).toHaveLength(1);
    expect(docs[0]!.title).toBe('John 1:1');
    expect(docs[0]!.text).toContain('Ἐν ἀρχῇ ἦν ὁ λόγος');
    expect(docs[0]!.syntax.nodes.length).toBeGreaterThan(0);
  });
});
