import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { classifyCollectedWeb3Incident } from './classifier.ts';

Deno.test('collector classifies explicit DeFi project categories narrowly', () => {
  const result = classifyCollectedWeb3Incident(
    'Example Finance - Reentrancy',
    'Funds were drained from a contract.',
    'Reentrancy',
    'DEX',
  );
  assertEquals(result.category, 'defi-exploits');
  assertEquals(result.securityDomain, 'web3');
  assertEquals(result.taxonomyVersion, '2026-09-27.1');
});

Deno.test('collector does not treat package or protocol as standalone supply-chain/DeFi signals', () => {
  assertEquals(classifyCollectedWeb3Incident(
    'Protocol incident',
    'The team will package the recovery transactions.',
    'Smart Contract Bug',
    'Protocol',
  ).category, 'web3-security');
});

Deno.test('collector prioritizes concrete supply-chain and operational signals', () => {
  assertEquals(classifyCollectedWeb3Incident(
    'Frontend compromise',
    'A malicious npm dependency changed the protocol frontend.',
  ).category, 'supply-chain');
  assertEquals(classifyCollectedWeb3Incident(
    'Wallet incident',
    'A private key compromise led to unauthorized transfers.',
  ).category, 'operational-security');
});
