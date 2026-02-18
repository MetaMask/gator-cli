import { describe, it, expect, vi } from 'vitest';
import {
  encodeFunctionData,
  erc20Abi,
  parseEther,
  parseUnits,
  type PublicClient,
} from 'viem';
import { buildExecution } from '../lib/executions.js';
import type { RedeemOptions } from '../types.js';

vi.mock('../lib/token.js', () => ({
  getTokenDecimals: vi.fn().mockResolvedValue(6),
}));

const FROM = '0xEC12d2450934E3c158129D0B387739506C789b07' as const;
const RECIPIENT = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as const;
const TOKEN = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;
const CONTRACT = '0x0000000000000000000000000000000000000001' as const;

const mockPublicClient = {} as PublicClient;

function makeOpts(overrides: Partial<RedeemOptions>): RedeemOptions {
  return { from: FROM, action: 'erc20Transfer', ...overrides };
}

// -------------------------------------------------------------------------
// Validation
// -------------------------------------------------------------------------

describe('buildExecution – validation', () => {
  it('throws for unknown action type', async () => {
    await expect(
      buildExecution(
        makeOpts({ action: 'unknownAction' as RedeemOptions['action'] }),
        FROM,
        mockPublicClient,
      ),
    ).rejects.toThrow('Unknown action type');
  });

  it('throws when erc20Transfer action is missing tokenAddress', async () => {
    await expect(
      buildExecution(
        makeOpts({ action: 'erc20Transfer', to: RECIPIENT, amount: '10' }),
        FROM,
        mockPublicClient,
      ),
    ).rejects.toThrow('--tokenAddress required');
  });

  it('throws when erc20Transfer action is missing to', async () => {
    await expect(
      buildExecution(
        makeOpts({
          action: 'erc20Transfer',
          tokenAddress: TOKEN,
          amount: '10',
        }),
        FROM,
        mockPublicClient,
      ),
    ).rejects.toThrow('--to required');
  });

  it('throws when erc20Transfer action is missing amount', async () => {
    await expect(
      buildExecution(
        makeOpts({
          action: 'erc20Transfer',
          tokenAddress: TOKEN,
          to: RECIPIENT,
        }),
        FROM,
        mockPublicClient,
      ),
    ).rejects.toThrow('--amount required');
  });

  it('throws when nativeTransfer action is missing to', async () => {
    await expect(
      buildExecution(
        makeOpts({ action: 'nativeTransfer', amount: '1' }),
        FROM,
        mockPublicClient,
      ),
    ).rejects.toThrow('--to required');
  });

  it('throws when nativeTransfer action is missing amount', async () => {
    await expect(
      buildExecution(
        makeOpts({ action: 'nativeTransfer', to: RECIPIENT }),
        FROM,
        mockPublicClient,
      ),
    ).rejects.toThrow('--amount required');
  });

  it('throws when functionCall is missing target', async () => {
    await expect(
      buildExecution(
        makeOpts({
          action: 'functionCall',
          function: 'approve(address,uint256)',
        }),
        FROM,
        mockPublicClient,
      ),
    ).rejects.toThrow('--target required');
  });

  it('throws when functionCall is missing function', async () => {
    await expect(
      buildExecution(
        makeOpts({ action: 'functionCall', target: TOKEN }),
        FROM,
        mockPublicClient,
      ),
    ).rejects.toThrow('--function required');
  });

  it('throws when ownershipTransfer is missing contractAddress', async () => {
    await expect(
      buildExecution(
        makeOpts({ action: 'ownershipTransfer', to: RECIPIENT }),
        FROM,
        mockPublicClient,
      ),
    ).rejects.toThrow('--contractAddress required');
  });

  it('throws when ownershipTransfer is missing to', async () => {
    await expect(
      buildExecution(
        makeOpts({ action: 'ownershipTransfer', contractAddress: CONTRACT }),
        FROM,
        mockPublicClient,
      ),
    ).rejects.toThrow('--to required');
  });

  it('throws when erc721Transfer is missing tokenAddress', async () => {
    await expect(
      buildExecution(
        makeOpts({ action: 'erc721Transfer', to: RECIPIENT, tokenId: '1' }),
        FROM,
        mockPublicClient,
      ),
    ).rejects.toThrow('--tokenAddress required');
  });

  it('throws when erc721Transfer is missing to', async () => {
    await expect(
      buildExecution(
        makeOpts({
          action: 'erc721Transfer',
          tokenAddress: TOKEN,
          tokenId: '1',
        }),
        FROM,
        mockPublicClient,
      ),
    ).rejects.toThrow('--to required');
  });

  it('throws when erc721Transfer is missing tokenId', async () => {
    await expect(
      buildExecution(
        makeOpts({
          action: 'erc721Transfer',
          tokenAddress: TOKEN,
          to: RECIPIENT,
        }),
        FROM,
        mockPublicClient,
      ),
    ).rejects.toThrow('--tokenId required');
  });

  it('throws when raw action is missing target', async () => {
    await expect(
      buildExecution(
        makeOpts({ action: 'raw', callData: '0x' }),
        FROM,
        mockPublicClient,
      ),
    ).rejects.toThrow('--target required');
  });

  it('throws when raw action is missing callData', async () => {
    await expect(
      buildExecution(
        makeOpts({ action: 'raw', target: TOKEN }),
        FROM,
        mockPublicClient,
      ),
    ).rejects.toThrow('--callData required');
  });
});

