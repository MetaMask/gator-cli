import {
  parseUnits,
  parseEther,
  type Address,
  type Hex,
  type PublicClient,
} from 'viem';
import {
  type SmartAccountsEnvironment,
  type Caveat,
  BalanceChangeType,
} from '@metamask/smart-accounts-kit';
import { createCaveatBuilder } from '@metamask/smart-accounts-kit/utils';
import { getTokenDecimals } from './token.js';
import type { GrantOptions } from '../types.js';

function parseBalanceChangeType(value: string): BalanceChangeType {
  if (value === 'increase') return BalanceChangeType.Increase;
  if (value === 'decrease') return BalanceChangeType.Decrease;
  throw new Error(
    `Invalid balance change type "${value}". Use "increase" or "decrease".`,
  );
}

export async function buildCaveatList(
  opts: GrantOptions,
  publicClient: PublicClient,
  environment: SmartAccountsEnvironment,
): Promise<Caveat[]> {
  if (!opts.allow?.length) {
    throw new Error('At least one --allow <type> is required');
  }

  const builder = createCaveatBuilder(environment);
  const now = Math.floor(Date.now() / 1000);

  for (const caveatType of opts.allow) {
    switch (caveatType) {
      case 'erc20TransferAmount': {
        if (!opts.tokenAddress) throw new Error('--tokenAddress required for erc20TransferAmount');
        if (!opts.maxAmount) throw new Error('--maxAmount required for erc20TransferAmount');
        const decimals = await getTokenDecimals(publicClient, opts.tokenAddress);
        builder.addCaveat('erc20TransferAmount', {
          tokenAddress: opts.tokenAddress,
          maxAmount: parseUnits(opts.maxAmount, decimals),
        });
        break;
      }

      case 'erc20PeriodTransfer': {
        if (!opts.tokenAddress) throw new Error('--tokenAddress required for erc20PeriodTransfer');
        if (!opts.periodAmount) throw new Error('--periodAmount required for erc20PeriodTransfer');
        if (opts.periodDuration == null) throw new Error('--periodDuration required for erc20PeriodTransfer');
        const decimals = await getTokenDecimals(publicClient, opts.tokenAddress);
        builder.addCaveat('erc20PeriodTransfer', {
          tokenAddress: opts.tokenAddress,
          periodAmount: parseUnits(opts.periodAmount, decimals),
          periodDuration: opts.periodDuration,
          startDate: opts.startDate ?? now,
        });
        break;
      }

      case 'erc20Streaming': {
        if (!opts.tokenAddress) throw new Error('--tokenAddress required for erc20Streaming');
        if (!opts.amountPerSecond) throw new Error('--amountPerSecond required for erc20Streaming');
        if (!opts.initialAmount) throw new Error('--initialAmount required for erc20Streaming');
        if (!opts.maxAmount) throw new Error('--maxAmount required for erc20Streaming');
        const decimals = await getTokenDecimals(publicClient, opts.tokenAddress);
        builder.addCaveat('erc20Streaming', {
          tokenAddress: opts.tokenAddress,
          amountPerSecond: parseUnits(opts.amountPerSecond, decimals),
          initialAmount: parseUnits(opts.initialAmount, decimals),
          maxAmount: parseUnits(opts.maxAmount, decimals),
          startTime: opts.startTime ?? now,
        });
        break;
      }

      case 'erc721Transfer': {
        if (!opts.tokenAddress) throw new Error('--tokenAddress required for erc721Transfer');
        if (!opts.tokenId) throw new Error('--tokenId required for erc721Transfer');
        builder.addCaveat('erc721Transfer', {
          tokenAddress: opts.tokenAddress,
          tokenId: BigInt(opts.tokenId),
        });
        break;
      }

      case 'nativeTokenTransferAmount': {
        if (!opts.maxAmount) throw new Error('--maxAmount required for nativeTokenTransferAmount');
        builder.addCaveat('nativeTokenTransferAmount', {
          maxAmount: parseEther(opts.maxAmount),
        });
        break;
      }

      case 'nativeTokenPeriodTransfer': {
        if (!opts.periodAmount) throw new Error('--periodAmount required for nativeTokenPeriodTransfer');
        if (opts.periodDuration == null) throw new Error('--periodDuration required for nativeTokenPeriodTransfer');
        builder.addCaveat('nativeTokenPeriodTransfer', {
          periodAmount: parseEther(opts.periodAmount),
          periodDuration: opts.periodDuration,
          startDate: opts.startDate ?? now,
        });
        break;
      }

      case 'nativeTokenStreaming': {
        if (!opts.amountPerSecond) throw new Error('--amountPerSecond required for nativeTokenStreaming');
        if (!opts.initialAmount) throw new Error('--initialAmount required for nativeTokenStreaming');
        if (!opts.maxAmount) throw new Error('--maxAmount required for nativeTokenStreaming');
        builder.addCaveat('nativeTokenStreaming', {
          amountPerSecond: parseEther(opts.amountPerSecond),
          initialAmount: parseEther(opts.initialAmount),
          maxAmount: parseEther(opts.maxAmount),
          startTime: opts.startTime ?? now,
        });
        break;
      }

      case 'ownershipTransfer': {
        if (!opts.contractAddress) throw new Error('--contractAddress required for ownershipTransfer');
        builder.addCaveat('ownershipTransfer', {
          contractAddress: opts.contractAddress,
        });
        break;
      }

      case 'limitedCalls': {
        if (opts.limit == null) throw new Error('--limit required for limitedCalls');
        builder.addCaveat('limitedCalls', { limit: opts.limit });
        break;
      }

      case 'timestamp': {
        builder.addCaveat('timestamp', {
          afterThreshold: opts.afterTimestamp ?? 0,
          beforeThreshold: opts.beforeTimestamp ?? 0,
        });
        break;
      }

      case 'blockNumber': {
        builder.addCaveat('blockNumber', {
          afterThreshold: BigInt(opts.afterBlock ?? '0'),
          beforeThreshold: BigInt(opts.beforeBlock ?? '0'),
        });
        break;
      }

      case 'redeemer': {
        if (!opts.redeemers?.length) throw new Error('--redeemers required for redeemer');
        builder.addCaveat('redeemer', {
          redeemers: opts.redeemers as Address[],
        });
        break;
      }

      case 'nonce': {
        if (!opts.nonce) throw new Error('--nonce required for nonce');
        builder.addCaveat('nonce', { nonce: opts.nonce });
        break;
      }

      case 'id': {
        if (opts.caveatId == null) throw new Error('--caveatId required for id');
        builder.addCaveat('id', { id: BigInt(opts.caveatId) });
        break;
      }

      case 'valueLte': {
        if (!opts.maxValue) throw new Error('--maxValue required for valueLte');
        builder.addCaveat('valueLte', {
          maxValue: parseEther(opts.maxValue),
        });
        break;
      }

      case 'allowedTargets': {
        if (!opts.allowedTargets?.length) throw new Error('--allowedTargets required for allowedTargets');
        builder.addCaveat('allowedTargets', {
          targets: opts.allowedTargets as Address[],
        });
        break;
      }

      case 'allowedMethods': {
        if (!opts.allowedMethods?.length) throw new Error('--allowedMethods required for allowedMethods');
        builder.addCaveat('allowedMethods', {
          selectors: opts.allowedMethods,
        });
        break;
      }

      case 'allowedCalldata': {
        if (opts.calldataStartIndex == null) throw new Error('--calldataStartIndex required for allowedCalldata');
        if (!opts.calldataValue) throw new Error('--calldataValue required for allowedCalldata');
        builder.addCaveat('allowedCalldata', {
          startIndex: opts.calldataStartIndex,
          value: opts.calldataValue,
        });
        break;
      }

      case 'argsEqualityCheck': {
        if (!opts.argsCheck) throw new Error('--argsCheck required for argsEqualityCheck');
        builder.addCaveat('argsEqualityCheck', { args: opts.argsCheck });
        break;
      }

      case 'exactCalldata': {
        if (!opts.exactCalldata) throw new Error('--exactCalldata required for exactCalldata');
        builder.addCaveat('exactCalldata', { calldata: opts.exactCalldata });
        break;
      }

      case 'nativeTokenPayment': {
        if (!opts.paymentRecipient) throw new Error('--paymentRecipient required for nativeTokenPayment');
        if (!opts.paymentAmount) throw new Error('--paymentAmount required for nativeTokenPayment');
        builder.addCaveat('nativeTokenPayment', {
          recipient: opts.paymentRecipient,
          amount: parseEther(opts.paymentAmount),
        });
        break;
      }

      case 'nativeBalanceChange': {
        if (!opts.nativeBalanceRecipient) throw new Error('--nativeBalanceRecipient required for nativeBalanceChange');
        if (!opts.nativeBalanceAmount) throw new Error('--nativeBalanceAmount required for nativeBalanceChange');
        if (!opts.nativeBalanceChangeType) throw new Error('--nativeBalanceChangeType required for nativeBalanceChange');
        builder.addCaveat('nativeBalanceChange', {
          recipient: opts.nativeBalanceRecipient,
          balance: parseEther(opts.nativeBalanceAmount),
          changeType: parseBalanceChangeType(opts.nativeBalanceChangeType),
        });
        break;
      }

      case 'erc20BalanceChange': {
        if (!opts.erc20BalanceToken) throw new Error('--erc20BalanceToken required for erc20BalanceChange');
        if (!opts.erc20BalanceRecipient) throw new Error('--erc20BalanceRecipient required for erc20BalanceChange');
        if (!opts.erc20BalanceAmount) throw new Error('--erc20BalanceAmount required for erc20BalanceChange');
        if (!opts.erc20BalanceChangeType) throw new Error('--erc20BalanceChangeType required for erc20BalanceChange');
        builder.addCaveat('erc20BalanceChange', {
          tokenAddress: opts.erc20BalanceToken,
          recipient: opts.erc20BalanceRecipient,
          balance: BigInt(opts.erc20BalanceAmount),
          changeType: parseBalanceChangeType(opts.erc20BalanceChangeType),
        });
        break;
      }

      case 'erc721BalanceChange': {
        if (!opts.erc721BalanceToken) throw new Error('--erc721BalanceToken required for erc721BalanceChange');
        if (!opts.erc721BalanceRecipient) throw new Error('--erc721BalanceRecipient required for erc721BalanceChange');
        if (!opts.erc721BalanceAmount) throw new Error('--erc721BalanceAmount required for erc721BalanceChange');
        if (!opts.erc721BalanceChangeType) throw new Error('--erc721BalanceChangeType required for erc721BalanceChange');
        builder.addCaveat('erc721BalanceChange', {
          tokenAddress: opts.erc721BalanceToken,
          recipient: opts.erc721BalanceRecipient,
          amount: BigInt(opts.erc721BalanceAmount),
          changeType: parseBalanceChangeType(opts.erc721BalanceChangeType),
        });
        break;
      }

      case 'erc1155BalanceChange': {
        if (!opts.erc1155BalanceToken) throw new Error('--erc1155BalanceToken required for erc1155BalanceChange');
        if (!opts.erc1155BalanceRecipient) throw new Error('--erc1155BalanceRecipient required for erc1155BalanceChange');
        if (!opts.erc1155BalanceTokenId) throw new Error('--erc1155BalanceTokenId required for erc1155BalanceChange');
        if (!opts.erc1155BalanceAmount) throw new Error('--erc1155BalanceAmount required for erc1155BalanceChange');
        if (!opts.erc1155BalanceChangeType) throw new Error('--erc1155BalanceChangeType required for erc1155BalanceChange');
        builder.addCaveat('erc1155BalanceChange', {
          tokenAddress: opts.erc1155BalanceToken,
          recipient: opts.erc1155BalanceRecipient,
          tokenId: BigInt(opts.erc1155BalanceTokenId),
          balance: BigInt(opts.erc1155BalanceAmount),
          changeType: parseBalanceChangeType(opts.erc1155BalanceChangeType),
        });
        break;
      }

      case 'deployed': {
        if (!opts.deployAddress) throw new Error('--deployAddress required for deployed');
        if (!opts.deploySalt) throw new Error('--deploySalt required for deployed');
        if (!opts.deployBytecode) throw new Error('--deployBytecode required for deployed');
        builder.addCaveat('deployed', {
          contractAddress: opts.deployAddress,
          salt: opts.deploySalt,
          bytecode: opts.deployBytecode,
        });
        break;
      }

      case 'exactExecution': {
        if (!opts.execTarget) throw new Error('--execTarget required for exactExecution');
        builder.addCaveat('exactExecution', {
          execution: {
            target: opts.execTarget,
            value: opts.execValue ? parseEther(opts.execValue) : 0n,
            callData: opts.execCalldata ?? '0x',
          },
        });
        break;
      }

      default:
        throw new Error(`Unknown caveat type: ${caveatType}`);
    }
  }

  return builder.build();
}
