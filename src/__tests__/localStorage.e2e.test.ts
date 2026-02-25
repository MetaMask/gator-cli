import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { zeroAddress, type Hex } from 'viem';
import { ROOT_AUTHORITY, type Delegation } from '@metamask/smart-accounts-kit';

const TMP_DIR = mkdtempSync(join(tmpdir(), 'gator-e2e-'));

vi.mock('../lib/constants.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../lib/constants.js')>();
  return { ...original, DELEGATIONS_DIR: TMP_DIR };
});

const { getStorageClient } = await import('../lib/storage.js');
import type { PermissionsConfig } from '../types.js';
import { getDelegationHashOffchain } from '@metamask/smart-accounts-kit/utils';

const ALICE = '0x0f754A4E210E5116692197065a3A1B88054b192D';
const BOB = '0xda2885d2244C5791e99F77fe4b2816743eed27cC';
const CAROL = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

const LOCAL_CONFIG: PermissionsConfig = {
  version: 1,
  account: {
    address: ALICE as `0x${string}`,
    privateKey: '0x01' as Hex,
    upgraded: true,
    chainId: 84532,
  },
  delegationStorage: { apiKey: '', apiKeyId: '' },
};

function makeDelegation(overrides: Partial<Delegation> = {}): Delegation {
  return {
    delegator: ALICE,
    delegate: BOB,
    authority: ROOT_AUTHORITY,
    caveats: [],
    salt: '0x0',
    signature: '0xdeadbeef',
    ...overrides,
  } as Delegation;
}

afterAll(() => {
  rmSync(TMP_DIR, { recursive: true, force: true });
});

describe('e2e: storeDelegation ↔ getDelegation', () => {
  it('stores a delegation then retrieves it by hash', async () => {
    const client = getStorageClient(LOCAL_CONFIG, 'e2e-store');
    const delegation = makeDelegation();

    const hash = await client.storeDelegation(delegation);
    expect(hash).toMatch(getDelegationHashOffchain(delegation));

    const retrieved = await client.getDelegation(hash);
    expect(retrieved.delegator).toBe(ALICE);
    expect(retrieved.delegate).toBe(BOB);
    expect(retrieved.authority).toBe(ROOT_AUTHORITY);
  });
});

describe('e2e: fetchDelegations filters', () => {
  const PROFILE = 'e2e-filters';
  const client = getStorageClient(LOCAL_CONFIG, PROFILE);

  beforeEach(async () => {
    await client.storeDelegation(
      makeDelegation({ delegator: ALICE, delegate: BOB, salt: '0xa' }),
    );
    await client.storeDelegation(
      makeDelegation({ delegator: BOB, delegate: ALICE, salt: '0xb' }),
    );
    await client.storeDelegation(
      makeDelegation({ delegator: ALICE, delegate: CAROL, salt: '0xc' }),
    );
  });

  it('ALL returns every delegation involving the address', async () => {
    const allAlice = await client.fetchDelegations(ALICE, 'ALL');
    expect(allAlice).toHaveLength(3);
  });

  it('GIVEN returns only delegations where address is delegator', async () => {
    const given = await client.fetchDelegations(ALICE, 'GIVEN');
    expect(given).toHaveLength(2);
    given.forEach((d) => expect(d.delegator.toLowerCase()).toBe(ALICE.toLowerCase()));
  });

  it('RECEIVED returns only delegations where address is delegate', async () => {
    const received = await client.fetchDelegations(BOB, 'RECEIVED');
    expect(received).toHaveLength(1);
    expect(received[0]!.delegate).toBe(BOB);
  });

  it('returns empty array for an address with no delegations', async () => {
    const client = getStorageClient(LOCAL_CONFIG, PROFILE);
    const result = await client.fetchDelegations(zeroAddress);
    expect(result).toEqual([]);
  });

  it('address matching is case-insensitive', async () => {
    const client = getStorageClient(LOCAL_CONFIG, PROFILE);
    const lower = await client.fetchDelegations(ALICE.toLowerCase());
    const upper = await client.fetchDelegations(ALICE.toUpperCase());
    expect(lower.length).toBe(upper.length);
  });
});

describe('e2e: getDelegationChain', () => {
  it('resolves a two-level chain (root → leaf)', async () => {
    const client = getStorageClient(LOCAL_CONFIG, 'e2e-chain');

    const root = makeDelegation({ salt: '0x10' });
    const rootHash = await client.storeDelegation(root);

    const leaf = makeDelegation({ authority: rootHash, salt: '0x11' });
    const leafHash = await client.storeDelegation(leaf);

    const chain = await client.getDelegationChain(leafHash);
    expect(chain).toHaveLength(2);
    expect(chain[0]?.authority).toBe(rootHash);
    expect(chain[1]?.authority).toBe(ROOT_AUTHORITY);
  });

  it('resolves a three-level chain', async () => {
    const client = getStorageClient(LOCAL_CONFIG, 'e2e-chain3');

    const root = makeDelegation({ salt: '0x20' });
    const rootHash = await client.storeDelegation(root);

    const mid = makeDelegation({ authority: rootHash, salt: '0x21' });
    const midHash = await client.storeDelegation(mid);

    const leaf = makeDelegation({ authority: midHash, salt: '0x22' });
    const leafHash = await client.storeDelegation(leaf);

    const chain = await client.getDelegationChain(leafHash);
    expect(chain).toHaveLength(3);
    expect(chain[0]?.authority).toBe(midHash);
    expect(chain[1]?.authority).toBe(rootHash);
    expect(chain[2]?.authority).toBe(ROOT_AUTHORITY);
  });

  it('returns single-element chain for a root delegation', async () => {
    const client = getStorageClient(LOCAL_CONFIG, 'e2e-chain-root');

    const root = makeDelegation({ salt: '0x30' });
    const rootHash = await client.storeDelegation(root);

    const chain = await client.getDelegationChain(rootHash);
    expect(chain).toHaveLength(1);
    expect(chain[0]?.authority).toBe(ROOT_AUTHORITY);
  });

  it('accepts a delegation object as input', async () => {
    const client = getStorageClient(LOCAL_CONFIG, 'e2e-chain-obj');
    const root = makeDelegation({ salt: '0x40' });
    await client.storeDelegation(root);

    const chain = await client.getDelegationChain(root);
    expect(chain).toHaveLength(1);
  });

  it('throws when hash is not found at all', async () => {
    const client = getStorageClient(LOCAL_CONFIG, 'e2e-chain-missing');

    await expect(
      client.getDelegationChain(
        '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      ),
    ).rejects.toThrow('not found in local storage');
  });
});

describe('e2e: general case', () => {
  it('rejects unsigned delegation (signature is 0x)', async () => {
    const client = getStorageClient(LOCAL_CONFIG, 'e2e-edge');
    const unsigned = makeDelegation({ signature: '0x' });

    await expect(client.storeDelegation(unsigned)).rejects.toThrow(
      'Delegation must be signed',
    );
  });
});
