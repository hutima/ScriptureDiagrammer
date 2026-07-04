import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { classifyWidth, loadForceDesktop, saveForceDesktop, isTouchDevice, resetTouchDeviceCache } from '@/ui/responsive';

describe('viewport classification', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') localStorage.clear();
  });

  it('classifies widths into mobile/tablet/desktop bands', () => {
    expect(classifyWidth(360)).toBe('mobile');
    expect(classifyWidth(767)).toBe('mobile');
    expect(classifyWidth(768)).toBe('tablet');
    expect(classifyWidth(1023)).toBe('tablet');
    expect(classifyWidth(1024)).toBe('desktop');
    expect(classifyWidth(1920)).toBe('desktop');
  });

  it('persists the force-desktop preference', () => {
    expect(loadForceDesktop()).toBe(false);
    saveForceDesktop(true);
    expect(loadForceDesktop()).toBe(true);
    saveForceDesktop(false);
    expect(loadForceDesktop()).toBe(false);
  });
});

describe('isTouchDevice', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    resetTouchDeviceCache();
  });
  beforeEach(() => {
    resetTouchDeviceCache();
  });

  it('is false in the bare jsdom test environment (fine pointer, no touch)', () => {
    expect(isTouchDevice()).toBe(false);
  });

  it('is true when the primary pointer reports coarse (mocked matchMedia)', () => {
    window.matchMedia = ((query: string) => ({
      matches: query === '(pointer: coarse)',
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
    expect(isTouchDevice()).toBe(true);
  });

  it('caches the result across calls until reset', () => {
    window.matchMedia = ((query: string) => ({
      matches: query === '(pointer: coarse)',
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
    expect(isTouchDevice()).toBe(true);
    // Flip matchMedia to report fine-pointer; the cached value must not change
    // without an explicit reset (the physical device class never changes
    // mid-session, so we deliberately don't re-detect on every call).
    window.matchMedia = (() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
    expect(isTouchDevice()).toBe(true);
    resetTouchDeviceCache();
    expect(isTouchDevice()).toBe(false);
  });
});