// -------------------------------------------------------------------------
// ERC-20 transfer
// -------------------------------------------------------------------------

describe('buildExecution – erc20Transfer', () => {
  it('encodes ERC-20 transfer with correct decimals', async () => {
    const result = await buildExecution(
      makeOpts({
        action: 'erc20Transfer',
        tokenAddress: TOKEN,
        to: RECIPIENT,
        amount: '10',
      }),
      FROM,
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

// -------------------------------------------------------------------------
// ERC-721 transfer
// -------------------------------------------------------------------------

describe('buildExecution – erc721Transfer', () => {
  it('encodes transferFrom with correct args', async () => {
    const result = await buildExecution(
      makeOpts({
        action: 'erc721Transfer',
        tokenAddress: TOKEN,
        to: RECIPIENT,
        tokenId: '42',
      }),
      FROM,
      mockPublicClient,
    );

    expect(result.target).toBe(TOKEN);
    expect(result.value).toBe(0n);
    // transferFrom selector: 0x23b872dd
    expect(result.callData.startsWith('0x23b872dd')).toBe(true);
  });
});

// -------------------------------------------------------------------------
// Native token transfer
// -------------------------------------------------------------------------

describe('buildExecution – nativeTransfer', () => {
  it('sets target to recipient with parsed value', async () => {
    const result = await buildExecution(
      makeOpts({
        action: 'nativeTransfer',
        to: RECIPIENT,
        amount: '1.5',
      }),
      FROM,
      mockPublicClient,
    );

    expect(result.target).toBe(RECIPIENT);
    expect(result.callData).toBe('0x');
    expect(result.value).toBe(parseEther('1.5'));
  });
});

// -------------------------------------------------------------------------
// Function call
// -------------------------------------------------------------------------

describe('buildExecution – functionCall', () => {
  it('encodes function call with args', async () => {
    const result = await buildExecution(
      makeOpts({
        action: 'functionCall',
        target: TOKEN,
        function: 'approve(address,uint256)',
        args: [RECIPIENT, '1000000'],
      }),
      FROM,
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
        action: 'functionCall',
        target: CONTRACT,
        function: 'pause()',
      }),
      FROM,
      mockPublicClient,
    );

    expect(result.target).toBe(CONTRACT);
    // Just the 4-byte selector
    expect(result.callData.length).toBe(10); // 0x + 8 hex chars
  });

  it('includes value when provided', async () => {
    const result = await buildExecution(
      makeOpts({
        action: 'functionCall',
        target: CONTRACT,
        function: 'deposit()',
        value: '2.0',
      }),
      FROM,
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
        action: 'ownershipTransfer',
        contractAddress: CONTRACT,
        to: RECIPIENT,
      }),
      FROM,
      mockPublicClient,
    );

    expect(result.target).toBe(CONTRACT);
    expect(result.value).toBe(0n);
    // transferOwnership selector: 0xf2fde38b
    expect(result.callData.startsWith('0xf2fde38b')).toBe(true);
  });
});

// -------------------------------------------------------------------------
// Raw mode
// -------------------------------------------------------------------------

describe('buildExecution – raw', () => {
  it('passes through target and callData', async () => {
    const result = await buildExecution(
      makeOpts({
        action: 'raw',
        target: CONTRACT,
        callData: '0xdeadbeef',
      }),
      FROM,
      mockPublicClient,
    );

    expect(result.target).toBe(CONTRACT);
    expect(result.callData).toBe('0xdeadbeef');
    expect(result.value).toBe(0n);
  });

  it('includes value when provided', async () => {
    const result = await buildExecution(
      makeOpts({
        action: 'raw',
        target: CONTRACT,
        callData: '0xdeadbeef',
        value: '1.0',
      }),
      FROM,
      mockPublicClient,
    );

    expect(result.value).toBe(parseEther('1.0'));
  });
});
