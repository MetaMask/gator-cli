import {
  DelegationStorageClient,
} from "@metamask/smart-accounts-kit/experimental";
import type { PermissionsConfig } from "../types.js";

const DELEGATION_STORAGE_API_URL = "https://delegation-storage.metamask-institutional.io/v1";

export function getStorageClient(config: PermissionsConfig): DelegationStorageClient {
  const { apiKey, apiKeyId } = config.delegationStorage;

  if (!apiKey || !apiKeyId) {
    throw new Error(
      "❌ Delegation storage not configured. Set apiKey and apiKeyId in permissions.json",
    );
  }

  return new DelegationStorageClient({
    apiKey,
    apiKeyId,
    environment: { apiUrl: DELEGATION_STORAGE_API_URL },
  });
}
