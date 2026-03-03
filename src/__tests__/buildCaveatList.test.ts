import { describe, it, expect, vi } from 'vitest';
import { type PublicClient, type Address, type Hex } from 'viem';
import { getSmartAccountsEnvironment } from '@metamask/smart-accounts-kit';
import { baseSepolia } from 'viem/chains';
import {
  buildCaveatList,
  buildDelegationAuthority,
} from '../lib/caveats.js';
import type { GrantOptions } from '../types.js';

vi.mock('../lib/token.js', () => ({
  getTokenDecimals: vi.fn().mockResolvedValue(6),
}));

const environment = getSmartAccountsEnvironment(baseSepolia.id);

const DELEGATE = '0xEC12d2450934E3c158129D0B387739506C789b07' as const;
const TOKEN = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;
const CONTRACT = '0x0000000000000000000000000000000000000001' as const;
const RECIPIENT = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as const;
const ENFORCER = '0x1234567890abcdef1234567890abcdef12345678' as Address;
const TERMS = '0xdeadbeef' as Hex;

const mockPublicClient = {} as PublicClient;

function makeOpts(overrides: Partial<GrantOptions>): GrantOptions {
  return { to: DELEGATE, allow: [], ...overrides } as GrantOptions;
}

// ---------------------------------------------------------------------------
// General validation
// ---------------------------------------------------------------------------

