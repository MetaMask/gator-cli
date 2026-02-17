import type { Address } from 'viem';
import { erc20Abi, formatEther, formatUnits } from 'viem';
import { loadConfig } from '../lib/config.js';
import { getPublicClient } from '../lib/clients.js';
import { SUPPORTED_CHAINS, DEFAULT_CHAIN } from '../lib/constants.js';
import type { BalanceOptions } from '../types.js';

export async function balance(opts: BalanceOptions) {
  const config = loadConfig(opts.profile);
  const { address, chainId } = config.account;

  const chain =
    Object.values(SUPPORTED_CHAINS).find((c) => c.id === chainId) ??
    DEFAULT_CHAIN;

  const publicClient = getPublicClient(chain, config.rpcUrl);

  const nativeBalance = await publicClient.getBalance({ address });

  console.log('Account Balance');
  console.log(`  Address: ${address}`);
  console.log(`  Chain:   ${chain.name} (${chainId})`);
  console.log(
    `  Native:  ${formatEther(nativeBalance)} ${chain.nativeCurrency.symbol}`,
  );

  if (opts.tokenAddress) {
    const tokenAddress = opts.tokenAddress as Address;
    const [tokenBalance, decimals] = await Promise.all([
      publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'decimals',
      }),
    ]);

    console.log(`  Token:   ${tokenAddress}`);
    console.log(`  Balance: ${formatUnits(tokenBalance, decimals)}`);
  }
}
