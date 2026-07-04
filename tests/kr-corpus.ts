import { readFileSync } from 'node:fs';
import { lowfatToDocuments, sblgntDialect } from '@/io/lowfat';
import { maculaHebrewToDocuments } from '@/io/macula-hebrew';
import { sampleDocuments } from '@/fixtures';
import type { KrDocument } from '@/domain/schema';

/**
 * The KR characterization CORPUS — every fixture passage + bundled sample the
 * harness (tests/kr-characterization.test.ts) guards. Shared with the
 * compactness report script (scripts/kr-compactness-report.mts) so metric
 * deltas are measured over exactly the guarded set. Paths are relative to the
 * repo root (both vitest and vite-node run from there).
 */

export type Named = { name: string; doc: KrDocument };

const nestle = (file: string, book: string): Named[] =>
  lowfatToDocuments(readFileSync(`tests/${file}`, 'utf8'), { book }).map((doc) => ({
    name: `nestle ${doc.title}`,
    doc,
  }));
const sblgnt = (file: string, book: string): Named[] =>
  lowfatToDocuments(readFileSync(`tests/${file}`, 'utf8'), {
    book,
    dialect: sblgntDialect,
    docIdPrefix: 'sblgnt',
  }).map((doc) => ({ name: `sblgnt ${doc.title}`, doc }));
const hebrew = (file: string, book: string): Named[] =>
  maculaHebrewToDocuments(readFileSync(`tests/${file}`, 'utf8'), { book }).map((doc) => ({
    name: `wlc ${doc.title}`,
    doc,
  }));

export function loadCorpus(): Named[] {
  return [
    ...nestle('fixtures-lowfat-col-1-9-16.xml', 'Colossians'),
    ...nestle('fixtures-lowfat-mark-1-19-20.xml', 'Mark'),
    ...nestle('fixtures-lowfat-mark-5-25-34.xml', 'Mark'),
    ...nestle('fixtures-lowfat-phil-1-1-2.xml', 'Philippians'),
    ...sblgnt('fixtures-sblgnt-lowfat-2cor-5-4.xml', '2 Corinthians'),
    ...sblgnt('fixtures-sblgnt-lowfat-col-1-15.xml', 'Colossians'),
    ...sblgnt('fixtures-sblgnt-lowfat-col-1-16.xml', 'Colossians'),
    ...sblgnt('fixtures-sblgnt-lowfat-col-1-9-20.xml', 'Colossians'),
    ...sblgnt('fixtures-sblgnt-lowfat-eph-5-3-33.xml', 'Ephesians'),
    ...sblgnt('fixtures-sblgnt-lowfat-heb-1-1-4.xml', 'Hebrews'),
    ...sblgnt('fixtures-sblgnt-lowfat-mark-1-19-20.xml', 'Mark'),
    ...sblgnt('fixtures-sblgnt-lowfat-mark-5-21-43.xml', 'Mark'),
    ...sblgnt('fixtures-sblgnt-lowfat-mark-5-25-34.xml', 'Mark'),
    ...sblgnt('fixtures-sblgnt-lowfat-philemon.xml', 'Philemon'),
    ...sblgnt('fixtures-sblgnt-lowfat-rom-9-11.xml', 'Romans'),
    ...sblgnt('fixtures-sblgnt-lowfat-titus-2-13.xml', 'Titus'),
    ...hebrew('fixtures-macula-hebrew-gen-1-1.xml', 'Genesis'),
    ...hebrew('fixtures-macula-hebrew-gen-1-1-3.xml', 'Genesis'),
    ...hebrew('fixtures-macula-hebrew-gen-1-11.xml', 'Genesis'),
    ...hebrew('fixtures-macula-hebrew-psa-1-1-2.xml', 'Psalms'),
    ...hebrew('fixtures-macula-hebrew-deu-6-4.xml', 'Deuteronomy'),
    ...sampleDocuments.map((doc) => ({ name: `sample ${doc.id}`, doc })),
  ];
}
