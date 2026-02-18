import type { Address, Hex } from 'viem';

export interface AccountConfig {
  address: Address;
  privateKey: Hex;
  upgraded: boolean;
  chainId: number;
  upgradeTxHash?: Hex;
}

export interface DelegationStorageConfig {
  apiKey: string;
  apiKeyId: string;
}

export interface PermissionsConfig {
  version: number;
  account: AccountConfig;
  delegationStorage: DelegationStorageConfig;
  rpcUrl?: string;
}

export interface ProfileOptions {
  profile?: string;
}

export interface GrantOptions extends ProfileOptions {
  to: Address;
  scope: string;
  // Token scopes
  tokenAddress?: Address;
  maxAmount?: string;
  tokenId?: string;
  // Periodic scopes
  periodAmount?: string;
  periodDuration?: number;
  startDate?: number;
  // Streaming scopes
  amountPerSecond?: string;
  initialAmount?: string;
  startTime?: number;
  // Function call scope
  targets?: string[];
  selectors?: string[];
  valueLte?: string;
  // Ownership transfer
  contractAddress?: Address;
}

export type RedeemAction =
  | 'erc20Transfer'
  | 'erc721Transfer'
  | 'nativeTransfer'
  | 'functionCall'
  | 'ownershipTransfer'
  | 'raw';

export interface RedeemOptions extends ProfileOptions {
  from: Address;
  action: RedeemAction;
  // ERC-20 / ERC-721 transfers
  tokenAddress?: Address;
  to?: Address;
  amount?: string;
  tokenId?: string;
  // Function call
  target?: Address;
  function?: string;
  args?: string[];
  value?: string;
  // Ownership transfer
  contractAddress?: Address;
  // Raw mode
  callData?: Hex;
}

export interface RevokeOptions extends ProfileOptions {
  to: Address;
}

export interface InspectOptions extends ProfileOptions {
  from?: Address;
  to?: Address;
}

export interface CreateOptions extends ProfileOptions {
  chain?: string;
}

export interface BalanceOptions extends ProfileOptions {
  tokenAddress?: Address;
}
