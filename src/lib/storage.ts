import {
  type Hex,
  toHex,
  getAddress,
  keccak256,
  encodeAbiParameters,
  hexToBytes,
  concatBytes,
} from 'viem';
import type { PermissionsConfig } from '../types.js';
import { Delegation } from '@metamask/smart-accounts-kit';

const DELEGATION_STORAGE_API_URL =
  'https://passkeys.dev-api.cx.metamask.io/api/v0';

// EIP-712 type hashes used by the DelegationManager contract
const DELEGATION_TYPEHASH: Hex =
  '0x88c1d2ecf185adf710588203a5f263f0ff61be0d33da39792cde19ba9aa4331e';
const CAVEAT_TYPEHASH: Hex =
  '0x80ad7e1b04ee6d994a125f4714ca0720908bd80ed16063ec8aee4b88e9253e2d';

type DelegationFilter = 'ALL' | 'GIVEN' | 'RECEIVED';

interface StorageClientOptions {
  apiKey: string;
  apiKeyId: string;
  apiUrl: string;
}

interface StoreDelegationResponse {
  delegationHash: Hex;
}

interface StorageErrorResponse {
  error: string;
}

// ---------------------------------------------------------------------------
// Delegation hash computation (replaces getDelegationHashOffchain from the SDK)
// ---------------------------------------------------------------------------

function getCaveatHash(caveat: { enforcer: Hex; terms: Hex }): Uint8Array {
  const termsHash = keccak256(hexToBytes(caveat.terms));
  const encoded = encodeAbiParameters(
    [{ type: 'bytes32' }, { type: 'address' }, { type: 'bytes32' }],
    [CAVEAT_TYPEHASH, caveat.enforcer, termsHash],
  );
  return hexToBytes(keccak256(encoded));
}

function getCaveatsArrayHash(caveats: { enforcer: Hex; terms: Hex }[]): Hex {
  if (caveats.length === 0) {
    return keccak256(new Uint8Array(0));
  }
  const parts = caveats.map((c) => getCaveatHash(c));
  return keccak256(concatBytes(parts));
}

/**
 * Computes the delegation hash offchain, replicating the behaviour of
 * `getDelegationHashOffchain` from the SDK and `hashDelegation` from
 * `@metamask/delegation-core`.
 */
function getDelegationHash(delegation: Delegation): Hex {
  const salt = delegation.salt === '0x' ? 0n : BigInt(delegation.salt);

  const caveatsHash = getCaveatsArrayHash(
    delegation.caveats.map((c) => ({
      enforcer: getAddress(c.enforcer),
      terms: c.terms,
    })),
  );

  const encoded = encodeAbiParameters(
    [
      { type: 'bytes32' },
      { type: 'address' },
      { type: 'address' },
      { type: 'bytes32' },
      { type: 'bytes32' },
      { type: 'uint256' },
    ],
    [
      DELEGATION_TYPEHASH,
      getAddress(delegation.delegate),
      getAddress(delegation.delegator),
      delegation.authority,
      caveatsHash,
      salt,
    ],
  );

  return keccak256(encoded);
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function getHeaders(opts: StorageClientOptions): Record<string, string> {
  return {
    Authorization: `Bearer ${opts.apiKey}`,
    'x-api-key-id': opts.apiKeyId,
    'Content-Type': 'application/json',
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getStorageClient(config: PermissionsConfig) {
  const { apiKey, apiKeyId } = config.delegationStorage;

  if (!apiKey || !apiKeyId) {
    throw new Error(
      '❌ Delegation storage not configured. Set apiKey and apiKeyId in permissions.json',
    );
  }

  const opts: StorageClientOptions = {
    apiKey,
    apiKeyId,
    apiUrl: DELEGATION_STORAGE_API_URL,
  };

  return {
    /**
     * Stores a signed delegation via POST /v0/delegation/store.
     * Returns the delegation hash.
     */
    async storeDelegation(delegation: Delegation): Promise<Hex> {
      if (!delegation.signature || delegation.signature === '0x') {
        throw new Error('Delegation must be signed to be stored');
      }

      const expectedHash = getDelegationHash(delegation);

      const body = JSON.stringify(
        { ...delegation, metadata: [] },
        (_, value) =>
          typeof value === 'bigint' || typeof value === 'number'
            ? toHex(value)
            : value,
        2,
      );

      const response = await fetch(
        `${opts.apiUrl}/delegation/store?metadataCategory=*`,
        {
          method: 'POST',
          headers: getHeaders(opts),
          body,
        },
      );

      const data = (await response.json()) as
        | StoreDelegationResponse
        | StorageErrorResponse;

      if (!response.ok || 'error' in data) {
        throw new Error(
          `Failed to store delegation: ${'error' in data ? data.error : response.statusText}`,
        );
      }

      if (data.delegationHash !== expectedHash) {
        throw new Error(
          'Failed to store delegation: hash returned by the API does not match the locally computed hash',
        );
      }

      return data.delegationHash;
    },

    /**
     * Fetches delegations for an address via
     * GET /v0/delegation/accounts/{address}?filter=GIVEN|RECEIVED|ALL.
     */
    async fetchDelegations(
      address: string,
      filter: DelegationFilter = 'ALL',
    ): Promise<Delegation[]> {
      const response = await fetch(
        `${opts.apiUrl}/delegation/accounts/${address}?filter=${filter}&metadataCategory=*`,
        {
          method: 'GET',
          headers: getHeaders(opts),
        },
      );

      const data = (await response.json()) as
        | Delegation[]
        | StorageErrorResponse;

      if (!response.ok || 'error' in data) {
        throw new Error(
          `Failed to fetch delegations: ${'error' in data ? data.error : response.statusText}`,
        );
      }

      return data;
    },

    /**
     * Fetches the full delegation chain (leaf -> root) via
     * GET /v0/delegation/chain/{leaf_delegation_hash}.
     *
     * Accepts either a delegation object or a delegation hash string.
     */
    async getDelegationChain(
      leafDelegationOrHash: Delegation | Hex,
    ): Promise<Delegation[]> {
      const leafHash: Hex =
        typeof leafDelegationOrHash === 'string'
          ? leafDelegationOrHash
          : getDelegationHash(leafDelegationOrHash);

      const response = await fetch(
        `${opts.apiUrl}/delegation/chain/${leafHash}`,
        {
          method: 'GET',
          headers: getHeaders(opts),
        },
      );

      const data = (await response.json()) as
        | Delegation[]
        | StorageErrorResponse;

      if (!response.ok || 'error' in data) {
        throw new Error(
          `Failed to fetch delegation chain: ${'error' in data ? data.error : response.statusText}`,
        );
      }

      return data;
    },

    /**
     * Fetches a single delegation by its hash via
     * GET /v0/delegation/{delegation_hash}.
     */
    async getDelegation(delegationHash: Hex): Promise<Delegation> {
      const response = await fetch(
        `${opts.apiUrl}/delegation/${delegationHash}`,
        {
          method: 'GET',
          headers: getHeaders(opts),
        },
      );

      const data = (await response.json()) as Delegation | StorageErrorResponse;

      if (!response.ok || 'error' in data) {
        throw new Error(
          `Failed to fetch delegation: ${'error' in data ? data.error : response.statusText}`,
        );
      }

      return data;
    },
  };
}
