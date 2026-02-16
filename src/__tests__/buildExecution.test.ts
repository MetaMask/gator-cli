import { describe, it, expect, vi } from 'vitest';
import {
  encodeFunctionData,
  erc20Abi,
  parseEther,
  parseUnits,
  type PublicClient,
} from 'viem';
import { buildExecution } from '../lib/executions.js';
import type { RedeemScopeOptions } from '../types.js';

vi.mock('../lib/token.js', () => ({
  getTokenDecimals: vi.fn().mockResolvedValue(6),
}));

const DELEGATOR = '0xEC12d2450934E3c158129D0B387739506C789b07' as const;
const RECIPIENT = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as const;
const TOKEN = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;
const CONTRACT = '0x0000000000000000000000000000000000000001' as const;

const mockPublicClient = {} as PublicClient;

function makeOpts(overrides: Partial<RedeemScopeOptions>): RedeemScopeOptions {
  return { delegator: DELEGATOR, scope: 'erc20TransferAmount', ...overrides };
}

// -------------------------------------------------------------------------
// Validation
// -------------------------------------------------------------------------

describe('buildExecution – validation', () => {
  it('throws for unknown scope type', async () => {
    await expect(
      buildExecution(
        makeOpts({ scope: 'unknownScope' }),
        DELEGATOR,
        mockPublicClient,
      ),
    ).rejects.toThrow('Unknown scope type');
  });

  it('throws when erc20TransferAmount scope is missing tokenAddress', async () => {
    await expect(
      buildExecution(
        makeOpts({ scope: 'erc20TransferAmount', to: RECIPIENT, amount: '10' }),
        DELEGATOR,
        mockPublicClient,
      ),
    ).rejects.toThrow('--tokenAddress required');
  });

  it('throws when erc20TransferAmount scope is missing to', async () => {
    await expect(
      buildExecution(
        makeOpts({
          scope: 'erc20TransferAmount',
          tokenAddress: TOKEN,
          amount: '10',
        }),
        DELEGATOR,
        mockPublicClient,
      ),
    ).rejects.toThrow('--to required');
  });

  it('throws when erc20TransferAmount scope is missing amount', async () => {
    await expect(
      buildExecution(
        makeOpts({
          scope: 'erc20TransferAmount',
          tokenAddress: TOKEN,
          to: RECIPIENT,
        }),
        DELEGATOR,
        mockPublicClient,
      ),
    ).rejects.toThrow('--amount required');
  });

  it('throws when nativeTokenTransferAmount scope is missing to', async () => {
    await expect(
      buildExecution(
        makeOpts({ scope: 'nativeTokenTransferAmount', amount: '1' }),
        DELEGATOR,
        mockPublicClient,
      ),
    ).rejects.toThrow('--to required');
  });

  it('throws when nativeTokenTransferAmount scope is missing amount', async () => {
    await expect(
      buildExecution(
        makeOpts({ scope: 'nativeTokenTransferAmount', to: RECIPIENT }),
        DELEGATOR,
        mockPublicClient,
      ),
    ).rejects.toThrow('--amount required');
  });

  it('throws when erc721Transfer is missing tokenAddress', async () => {
    await expect(
      buildExecution(
        makeOpts({ scope: 'erc721Transfer', to: RECIPIENT, tokenId: '1' }),
        DELEGATOR,
        mockPublicClient,
      ),
    ).rejects.toThrow('--tokenAddress required');
  });

  it('throws when erc721Transfer is missing to', async () => {
    await expect(
      buildExecution(
        makeOpts({
          scope: 'erc721Transfer',
          tokenAddress: TOKEN,
          tokenId: '1',
        }),
        DELEGATOR,
        mockPublicClient,
      ),
    ).rejects.toThrow('--to required');
  });

  it('throws when erc721Transfer is missing tokenId', async () => {
    await expect(
      buildExecution(
        makeOpts({
          scope: 'erc721Transfer',
          tokenAddress: TOKEN,
          to: RECIPIENT,
        }),
        DELEGATOR,
        mockPublicClient,
      ),
    ).rejects.toThrow('--tokenId required');
  });

  it('throws when functionCall is missing target', async () => {
    await expect(
      buildExecution(
        makeOpts({
          scope: 'functionCall',
          function: 'approve(address,uint256)',
        }),
        DELEGATOR,
        mockPublicClient,
      ),
    ).rejects.toThrow('--target required');
  });

  it('throws when functionCall is missing function', async () => {
    await expect(
      buildExecution(
        makeOpts({ scope: 'functionCall', target: TOKEN }),
        DELEGATOR,
        mockPublicClient,
      ),
    ).rejects.toThrow('--function required');
  });

  it('throws when ownershipTransfer is missing contractAddress', async () => {
    await expect(
      buildExecution(
        makeOpts({ scope: 'ownershipTransfer', to: RECIPIENT }),
        DELEGATOR,
        mockPublicClient,
      ),
    ).rejects.toThrow('--contractAddress required');
  });

  it('throws when ownershipTransfer is missing to', async () => {
    await expect(
      buildExecution(
        makeOpts({ scope: 'ownershipTransfer', contractAddress: CONTRACT }),
        DELEGATOR,
        mockPublicClient,
      ),
    ).rejects.toThrow('--to required');
  });
});

