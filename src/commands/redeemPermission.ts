import { parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  Implementation,
  toMetaMaskSmartAccount,
  createExecution,
  ExecutionMode,
} from "@metamask/smart-accounts-kit";
import { DelegationManager } from "@metamask/smart-accounts-kit/contracts";

import { loadConfig } from "../lib/config.js";
import { getPublicClient, getWalletClient, getBundlerClient } from "../lib/clients.js";
import { getStorageClient } from "../lib/storage.js";
import { SUPPORTED_CHAINS, DEFAULT_CHAIN } from "../lib/constants.js";
import type { RedeemOptions } from "../types.js";

export async function redeemPermission(opts: RedeemOptions) {
  const config = loadConfig();
  const account = privateKeyToAccount(config.account.privateKey);

  const chain =
    Object.values(SUPPORTED_CHAINS).find((c) => c.id === config.account.chainId) ??
    DEFAULT_CHAIN;

  const publicClient = getPublicClient(chain);
  const walletClient = getWalletClient(account, chain);
  const storageClient = getStorageClient(config);

  // Step 1: Lookup delegations received by us
  console.log(`🐊 Looking up delegations from ${opts.delegator}...`);
  const received = await storageClient.fetchDelegations(
    account.address,
    "RECEIVED",
  );

  const matching = received.filter(
    (d: any) => d.delegator.toLowerCase() === opts.delegator.toLowerCase(),
  );

  if (matching.length === 0) {
    console.error(
      `❌ No delegation found from ${opts.delegator} → ${account.address}`,
    );
    process.exit(1);
  }

  console.log(`   Found ${matching.length} delegation(s). Using first match.`);

  // Step 2: Get the full delegation chain
  const delegationChain = await storageClient.getDelegationChain(matching[0]!);

  // Step 3: Build execution
  const executions = [
    createExecution({
      target: opts.target,
      callData: opts.callData,
      value: opts.value ? parseEther(opts.value) : 0n,
    }),
  ];

  // Step 4: Encode redeem calldata
  const redeemCalldata = DelegationManager.encode.redeemDelegations({
    delegations: [delegationChain],
    modes: [ExecutionMode.SingleDefault],
    executions: [executions],
  });

  // Step 5: Send UserOp as delegate
  const delegateSmartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Stateless7702,
    address: account.address,
    signer: { walletClient },
  });

  const bundlerClient = getBundlerClient(config, chain);

  console.log("   Sending UserOperation...");
  const userOpHash = await bundlerClient.sendUserOperation({
    account: delegateSmartAccount,
    calls: [
      {
        to: delegateSmartAccount.address,
        data: redeemCalldata,
      },
    ],
    maxFeePerGas: 1n,
    maxPriorityFeePerGas: 1n,
  });

  console.log(`\n✅ Permission redeemed`);
  console.log(`   UserOp Hash: ${userOpHash}`);
}
