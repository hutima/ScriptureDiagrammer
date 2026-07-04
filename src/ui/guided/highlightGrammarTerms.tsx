import type { ReactNode } from 'react';
import { GRAMMAR_GLOSSARY, findGrammarGlossaryEntry } from '@/data/grammarGlossary';
import { GrammarTermHelp } from './GrammarTermHelp';

/**
 * One regex matching every glossary term/phrase, longest-first so a multi-word
 * entry (e.g. "present participle") is matched whole rather than being
 * shadowed by — or shadowing — a shorter entry ("participle"). Built once at
 * module load; the glossary is static data.
 */
const GRAMMAR_TERM_PATTERN = new RegExp(
  `\\b(${GRAMMAR_GLOSSARY.slice()
    .sort((a, b) => b.term.length - a.term.length)
    .map((e) => e.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')})\\b`,
  'gi',
);

/**
 * Wrap the FIRST occurrence of each known glossary term found in a block of
 * guided teaching prose with a `GrammarTermHelp` control, leaving every
 * subsequent occurrence of that same term as plain text (repeat highlights
 * would just be noise). `used` is shared across every plain-text fragment of
 * ONE prose block (a step's body/implication/caution, or a guide's
 * devotional frame) so the "first occurrence" rule holds across the whole
 * block, not just one fragment split out by `[[termId]]` Greek-term markers.
 *
 * `keyPrefix` keeps React keys unique across the several plain-text fragments
 * a single prose block can be split into.
 */
export function highlightGrammarTerms(text: string, used: Set<string>, keyPrefix: string): ReactNode[] {
  if (!text) return [text];
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let n = 0;
  GRAMMAR_TERM_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = GRAMMAR_TERM_PATTERN.exec(text))) {
    const matched = match[0];
    const lower = matched.toLowerCase();
    if (used.has(lower)) continue; // already highlighted once in this block
    const entry = findGrammarGlossaryEntry(matched);
    if (!entry) continue;
    nodes.push(text.slice(lastIndex, match.index));
    nodes.push(
      <GrammarTermHelp key={`${keyPrefix}-gt-${n++}`} term={matched} definition={entry.definition} />,
    );
    lastIndex = match.index + matched.length;
    used.add(lower);
  }
  nodes.push(text.slice(lastIndex));
  return nodes;
}
