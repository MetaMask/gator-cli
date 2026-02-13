import { privateKeyToAccount } from "viem/accounts";

import { loadConfig } from "@/lib/config.js";
import { getPublicClient, getWalletClient, getBundlerClient } from "@/lib/clients.js";
import { getStorageClient } from "@/lib/storage.js";
import { SUPPORTED_CHAINS, DEFAULT_CHAIN } from "@/lib/constants.js";
import {
  Implementation,
  toMetaMaskSmartAccount,
} from "@metamask/smart-accounts-kit";
import { DelegationManager } from "@metamask/smart-accounts-kit/contracts";
import type { RevokeOptions } from "@/types.js";

export async function revokePermission(opts: RevokeOptions) {
  const config = loadConfig();
  const account = privateKeyToAccount(config.account.privateKey);

  const chain =
    Object.values(SUPPORTED_CHAINS).find((c) => c.id === config.account.chainId) ??
    DEFAULT_CHAIN;

  const publicClient = getPublicClient(chain);
  const walletClient = getWalletClient(account, chain);
  const storageClient = getStorageClient(config);

  // Lookup delegations given by us to the delegate
  console.log(`🐊 Looking up delegations to ${opts.delegate}...`);
  const given = await storageClient.fetchDelegations(
    account.address,
    "GIVEN",
  );

  const matching = given.filter(
    (d) => d.delegate.toLowerCase() === opts.delegate.toLowerCase(),
  );

  if (matching.length === 0) {
    console.error(`❌ No delegation found to ${opts.delegate}`);
    process.exit(1);
  }

  console.log(`   Found ${matching.length} delegation(s). Revoking first match.`);

  // Build disable delegation calldata
  const disableCalldata = DelegationManager.encode.disableDelegation({
    delegation: matching[0]!,
  });

  // Send via smart account
  const smartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Stateless7702,
    address: account.address,
    signer: { walletClient },
  });

  const bundlerClient = getBundlerClient(config, chain);

  console.log("   Submitting revocation...");
  const userOpHash = await bundlerClient.sendUserOperation({
    account: smartAccount,
    calls: [
      {
        to: smartAccount.address,
        data: disableCalldata,
      },
    ],
  });

  console.log(`\n✅ Permission revoked`);
  console.log(`   UserOp Hash: ${userOpHash}`);
}
