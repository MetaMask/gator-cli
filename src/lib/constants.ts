import { base, sepolia } from "viem/chains";
import type { Chain } from "viem";

export const SUPPORTED_CHAINS: Record<string, Chain> = {
  base,
  sepolia,
};

export const DEFAULT_CHAIN = base;
export const DEFAULT_CHAIN_NAME = "base";

export const DEFAULT_RPC: Record<number, string> = {
  [base.id]: "https://mainnet.base.org",
  [sepolia.id]: "https://rpc.sepolia.org",
};

export const CONFIG_FILE = "permissions.json";
