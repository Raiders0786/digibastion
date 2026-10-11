// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  incidentCardInput,
  renderIncidentCardSvg,
  renderQuizCardSvg,
  renderWeeklyCardSvg,
  weeklyCardInput,
  wrapTitle,
  type IncidentCardInput,
} from './og-card';
import { weeklyItem, weeklyPublicContent } from './weekly-test-fixtures';

const base: IncidentCardInput = {
  title: 'Example Protocol bridge exploit',
  lossLabel: '~$4.2M reported lost',
  chain: 'Ethereum',
  attackType: 'Bridge exploit',
  sourceLabel: 'QuillMonitor',
  status: 'confirmed',
  poweredByQuillMonitor: true,
};

const parses = (svg: string) => new DOMParser().parseFromString(svg, 'image/svg+xml').getElementsByTagName('parsererror').length === 0;

describe('wrapTitle', () => {
  it('wraps at word boundaries within the line width', () => {
    const lines = wrapTitle('Example Protocol loses funds in a bridge attack after a signer key leaked', 34, 3);
    expect(lines.length).toBeLessThanOrEqual(3);
    for (const line of lines) expect(Array.from(line).length).toBeLessThanOrEqual(34);
  });
  it('ends with an ellipsis when the text does not fit', () => {
    const lines = wrapTitle('word '.repeat(60), 34, 3);
    expect(lines).toHaveLength(3);
    expect(lines[2].endsWith('…')).toBe(true);
    expect(Array.from(lines[2]).length).toBeLessThanOrEqual(34);
  });
  it('cuts a single very long word', () => {
    const lines = wrapTitle('x'.repeat(200), 34, 3);
    expect(lines).toHaveLength(3);
    for (const line of lines) expect(Array.from(line).length).toBeLessThanOrEqual(34);
  });
});

describe('renderIncidentCardSvg', () => {
  it('is a 1200x630 SVG that parses', () => {
    const svg = renderIncidentCardSvg(base);
    expect(svg).toContain('width="1200" height="630"');
    expect(parses(svg)).toBe(true);
  });
  it('escapes the title and other text', () => {
    const svg = renderIncidentCardSvg({ ...base, title: '<script>&"', chain: 'A&B', sourceLabel: '<b>' });
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;&amp;&quot;');
    expect(svg).toContain('A&amp;B');
    expect(parses(svg)).toBe(true);
  });
  it('wraps a long title to three lines with an ellipsis', () => {
    const svg = renderIncidentCardSvg({ ...base, title: 'Long title word '.repeat(20) });
    expect(svg.match(/data-line="title"/g)).toHaveLength(3);
    expect(svg).toContain('…');
  });
  it('credits QuillMonitor only when asked', () => {
    expect(renderIncidentCardSvg(base)).toContain('Powered by QuillMonitor');
    expect(renderIncidentCardSvg({ ...base, poweredByQuillMonitor: false })).not.toContain('Powered by QuillMonitor');
  });
  it('uses the source status words and never says verified', () => {
    for (const status of ['confirmed', 'unconfirmed', null] as const) {
      expect(renderIncidentCardSvg({ ...base, status })).not.toMatch(/verified/i);
    }
    expect(renderIncidentCardSvg(base)).toContain('CONFIRMED BY QUILLMONITOR');
    expect(renderIncidentCardSvg({ ...base, status: 'unconfirmed' })).toContain('UNCONFIRMED');
  });
  it('names the source', () => {
    expect(renderIncidentCardSvg({ ...base, sourceLabel: 'Web3 Is Going Just Great', poweredByQuillMonitor: false }))
      .toContain('Source: Web3 Is Going Just Great');
  });
});

describe('incidentCardInput', () => {
  it('maps a newsletter item with the source, loss and QuillMonitor credit', () => {
    expect(incidentCardInput(weeklyItem())).toEqual({
      title: 'Example Protocol loses funds in bridge attack',
      lossLabel: '~$4.2M reported lost',
      chain: 'Ethereum',
      attackType: 'Bridge Exploit',
      sourceLabel: 'QuillMonitor',
      status: 'confirmed',
      poweredByQuillMonitor: true,
    });
  });
  it('says the loss is not disclosed when there is none', () => {
    expect(incidentCardInput(weeklyItem({ amountUsd: null, amountDisplay: null })).lossLabel).toBe('Loss not disclosed');
  });
});

describe('renderWeeklyCardSvg', () => {
  it('renders the week, loss and count and parses', () => {
    const svg = renderWeeklyCardSvg(weeklyCardInput(weeklyPublicContent()));
    expect(svg).toContain('width="1200" height="630"');
    expect(svg).toContain('Oct 5, 2026');
    expect(svg).toContain('~$12.3M reported lost');
    expect(svg).toContain('9 incidents');
    expect(svg).not.toMatch(/verified/i);
    expect(parses(svg)).toBe(true);
  });
  it('escapes its text', () => {
    const svg = renderWeeklyCardSvg({ weekLabel: '<x>', lossLabel: null, incidentCount: 1 });
    expect(svg).toContain('&lt;x&gt;');
    expect(svg).toContain('1 incident');
    expect(parses(svg)).toBe(true);
  });
});

describe('renderQuizCardSvg', () => {
  it('escapes the username and badges', () => {
    const svg = renderQuizCardSvg({ username: '<img onerror=x>', score: 72, badges: ['A&B', '"q"'], avatarDataUri: null });
    expect(svg).not.toContain('<img');
    expect(svg).toContain('A&amp;B');
    expect(svg).toContain('&quot;q&quot;');
    expect(parses(svg)).toBe(true);
  });
  it('clamps the score and shows the www domain', () => {
    const svg = renderQuizCardSvg({ username: 'anon', score: 400, badges: [], avatarDataUri: null });
    expect(svg).toContain('>100<');
    expect(svg).toContain('www.digibastion.com');
  });
});
