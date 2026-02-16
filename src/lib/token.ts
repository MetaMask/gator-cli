import { erc20Abi, type Address, type PublicClient } from 'viem';

export async function getTokenDecimals(
  publicClient: PublicClient,
  tokenAddress: Address,
): Promise<number> {
  const decimals = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'decimals',
  });
  return decimals;
}

export async function getTokenSymbol(
  publicClient: PublicClient,
  tokenAddress: Address,
): Promise<string> {
  const symbol = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'symbol',
  });
  return symbol;
}
