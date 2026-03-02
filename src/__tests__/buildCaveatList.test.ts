import { describe, it, expect, vi } from 'vitest';
import { parseEther, parseUnits, type PublicClient } from 'viem';
import { getSmartAccountsEnvironment } from '@metamask/smart-accounts-kit';
import { baseSepolia } from 'viem/chains';
import { buildCaveatList } from '../lib/caveats.js';
import type { GrantOptions } from '../types.js';

vi.mock('../lib/token.js', () => ({
  getTokenDecimals: vi.fn().mockResolvedValue(6),
}));

const environment = getSmartAccountsEnvironment(baseSepolia.id);

const DELEGATE = '0xEC12d2450934E3c158129D0B387739506C789b07' as const;
const TOKEN = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;
const CONTRACT = '0x0000000000000000000000000000000000000001' as const;
const RECIPIENT = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as const;

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
// Former caveat types – validation
// ---------------------------------------------------------------------------

describe('buildCaveatList – erc20TransferAmount validation', () => {
  it('throws when missing tokenAddress', async () => {
    await expect(
      buildCaveatList(
        makeOpts({ allow: ['erc20TransferAmount'], maxAmount: '10' }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--tokenAddress required');
  });

  it('throws when missing maxAmount', async () => {
    await expect(
      buildCaveatList(
        makeOpts({ allow: ['erc20TransferAmount'], tokenAddress: TOKEN }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--maxAmount required');
  });
});

describe('buildCaveatList – erc20PeriodTransfer validation', () => {
  it('throws when missing tokenAddress', async () => {
    await expect(
      buildCaveatList(
        makeOpts({
          allow: ['erc20PeriodTransfer'],
          periodAmount: '10',
          periodDuration: 86400,
        }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--tokenAddress required');
  });

  it('throws when missing periodAmount', async () => {
    await expect(
      buildCaveatList(
        makeOpts({
          allow: ['erc20PeriodTransfer'],
          tokenAddress: TOKEN,
          periodDuration: 86400,
        }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--periodAmount required');
  });

  it('throws when missing periodDuration', async () => {
    await expect(
      buildCaveatList(
        makeOpts({
          allow: ['erc20PeriodTransfer'],
          tokenAddress: TOKEN,
          periodAmount: '10',
        }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--periodDuration required');
  });
});

describe('buildCaveatList – erc721Transfer validation', () => {
  it('throws when missing tokenAddress', async () => {
    await expect(
      buildCaveatList(
        makeOpts({ allow: ['erc721Transfer'], tokenId: '1' }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--tokenAddress required');
  });

  it('throws when missing tokenId', async () => {
    await expect(
      buildCaveatList(
        makeOpts({ allow: ['erc721Transfer'], tokenAddress: TOKEN }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--tokenId required');
  });
});

describe('buildCaveatList – nativeTokenTransferAmount validation', () => {
  it('throws when missing maxAmount', async () => {
    await expect(
      buildCaveatList(
        makeOpts({ allow: ['nativeTokenTransferAmount'] }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--maxAmount required');
  });
});

describe('buildCaveatList – nativeTokenPeriodTransfer validation', () => {
  it('throws when missing periodAmount', async () => {
    await expect(
      buildCaveatList(
        makeOpts({ allow: ['nativeTokenPeriodTransfer'], periodDuration: 3600 }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--periodAmount required');
  });

  it('throws when missing periodDuration', async () => {
    await expect(
      buildCaveatList(
        makeOpts({ allow: ['nativeTokenPeriodTransfer'], periodAmount: '1' }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--periodDuration required');
  });
});

describe('buildCaveatList – nativeTokenStreaming validation', () => {
  it('throws when missing amountPerSecond', async () => {
    await expect(
      buildCaveatList(
        makeOpts({
          allow: ['nativeTokenStreaming'],
          initialAmount: '1',
          maxAmount: '100',
        }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--amountPerSecond required');
  });
});

describe('buildCaveatList – ownershipTransfer validation', () => {
  it('throws when missing contractAddress', async () => {
    await expect(
      buildCaveatList(
        makeOpts({ allow: ['ownershipTransfer'] }),
        mockPublicClient,
        environment,
      ),
    ).rejects.toThrow('--contractAddress required');
  });
});

// ---------------------------------------------------------------------------
// Non-scope caveats – validation
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
        makeOpts({ allow: ['nativeTokenPayment'], paymentRecipient: RECIPIENT }),
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

// ---------------------------------------------------------------------------
// Happy paths – verify real caveats are built
// ---------------------------------------------------------------------------

describe('buildCaveatList – erc20TransferAmount', () => {
  it('produces a caveat with the ERC20TransferAmount enforcer', async () => {
    const result = await buildCaveatList(
      makeOpts({
        allow: ['erc20TransferAmount'],
        tokenAddress: TOKEN,
        maxAmount: '10',
      }),
      mockPublicClient,
      environment,
    );

    expect(result).toHaveLength(1);
    const caveat = result[0]!;
    expect(caveat.enforcer).toBe(environment.caveatEnforcers.ERC20TransferAmountEnforcer);
    expect(caveat.terms).toBeDefined();
  });
});

describe('buildCaveatList – nativeTokenTransferAmount', () => {
  it('produces a caveat with the NativeTokenTransferAmount enforcer', async () => {
    const result = await buildCaveatList(
      makeOpts({
        allow: ['nativeTokenTransferAmount'],
        maxAmount: '1.5',
      }),
      mockPublicClient,
      environment,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.enforcer).toBe(
      environment.caveatEnforcers.NativeTokenTransferAmountEnforcer,
    );
  });
});

describe('buildCaveatList – erc721Transfer', () => {
  it('produces a caveat with the ERC721Transfer enforcer', async () => {
    const result = await buildCaveatList(
      makeOpts({
        allow: ['erc721Transfer'],
        tokenAddress: TOKEN,
        tokenId: '42',
      }),
      mockPublicClient,
      environment,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.enforcer).toBe(
      environment.caveatEnforcers.ERC721TransferEnforcer,
    );
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
    expect(result[0]!.enforcer).toBe(
      environment.caveatEnforcers.NonceEnforcer,
    );
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
    expect(result[0]!.enforcer).toBe(
      environment.caveatEnforcers.IdEnforcer,
    );
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

describe('buildCaveatList – ownershipTransfer', () => {
  it('produces a caveat with the OwnershipTransfer enforcer', async () => {
    const result = await buildCaveatList(
      makeOpts({
        allow: ['ownershipTransfer'],
        contractAddress: CONTRACT,
      }),
      mockPublicClient,
      environment,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.enforcer).toBe(
      environment.caveatEnforcers.OwnershipTransferEnforcer,
    );
  });
});

describe('buildCaveatList – nativeTokenPeriodTransfer', () => {
  it('produces a caveat with provided startDate', async () => {
    const result = await buildCaveatList(
      makeOpts({
        allow: ['nativeTokenPeriodTransfer'],
        periodAmount: '1.5',
        periodDuration: 3600,
        startDate: 1700000000,
      }),
      mockPublicClient,
      environment,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.enforcer).toBe(
      environment.caveatEnforcers.NativeTokenPeriodTransferEnforcer,
    );
  });

  it('defaults startDate to current timestamp', async () => {
    const result = await buildCaveatList(
      makeOpts({
        allow: ['nativeTokenPeriodTransfer'],
        periodAmount: '1',
        periodDuration: 86400,
      }),
      mockPublicClient,
      environment,
    );

    expect(result).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Multiple caveats in one call
// ---------------------------------------------------------------------------

describe('buildCaveatList – multiple caveats', () => {
  it('produces one caveat per allow entry', async () => {
    const result = await buildCaveatList(
      makeOpts({
        allow: ['nativeTokenTransferAmount', 'limitedCalls', 'timestamp'],
        maxAmount: '1',
        limit: 3,
        afterTimestamp: 1700000000,
        beforeTimestamp: 0,
      }),
      mockPublicClient,
      environment,
    );

    expect(result).toHaveLength(3);
    expect(result[0]!.enforcer).toBe(environment.caveatEnforcers.NativeTokenTransferAmountEnforcer);
    expect(result[1]!.enforcer).toBe(environment.caveatEnforcers.LimitedCallsEnforcer);
    expect(result[2]!.enforcer).toBe(environment.caveatEnforcers.TimestampEnforcer);
  });
});
