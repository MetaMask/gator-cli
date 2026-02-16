import {
  createPublicClient,
  createWalletClient,
  http,
  type Chain,
  type PublicClient,
  type WalletClient,
  type Transport,
  type Account,
} from 'viem';
import { DEFAULT_RPC } from './constants.js';

function getRpcUrl(chain: Chain, rpcUrl?: string): string {
  return rpcUrl || DEFAULT_RPC[chain.id] || chain.rpcUrls.default.http[0]!;
}

export function getPublicClient(chain: Chain, rpcUrl?: string): PublicClient {
  return createPublicClient({
    chain,
    transport: http(getRpcUrl(chain, rpcUrl)),
  });
}

export function getWalletClient(
  account: Account,
  chain: Chain,
  rpcUrl?: string,
): WalletClient<Transport, Chain, Account> {
  return createWalletClient({
    account,
    chain,
    transport: http(getRpcUrl(chain, rpcUrl)),
  }) as WalletClient<Transport, Chain, Account>;
}
