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
  bundlerUrl: string;
}

export interface GrantOptions {
  delegate: Address;
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

export interface RedeemScopeOptions {
  delegator: Address;
  scope: string;
  // ERC-20 / ERC-721 transfers
  tokenAddress?: Address;
  to?: Address;
  amount?: string;
  tokenId?: string;
  // Function call scope
  target?: Address;
  function?: string;
  args?: string[];
  value?: string;
  // Ownership transfer
  contractAddress?: Address;
}

export interface RedeemRawOptions {
  delegator: Address;
  target: Address;
  callData: Hex;
  value?: string;
}

export type RedeemOptions = RedeemScopeOptions | RedeemRawOptions;

export interface RevokeOptions {
  delegate: Address;
}

export interface InspectOptions {
  delegator?: Address;
  delegate?: Address;
}

export interface CreateOptions {
  chain?: string;
}
