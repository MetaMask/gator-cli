import { parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  Implementation,
  toMetaMaskSmartAccount,
  createExecution,
  ExecutionMode,
} from '@metamask/smart-accounts-kit';
import { DelegationManager } from '@metamask/smart-accounts-kit/contracts';

import { loadConfig } from '../lib/config.js';
import {
  getPublicClient,
  getWalletClient,
  getBundlerClient,
} from '../lib/clients.js';
import { getStorageClient } from '../lib/storage.js';
import { buildExecution } from '../lib/executions.js';
import { SUPPORTED_CHAINS, DEFAULT_CHAIN } from '../lib/constants.js';
import type { RedeemOptions, RedeemScopeOptions } from '../types.js';

function isScopeMode(opts: RedeemOptions): opts is RedeemScopeOptions {
  return 'scope' in opts && typeof opts.scope === 'string';
}

export async function redeemPermission(opts: RedeemOptions) {
  const config = loadConfig();
  const account = privateKeyToAccount(config.account.privateKey);

  const chain =
    Object.values(SUPPORTED_CHAINS).find(
      (c) => c.id === config.account.chainId,
    ) ?? DEFAULT_CHAIN;

  const publicClient = getPublicClient(chain);
  const walletClient = getWalletClient(account, chain);
  const storageClient = getStorageClient(config);

  console.log(`Looking up delegations from ${opts.delegator}...`);
  const received = await storageClient.fetchDelegations(
    account.address,
    'RECEIVED',
  );

  const matching = received.filter(
    (d) => d.delegator.toLowerCase() === opts.delegator.toLowerCase(),
  );

  if (matching.length === 0) {
    throw new Error(
      `No delegation found from ${opts.delegator} to ${account.address}`,
    );
  }

  console.log(`  Found ${matching.length} delegation(s). Using first match.`);

  const delegationChain = await storageClient.getDelegationChain(matching[0]!);

  let execution: {
    target: `0x${string}`;
    callData: `0x${string}`;
    value: bigint;
  };

  if (isScopeMode(opts)) {
    console.log(`  Building ${opts.scope} execution...`);
    execution = await buildExecution(opts, opts.delegator, publicClient);
  } else {
    execution = {
      target: opts.target,
      callData: opts.callData,
      value: opts.value ? parseEther(opts.value) : 0n,
    };
  }

  const executions = [createExecution(execution)];

  const redeemCalldata = DelegationManager.encode.redeemDelegations({
    delegations: [delegationChain],
    modes: [ExecutionMode.SingleDefault],
    executions: [executions],
  });

  const delegateSmartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Stateless7702,
    address: account.address,
    signer: { walletClient },
  });

  const bundlerClient = getBundlerClient(config, chain);

  console.log('  Sending UserOperation...');
  const userOpHash = await bundlerClient.sendUserOperation({
    account: delegateSmartAccount,
    calls: [
      {
        to: delegateSmartAccount.address,
        data: redeemCalldata,
      },
    ],
  });

  console.log(`\nPermission redeemed`);
  console.log(`  UserOp Hash: ${userOpHash}`);
}
