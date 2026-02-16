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
import { loadConfig } from './config.js';
import { DEFAULT_RPC } from './constants.js';

function getRpcUrl(chain: Chain): string {
  const config = loadConfig();
  return config.rpcUrl ?? DEFAULT_RPC[chain.id] ?? chain.rpcUrls.default.http[0]!;
}

export function getPublicClient(chain: Chain): PublicClient {
  return createPublicClient({
    chain,
    transport: http(getRpcUrl(chain)),
  });
}

export function getWalletClient(
  account: Account,
  chain: Chain,
): WalletClient<Transport, Chain, Account> {
  return createWalletClient({
    account,
    chain,
    transport: http(getRpcUrl(chain)),
  }) as WalletClient<Transport, Chain, Account>;
}
