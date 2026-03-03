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
  allow: string[];
  // Token caveats (erc20TransferAmount, erc20PeriodTransfer, erc20Streaming, erc721Transfer)
  tokenAddress?: Address;
  maxAmount?: string;
  tokenId?: string;
  // Periodic caveats (erc20PeriodTransfer, nativeTokenPeriodTransfer)
  periodAmount?: string;
  periodDuration?: number;
  startDate?: number;
  // Streaming caveats (erc20Streaming, nativeTokenStreaming)
  amountPerSecond?: string;
  initialAmount?: string;
  startTime?: number;
  // Ownership transfer
  contractAddress?: Address;
  // limitedCalls
  limit?: number;
  // timestamp
  afterTimestamp?: number;
  beforeTimestamp?: number;
  // blockNumber
  afterBlock?: string;
  beforeBlock?: string;
  // redeemer
  redeemers?: string[];
  // nonce
  nonce?: Hex;
  // id
  caveatId?: string;
  // valueLte
  maxValue?: string;
  // allowedTargets
  allowedTargets?: string[];
  // allowedMethods
  allowedMethods?: string[];
  // allowedCalldata
  calldataStartIndex?: number;
  calldataValue?: Hex;
  // argsEqualityCheck
  argsCheck?: Hex;
  // exactCalldata
  exactCalldata?: Hex;
  // nativeTokenPayment
  paymentRecipient?: Address;
  paymentAmount?: string;
  // nativeBalanceChange
  nativeBalanceRecipient?: Address;
  nativeBalanceAmount?: string;
  nativeBalanceChangeType?: string;
  // erc20BalanceChange
  erc20BalanceToken?: Address;
  erc20BalanceRecipient?: Address;
  erc20BalanceAmount?: string;
  erc20BalanceChangeType?: string;
  // erc721BalanceChange
  erc721BalanceToken?: Address;
  erc721BalanceRecipient?: Address;
  erc721BalanceAmount?: string;
  erc721BalanceChangeType?: string;
  // erc1155BalanceChange
  erc1155BalanceToken?: Address;
  erc1155BalanceRecipient?: Address;
  erc1155BalanceTokenId?: string;
  erc1155BalanceAmount?: string;
  erc1155BalanceChangeType?: string;
  // deployed
  deployAddress?: Address;
  deploySalt?: Hex;
  deployBytecode?: Hex;
  // exactExecution
  execTarget?: Address;
  execValue?: string;
  execCalldata?: Hex;
  // custom caveat enforcer
  enforcerAddress?: Address;
  enforcerTerms?: Hex;
}

export type RedeemAction =
  | 'erc20Transfer'
  | 'erc721Transfer'
  | 'nativeTransfer'
  | 'functionCall'
  | 'ownershipTransfer'
  | 'raw';

export interface RedeemOptions extends ProfileOptions {
  from?: Address;
  action: RedeemAction;
  delegationHash?: Hex;
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
