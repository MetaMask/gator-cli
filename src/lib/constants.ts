import { homedir } from 'node:os';
import { join } from 'node:path';
import { base, baseSepolia, sepolia } from 'viem/chains';
import type { Chain } from 'viem';

export const SUPPORTED_CHAINS: Record<string, Chain> = {
  base,
  baseSepolia,
  sepolia,
};

export const DEFAULT_CHAIN = base;
export const DEFAULT_CHAIN_NAME = 'base';

export const DEFAULT_RPC: Record<number, string> = {
  [base.id]: 'https://mainnet.base.org',
  [baseSepolia.id]: 'https://sepolia.base.org',
  [sepolia.id]: 'https://rpc.sepolia.org',
};

export const CONFIG_DIR = join(homedir(), '.gator-cli');
export const CONFIG_FILE = join(CONFIG_DIR, 'permissions.json');
