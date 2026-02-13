import {
  createPublicClient,
  createWalletClient,
  http,
  type Chain,
  type PublicClient,
  type WalletClient,
  type Transport,
  type Account,
} from "viem";
import { createBundlerClient } from "viem/account-abstraction";
import type { PermissionsConfig } from "../types.js";
import { DEFAULT_RPC } from "./constants.js";

export function getPublicClient(chain: Chain): PublicClient {
  const rpcUrl = DEFAULT_RPC[chain.id] ?? chain.rpcUrls.default.http[0];
  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}

export function getWalletClient(
  account: Account,
  chain: Chain,
): WalletClient<Transport, Chain, Account> {
  const rpcUrl = DEFAULT_RPC[chain.id] ?? chain.rpcUrls.default.http[0];
  return createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  }) as WalletClient<Transport, Chain, Account>;
}

export function getBundlerClient(config: PermissionsConfig, chain: Chain) {
  const publicClient = getPublicClient(chain);
  return createBundlerClient({
    client: publicClient,
    transport: http(config.bundlerUrl),
  });
}