// -------------------------------------------------------------------------
// ERC-20 transfers (mocked decimals = 6)
// -------------------------------------------------------------------------

describe('buildExecution – erc20TransferAmount', () => {
  it('encodes ERC-20 transfer with correct decimals', async () => {
    const result = await buildExecution(
      makeOpts({
        scope: 'erc20TransferAmount',
        tokenAddress: TOKEN,
        to: RECIPIENT,
        amount: '10',
      }),
      DELEGATOR,
      mockPublicClient,
    );

    const expectedCallData = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [RECIPIENT, parseUnits('10', 6)],
    });

    expect(result.target).toBe(TOKEN);
    expect(result.callData).toBe(expectedCallData);
    expect(result.value).toBe(0n);
  });
});

describe('buildExecution – erc20PeriodTransfer', () => {
  it('encodes same as erc20TransferAmount', async () => {
    const result = await buildExecution(
      makeOpts({
        scope: 'erc20PeriodTransfer',
        tokenAddress: TOKEN,
        to: RECIPIENT,
        amount: '5',
      }),
      DELEGATOR,
      mockPublicClient,
    );

    expect(result.target).toBe(TOKEN);
    expect(result.value).toBe(0n);
  });
});

// -------------------------------------------------------------------------
// Native token transfers
// -------------------------------------------------------------------------

describe('buildExecution – nativeTokenTransferAmount', () => {
  it('sets target to recipient with parsed value', async () => {
    const result = await buildExecution(
      makeOpts({
        scope: 'nativeTokenTransferAmount',
        to: RECIPIENT,
        amount: '1.5',
      }),
      DELEGATOR,
      mockPublicClient,
    );

    expect(result.target).toBe(RECIPIENT);
    expect(result.callData).toBe('0x');
    expect(result.value).toBe(parseEther('1.5'));
  });
});

describe('buildExecution – nativeTokenPeriodTransfer', () => {
  it('encodes same as nativeTokenTransferAmount', async () => {
    const result = await buildExecution(
      makeOpts({
        scope: 'nativeTokenPeriodTransfer',
        to: RECIPIENT,
        amount: '0.1',
      }),
      DELEGATOR,
      mockPublicClient,
    );

    expect(result.target).toBe(RECIPIENT);
    expect(result.callData).toBe('0x');
    expect(result.value).toBe(parseEther('0.1'));
  });
});

// -------------------------------------------------------------------------
// ERC-721 transfer
// -------------------------------------------------------------------------

describe('buildExecution – erc721Transfer', () => {
  it('encodes transferFrom with correct args', async () => {
    const result = await buildExecution(
      makeOpts({
        scope: 'erc721Transfer',
        tokenAddress: TOKEN,
        to: RECIPIENT,
        tokenId: '42',
      }),
      DELEGATOR,
      mockPublicClient,
    );

    expect(result.target).toBe(TOKEN);
    expect(result.value).toBe(0n);
    // callData should contain transferFrom selector (0x23b872dd)
    expect(result.callData.startsWith('0x23b872dd')).toBe(true);
  });
});

// -------------------------------------------------------------------------
// Function call
// -------------------------------------------------------------------------

describe('buildExecution – functionCall', () => {
  it('encodes function call with args', async () => {
    const result = await buildExecution(
      makeOpts({
        scope: 'functionCall',
        target: TOKEN,
        function: 'approve(address,uint256)',
        args: [RECIPIENT, '1000000'],
      }),
      DELEGATOR,
      mockPublicClient,
    );

    expect(result.target).toBe(TOKEN);
    expect(result.value).toBe(0n);
    // approve selector: 0x095ea7b3
    expect(result.callData.startsWith('0x095ea7b3')).toBe(true);
  });

  it('encodes function call without args', async () => {
    const result = await buildExecution(
      makeOpts({
        scope: 'functionCall',
        target: CONTRACT,
        function: 'pause()',
      }),
      DELEGATOR,
      mockPublicClient,
    );

    expect(result.target).toBe(CONTRACT);
    // Just the 4-byte selector
    expect(result.callData.length).toBe(10); // 0x + 8 hex chars
  });

  it('includes value when provided', async () => {
    const result = await buildExecution(
      makeOpts({
        scope: 'functionCall',
        target: CONTRACT,
        function: 'deposit()',
        value: '2.0',
      }),
      DELEGATOR,
      mockPublicClient,
    );

    expect(result.value).toBe(parseEther('2.0'));
  });
});

// -------------------------------------------------------------------------
// Ownership transfer
// -------------------------------------------------------------------------

describe('buildExecution – ownershipTransfer', () => {
  it('encodes transferOwnership call', async () => {
    const result = await buildExecution(
      makeOpts({
        scope: 'ownershipTransfer',
        contractAddress: CONTRACT,
        to: RECIPIENT,
      }),
      DELEGATOR,
      mockPublicClient,
    );

    expect(result.target).toBe(CONTRACT);
    expect(result.value).toBe(0n);
    // transferOwnership selector: 0xf2fde38b
    expect(result.callData.startsWith('0xf2fde38b')).toBe(true);
  });
});
