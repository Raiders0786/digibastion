import { describe, expect, it } from 'vitest';
import { isQuillMonitorOnly, providerLabel, QUILLMONITOR_DATABASE_URL, sourceLabelFor, sourceLinkFor } from './attribution';

describe('attribution', () => {
  it('labels providers', () => {
    expect(providerLabel('quillmonitor')).toBe('QuillMonitor');
    expect(providerLabel('QuillMonitor')).toBe('QuillMonitor');
    expect(providerLabel('web3')).toBe('Web3 Is Going Just Great');
    expect(providerLabel('web3-incidents')).toBe('Web3 Is Going Just Great');
    expect(providerLabel('slowmist')).toBe('SlowMist Hacked');
    expect(providerLabel('rss')).toBeNull();
    expect(providerLabel(null)).toBeNull();
    expect(providerLabel('constructor')).toBeNull();
  });
  it('detects QuillMonitor-only records', () => {
    expect(isQuillMonitorOnly(['quillmonitor'])).toBe(true);
    expect(isQuillMonitorOnly(['quillmonitor', 'web3-incidents'])).toBe(false);
    expect(isQuillMonitorOnly([])).toBe(false);
    expect(QUILLMONITOR_DATABASE_URL).toBe('https://www.quillaudits.com/web3-hacks-database');
  });
  it('prefers the provider label, then the publisher, and never credits Digibastion', () => {
    expect(sourceLabelFor({ providers: ['quillmonitor'], sourceName: 'Something else' })).toBe('QuillMonitor');
    expect(sourceLabelFor({ providers: ['rss'], sourceName: 'BleepingComputer' })).toBe('BleepingComputer');
    expect(sourceLabelFor({ providers: [], sourceName: 'BleepingComputer' })).toBe('BleepingComputer');
    expect(sourceLabelFor({ providers: [], sourceName: null })).toBe('Source not given');
    expect(sourceLabelFor({ providers: [], sourceName: '  ' })).toBe('Source not given');
    expect(sourceLabelFor({ providers: [], sourceName: 'Digibastion Intelligence' })).toBe('Source not given');
  });
  it('never links the source to our own page', () => {
    expect(sourceLinkFor({ sourceUrl: 'https://www.digibastion.com/threat-intel/a', incidentUrl: 'https://www.digibastion.com/threat-intel/a' })).toBeNull();
    expect(sourceLinkFor({ sourceUrl: 'https://digibastion.com/threat-intel/b', incidentUrl: 'x' })).toBeNull();
    expect(sourceLinkFor({ sourceUrl: 'https://WWW.DIGIBASTION.COM:443/x', incidentUrl: 'x' })).toBeNull();
    expect(sourceLinkFor({ sourceUrl: 'javascript:alert(1)', incidentUrl: 'x' })).toBeNull();
    expect(sourceLinkFor({ sourceUrl: null, incidentUrl: 'x' })).toBeNull();
    expect(sourceLinkFor({ sourceUrl: 'https://example.com/r', incidentUrl: 'x' })).toBe('https://example.com/r');
  });
});