describe('buildCaveatList – general', () => {
  it('throws when allow is empty', async () => {
    await expect(
      buildCaveatList(makeOpts({ allow: [] }), mockPublicClient, environment),
    ).rejects.toThrow('At least one --allow <type> is required');
  });

  it('throws when allow is undefined', async () => {
    await expect(
      buildCaveatList(
        makeOpts({ allow: undefined as unknown as string[] }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('At least one --allow <type> is required');
  });

  it('throws for unknown caveat type', async () => {
    await expect(
      buildCaveatList(
        makeOpts({ allow: ['unknownType'] }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('Unknown caveat type: unknownType');
  });

  it('returns an array of Caveat objects', async () => {
    const result = await buildCaveatList(
      makeOpts({ allow: ['limitedCalls'], limit: 5 }),
      mockPublicClient,
      environment,
    );
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('enforcer');
    expect(result[0]).toHaveProperty('terms');
  });
});

// ---------------------------------------------------------------------------
// buildDelegationAuthority – scope/caveat partitioning
// ---------------------------------------------------------------------------

describe('buildDelegationAuthority – scope partitioning', () => {
  it('throws when allow is empty', async () => {
    await expect(
      buildDelegationAuthority(
        makeOpts({ allow: [] }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('At least one --allow <type> is required');
  });

  it('detects a scope type and returns scope + empty caveats', async () => {
    const result = await buildDelegationAuthority(
      makeOpts({
        allow: ['nativeTokenTransferAmount'],
        maxAmount: '1',
      }),
      mockPublicClient,
      environment,
    );

    expect(result.scope).not.toBeNull();
    expect(result.scope!.type).toBe('nativeTokenTransferAmount');
    expect(result.caveats).toHaveLength(0);
  });

  it('returns scope + additional caveats when both are present', async () => {
    const result = await buildDelegationAuthority(
      makeOpts({
        allow: ['erc20TransferAmount', 'limitedCalls'],
        tokenAddress: TOKEN,
        maxAmount: '50',
        limit: 5,
      }),
      mockPublicClient,
      environment,
    );

    expect(result.scope).not.toBeNull();
    expect(result.scope!.type).toBe('erc20TransferAmount');
    expect(result.caveats).toHaveLength(1);
    expect(result.caveats[0]!.enforcer).toBe(
      environment.caveatEnforcers.LimitedCallsEnforcer,
    );
  });

  it('returns undefined scope when only non-scope caveats present', async () => {
    const result = await buildDelegationAuthority(
      makeOpts({
        allow: ['limitedCalls', 'timestamp'],
        limit: 3,
        afterTimestamp: 1700000000,
      }),
      mockPublicClient,
      environment,
    );

    expect(result.scope).toBeUndefined();
    expect(result.caveats).toHaveLength(2);
  });

  it('throws when >1 scope type is provided', async () => {
    await expect(
      buildDelegationAuthority(
        makeOpts({
          allow: ['nativeTokenTransferAmount', 'erc20TransferAmount'],
          maxAmount: '1',
          tokenAddress: TOKEN,
        }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('Only one scope type allowed per delegation');
  });
});

// ---------------------------------------------------------------------------
// Custom caveat
// ---------------------------------------------------------------------------

describe('buildDelegationAuthority – custom caveat', () => {
  it('builds a custom caveat with enforcerAddress and enforcerTerms', async () => {
    const result = await buildDelegationAuthority(
      makeOpts({
        allow: ['custom'],
        enforcerAddress: ENFORCER,
        enforcerTerms: TERMS,
      }),
      mockPublicClient,
      environment,
    );

    expect(result.scope).toBeUndefined();
    expect(result.caveats).toHaveLength(1);
    expect(result.caveats[0]!.enforcer).toBe(ENFORCER);
    expect(result.caveats[0]!.terms).toBe(TERMS);
  });

  it('throws when enforcerAddress is missing for custom', async () => {
    await expect(
      buildDelegationAuthority(
        makeOpts({
          allow: ['custom'],
          enforcerTerms: TERMS,
        }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--enforcerAddress required for custom caveat');
  });

  it('throws when enforcerTerms is missing for custom', async () => {
    await expect(
      buildDelegationAuthority(
        makeOpts({
          allow: ['custom'],
          enforcerAddress: ENFORCER,
        }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--enforcerTerms required for custom caveat');
  });

  it('combines scope with custom caveat', async () => {
    const result = await buildDelegationAuthority(
      makeOpts({
        allow: ['nativeTokenTransferAmount', 'custom'],
        maxAmount: '1',
        enforcerAddress: ENFORCER,
        enforcerTerms: TERMS,
      }),
      mockPublicClient,
      environment,
    );

    expect(result.scope).not.toBeNull();
    expect(result.scope!.type).toBe('nativeTokenTransferAmount');
    expect(result.caveats).toHaveLength(1);
    expect(result.caveats[0]!.enforcer).toBe(ENFORCER);
  });
});

// ---------------------------------------------------------------------------
// Non-scope caveats – validation (via buildCaveatList)
// ---------------------------------------------------------------------------

describe('buildCaveatList – limitedCalls validation', () => {
  it('throws when missing limit', async () => {
    await expect(
      buildCaveatList(
        makeOpts({ allow: ['limitedCalls'] }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--limit required');
  });
});

describe('buildCaveatList – redeemer validation', () => {
  it('throws when missing redeemers', async () => {
    await expect(
      buildCaveatList(
        makeOpts({ allow: ['redeemer'] }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--redeemers required');
  });
});

describe('buildCaveatList – nonce validation', () => {
  it('throws when missing nonce', async () => {
    await expect(
      buildCaveatList(
        makeOpts({ allow: ['nonce'] }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--nonce required');
  });
});

describe('buildCaveatList – id validation', () => {
  it('throws when missing caveatId', async () => {
    await expect(
      buildCaveatList(
        makeOpts({ allow: ['id'] }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--caveatId required');
  });
});

describe('buildCaveatList – valueLte validation', () => {
  it('throws when missing maxValue', async () => {
    await expect(
      buildCaveatList(
        makeOpts({ allow: ['valueLte'] }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--maxValue required');
  });
});

describe('buildCaveatList – allowedTargets validation', () => {
  it('throws when missing allowedTargets', async () => {
    await expect(
      buildCaveatList(
        makeOpts({ allow: ['allowedTargets'] }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--allowedTargets required');
  });
});

describe('buildCaveatList – allowedMethods validation', () => {
  it('throws when missing allowedMethods', async () => {
    await expect(
      buildCaveatList(
        makeOpts({ allow: ['allowedMethods'] }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--allowedMethods required');
  });
});

describe('buildCaveatList – allowedCalldata validation', () => {
  it('throws when missing calldataStartIndex', async () => {
    await expect(
      buildCaveatList(
        makeOpts({ allow: ['allowedCalldata'], calldataValue: '0xab' }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--calldataStartIndex required');
  });

  it('throws when missing calldataValue', async () => {
    await expect(
      buildCaveatList(
        makeOpts({ allow: ['allowedCalldata'], calldataStartIndex: 4 }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--calldataValue required');
  });
});

describe('buildCaveatList – nativeTokenPayment validation', () => {
  it('throws when missing paymentRecipient', async () => {
    await expect(
      buildCaveatList(
        makeOpts({ allow: ['nativeTokenPayment'], paymentAmount: '1' }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--paymentRecipient required');
  });

  it('throws when missing paymentAmount', async () => {
    await expect(
      buildCaveatList(
        makeOpts({
          allow: ['nativeTokenPayment'],
          paymentRecipient: RECIPIENT,
        }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--paymentAmount required');
  });
});

describe('buildCaveatList – exactExecution validation', () => {
  it('throws when missing execTarget', async () => {
    await expect(
      buildCaveatList(
        makeOpts({ allow: ['exactExecution'] }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--execTarget required');
  });
});

describe('buildCaveatList – deployed validation', () => {
  it('throws when missing deployAddress', async () => {
    await expect(
      buildCaveatList(
        makeOpts({
          allow: ['deployed'],
          deploySalt: '0x01',
          deployBytecode: '0x60',
        }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--deployAddress required');
  });
});


describe('buildCaveatList – limitedCalls', () => {
  it('produces a caveat with the LimitedCalls enforcer', async () => {
    const result = await buildCaveatList(
      makeOpts({ allow: ['limitedCalls'], limit: 5 }),
      mockPublicClient,
      environment,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.enforcer).toBe(
      environment.caveatEnforcers.LimitedCallsEnforcer,
    );
  });

  it('rejects limit of 0 (SDK requires positive integer)', async () => {
    await expect(
      buildCaveatList(
        makeOpts({ allow: ['limitedCalls'], limit: 0 }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('Invalid limit');
  });
});

describe('buildCaveatList – timestamp', () => {
  it('produces a caveat with the Timestamp enforcer', async () => {
    const result = await buildCaveatList(
      makeOpts({
        allow: ['timestamp'],
        afterTimestamp: 1700000000,
        beforeTimestamp: 1800000000,
      }),
      mockPublicClient,
      environment,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.enforcer).toBe(
      environment.caveatEnforcers.TimestampEnforcer,
    );
  });

  it('defaults thresholds to 0 when omitted', async () => {
    const result = await buildCaveatList(
      makeOpts({ allow: ['timestamp'] }),
      mockPublicClient,
      environment,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.enforcer).toBe(
      environment.caveatEnforcers.TimestampEnforcer,
    );
  });
});

describe('buildCaveatList – blockNumber', () => {
  it('produces a caveat with the BlockNumber enforcer', async () => {
    const result = await buildCaveatList(
      makeOpts({
        allow: ['blockNumber'],
        afterBlock: '19426587',
        beforeBlock: '0',
      }),
      mockPublicClient,
      environment,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.enforcer).toBe(
      environment.caveatEnforcers.BlockNumberEnforcer,
    );
  });
});

describe('buildCaveatList – redeemer', () => {
  it('produces a caveat with the Redeemer enforcer', async () => {
    const result = await buildCaveatList(
      makeOpts({
        allow: ['redeemer'],
        redeemers: [RECIPIENT, CONTRACT],
      }),
      mockPublicClient,
      environment,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.enforcer).toBe(
      environment.caveatEnforcers.RedeemerEnforcer,
    );
  });
});

describe('buildCaveatList – nonce', () => {
  it('produces a caveat with the Nonce enforcer', async () => {
    const result = await buildCaveatList(
      makeOpts({ allow: ['nonce'], nonce: '0x01' }),
      mockPublicClient,
      environment,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.enforcer).toBe(environment.caveatEnforcers.NonceEnforcer);
  });
});

describe('buildCaveatList – id', () => {
  it('produces a caveat with the Id enforcer', async () => {
    const result = await buildCaveatList(
      makeOpts({ allow: ['id'], caveatId: '123456' }),
      mockPublicClient,
      environment,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.enforcer).toBe(environment.caveatEnforcers.IdEnforcer);
  });
});

describe('buildCaveatList – valueLte', () => {
  it('produces a caveat with the ValueLte enforcer', async () => {
    const result = await buildCaveatList(
      makeOpts({ allow: ['valueLte'], maxValue: '0.01' }),
      mockPublicClient,
      environment,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.enforcer).toBe(
      environment.caveatEnforcers.ValueLteEnforcer,
    );
  });
});

describe('buildCaveatList – allowedTargets', () => {
  it('produces a caveat with the AllowedTargets enforcer', async () => {
    const result = await buildCaveatList(
      makeOpts({
        allow: ['allowedTargets'],
        allowedTargets: [TOKEN, CONTRACT],
      }),
      mockPublicClient,
      environment,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.enforcer).toBe(
      environment.caveatEnforcers.AllowedTargetsEnforcer,
    );
  });
});

describe('buildCaveatList – allowedMethods', () => {
  it('produces a caveat with the AllowedMethods enforcer', async () => {
    const result = await buildCaveatList(
      makeOpts({
        allow: ['allowedMethods'],
        allowedMethods: ['0xa9059cbb', 'transfer(address,uint256)'],
      }),
      mockPublicClient,
      environment,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.enforcer).toBe(
      environment.caveatEnforcers.AllowedMethodsEnforcer,
    );
  });
});

describe('buildCaveatList – allowedCalldata', () => {
  it('produces a caveat with the AllowedCalldata enforcer', async () => {
    const result = await buildCaveatList(
      makeOpts({
        allow: ['allowedCalldata'],
        calldataStartIndex: 4,
        calldataValue: '0xabcd',
      }),
      mockPublicClient,
      environment,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.enforcer).toBe(
      environment.caveatEnforcers.AllowedCalldataEnforcer,
    );
  });

  it('accepts calldataStartIndex of 0', async () => {
    const result = await buildCaveatList(
      makeOpts({
        allow: ['allowedCalldata'],
        calldataStartIndex: 0,
        calldataValue: '0xabcd',
      }),
      mockPublicClient,
      environment,
    );

    expect(result).toHaveLength(1);
  });
});

describe('buildCaveatList – nativeTokenPayment', () => {
  it('produces a caveat with the NativeTokenPayment enforcer', async () => {
    const result = await buildCaveatList(
      makeOpts({
        allow: ['nativeTokenPayment'],
        paymentRecipient: RECIPIENT,
        paymentAmount: '0.5',
      }),
      mockPublicClient,
      environment,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.enforcer).toBe(
      environment.caveatEnforcers.NativeTokenPaymentEnforcer,
    );
  });
});

describe('buildCaveatList – exactExecution', () => {
  it('produces a caveat with defaults', async () => {
    const result = await buildCaveatList(
      makeOpts({
        allow: ['exactExecution'],
        execTarget: CONTRACT,
      }),
      mockPublicClient,
      environment,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.enforcer).toBe(
      environment.caveatEnforcers.ExactExecutionEnforcer,
    );
  });

  it('produces a caveat with provided value and calldata', async () => {
    const result = await buildCaveatList(
      makeOpts({
        allow: ['exactExecution'],
        execTarget: CONTRACT,
        execValue: '1.0',
        execCalldata: '0xdeadbeef',
      }),
      mockPublicClient,
      environment,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.enforcer).toBe(
      environment.caveatEnforcers.ExactExecutionEnforcer,
    );
  });
});

// ---------------------------------------------------------------------------
// Custom caveat via buildCaveatList
// ---------------------------------------------------------------------------

describe('buildCaveatList – custom caveat', () => {
  it('produces a caveat with custom enforcer', async () => {
    const result = await buildCaveatList(
      makeOpts({
        allow: ['custom'],
        enforcerAddress: ENFORCER,
        enforcerTerms: TERMS,
      }),
      mockPublicClient,
      environment,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.enforcer).toBe(ENFORCER);
    expect(result[0]!.terms).toBe(TERMS);
  });

  it('throws when enforcerAddress is missing', async () => {
    await expect(
      buildCaveatList(
        makeOpts({ allow: ['custom'], enforcerTerms: TERMS }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--enforcerAddress required for custom caveat');
  });

  it('throws when enforcerTerms is missing', async () => {
    await expect(
      buildCaveatList(
        makeOpts({ allow: ['custom'], enforcerAddress: ENFORCER }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--enforcerTerms required for custom caveat');
  });
});

// ---------------------------------------------------------------------------
// Multiple caveats in one call
// ---------------------------------------------------------------------------

describe('buildCaveatList – multiple caveats', () => {
  it('produces one caveat per allow entry', async () => {
    const result = await buildCaveatList(
      makeOpts({
        allow: ['limitedCalls', 'timestamp', 'redeemer'],
        limit: 3,
        afterTimestamp: 1700000000,
        beforeTimestamp: 0,
        redeemers: [RECIPIENT],
      }),
      mockPublicClient,
      environment,
    );

    expect(result).toHaveLength(3);
    expect(result[0]!.enforcer).toBe(
      environment.caveatEnforcers.LimitedCallsEnforcer,
    );
    expect(result[1]!.enforcer).toBe(
      environment.caveatEnforcers.TimestampEnforcer,
    );
    expect(result[2]!.enforcer).toBe(
      environment.caveatEnforcers.RedeemerEnforcer,
    );
  });
});
