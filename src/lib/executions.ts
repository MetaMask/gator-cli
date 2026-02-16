import {
  encodeFunctionData,
  erc20Abi,
  erc721Abi,
  parseEther,
  parseUnits,
  toFunctionSelector,
  encodeAbiParameters,
  concat,
  type Address,
  type Hex,
  type PublicClient,
  type AbiParameter,
} from 'viem';
import { getTokenDecimals } from './token.js';
import type { RedeemScopeOptions } from '../types.js';

// From https://github.com/OpenZeppelin/openzeppelin-contracts/blob/8ff78ffb6e78463f070eab59487b4ba30481b53c/contracts/access/Ownable.sol#L84
const OWNABLE_ABI = [
  {
    type: 'function',
    name: 'transferOwnership',
    inputs: [{ name: 'newOwner', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

function extractParamTypes(sig: string): AbiParameter[] {
  const match = sig.match(/\(([^)]*)\)/);
  if (!match || !match[1]) return [];
  return match[1]
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((type) => ({ type }) as AbiParameter);
}

export interface ExecutionResult {
  target: Address;
  callData: Hex;
  value: bigint;
}

export async function buildExecution(
  opts: RedeemScopeOptions,
  delegator: Address,
  publicClient: PublicClient,
): Promise<ExecutionResult> {
  switch (opts.scope) {
    case 'erc20Transfer': {
      if (!opts.tokenAddress) throw new Error('--tokenAddress required');
      if (!opts.to) throw new Error('--to required');
      if (!opts.amount) throw new Error('--amount required');

      const decimals = await getTokenDecimals(publicClient, opts.tokenAddress);
      const parsedAmount = parseUnits(opts.amount, decimals);

      return {
        target: opts.tokenAddress,
        callData: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'transfer',
          args: [opts.to, parsedAmount],
        }),
        value: 0n,
      };
    }

    case 'erc721Transfer': {
      if (!opts.tokenAddress) throw new Error('--tokenAddress required');
      if (!opts.to) throw new Error('--to required');
      if (!opts.tokenId) throw new Error('--tokenId required');

      return {
        target: opts.tokenAddress,
        callData: encodeFunctionData({
          abi: erc721Abi,
          functionName: 'transferFrom',
          args: [delegator, opts.to, BigInt(opts.tokenId)],
        }),
        value: 0n,
      };
    }

    case 'nativeTransfer': {
      if (!opts.to) throw new Error('--to required');
      if (!opts.amount) throw new Error('--amount required');

      return {
        target: opts.to,
        callData: '0x',
        value: parseEther(opts.amount),
      };
    }

    case 'functionCall': {
      if (!opts.target) throw new Error('--target required');
      if (!opts.function) throw new Error('--function required');

      const fnSig = opts.function;
      const selector = toFunctionSelector(`function ${fnSig}`);

      const paramTypes = extractParamTypes(fnSig);
      let callData: Hex;

      if (paramTypes.length === 0 || !opts.args?.length) {
        callData = selector;
      } else {
        const args = opts.args.map((arg, i) => {
          const pType = paramTypes[i]!.type;
          if (pType?.startsWith('uint') || pType?.startsWith('int')) {
            return BigInt(arg);
          }
          if (pType === 'bool') return arg === 'true';
          return arg;
        });

        const encoded = encodeAbiParameters(paramTypes, args);
        callData = concat([selector, encoded]);
      }

      return {
        target: opts.target,
        callData,
        value: opts.value ? parseEther(opts.value) : 0n,
      };
    }

    case 'ownershipTransfer': {
      if (!opts.contractAddress) throw new Error('--contractAddress required');
      if (!opts.to) throw new Error('--to required');

      return {
        target: opts.contractAddress,
        callData: encodeFunctionData({
          abi: OWNABLE_ABI,
          functionName: 'transferOwnership',
          args: [opts.to],
        }),
        value: 0n,
      };
    }

    default:
      throw new Error(`Unknown scope type: ${opts.scope}`);
  }
}
