import { describe, it, expect } from 'vitest';
import { lookupGloss, hasGloss } from '@/domain/model';

/**
 * Constituency-tree source-metadata labels combine a Lowfat `<wg rule>` name
 * with an "art." (articular) marker into one string, e.g. "Np-Appos · art.".
 * The composite fallback in `lookupGloss` splits these into components and
 * glosses the ones it recognizes, so tapping the combined label still opens a
 * useful popover instead of nothing.
 */
describe('glossary — composite label lookup', () => {
  it('glosses both components of "Np-Appos · art."', () => {
    const e = lookupGloss('Np-Appos · art.');
    expect(e).toBeDefined();
    expect(e?.detail).toMatch(/Np-Appos.*apposition/i);
    expect(e?.detail).toMatch(/art\..*articular/i);
    expect(hasGloss('Np-Appos · art.')).toBe(true);
  });

  it('glosses both components of "DetNP · art."', () => {
    const e = lookupGloss('DetNP · art.');
    expect(e).toBeDefined();
    expect(e?.detail).toMatch(/DetNP.*article/i);
    expect(e?.detail).toMatch(/art\..*articular/i);
  });

  it('skips an unknown component but still glosses the known one', () => {
    const e = lookupGloss('Np-Appos · zzNotARealRuleXx');
    expect(e).toBeDefined();
    expect(e?.detail).toMatch(/Np-Appos.*apposition/i);
    expect(e?.detail).not.toMatch(/zzNotARealRuleXx/i);
  });

  it('returns undefined (no gloss) when every component is unknown', () => {
    expect(lookupGloss('zzNotAThing · alsoNotAThing')).toBeUndefined();
    expect(hasGloss('zzNotAThing · alsoNotAThing')).toBe(false);
  });

  it('is case-insensitive on composite components', () => {
    const e = lookupGloss('np-appos · ART.');
    expect(e).toBeDefined();
    expect(e?.detail).toMatch(/apposition/i);
  });

  it('strips a trailing period before matching a component', () => {
    // "art." (with period) and "art" (bare) resolve to the same entry.
    const withPeriod = lookupGloss('DetNP · art.');
    const bare = lookupGloss('DetNP · art');
    expect(withPeriod?.detail).toMatch(/articular/i);
    expect(bare?.detail).toMatch(/articular/i);
  });

  it('tries a hyphenated rule name whole before splitting on the hyphen', () => {
    // "sub-CL" has its own entry; if it were split naively into "sub"/"CL" the
    // (unglossed) pieces would produce nothing.
    const e = lookupGloss('sub-CL · art.');
    expect(e).toBeDefined();
    expect(e?.detail).toMatch(/sub-CL.*subordinate/i);
  });

  it('decomposes an ungrossed clause word-order rule into its position codes', () => {
    // "S-V-O" has no single whole entry, but splits into S / V / O, each of
    // which does — so the combination is still usefully glossed.
    const e = lookupGloss('S-V-O');
    expect(e).toBeDefined();
    expect(e?.detail).toMatch(/S.*subject/i);
    expect(e?.detail).toMatch(/V.*verb/i);
    expect(e?.detail).toMatch(/O.*direct object/i);
  });

  it('still resolves a plain, non-composite key directly (no regression)', () => {
    expect(lookupGloss('subject')?.term).toBe('Subject');
    expect(lookupGloss('nom')?.term).toBe('Nominative');
  });
});
