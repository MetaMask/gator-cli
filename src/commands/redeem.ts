import { parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  createExecution,
  ExecutionMode,
  getSmartAccountsEnvironment,
} from '@metamask/smart-accounts-kit';
import { DelegationManager } from '@metamask/smart-accounts-kit/contracts';

import { loadConfig } from '../lib/config.js';
import { getPublicClient, getWalletClient } from '../lib/clients.js';
import { getStorageClient } from '../lib/storage.js';
import { buildExecution } from '../lib/executions.js';
import { SUPPORTED_CHAINS, DEFAULT_CHAIN } from '../lib/constants.js';
import type { RedeemOptions, RedeemScopeOptions } from '../types.js';

function isScopeMode(opts: RedeemOptions): opts is RedeemScopeOptions {
  return 'scope' in opts && typeof opts.scope === 'string';
}

export async function redeem(opts: RedeemOptions) {
  const config = loadConfig(opts.profile);
  const account = privateKeyToAccount(config.account.privateKey);

  const chain =
    Object.values(SUPPORTED_CHAINS).find(
      (c) => c.id === config.account.chainId,
    ) ?? DEFAULT_CHAIN;

  const publicClient = getPublicClient(chain, config.rpcUrl);
  const walletClient = getWalletClient(account, chain, config.rpcUrl);
  const storageClient = getStorageClient(config, opts.profile);

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

  console.log('  Sending transaction...');
  const txHash = await walletClient.sendTransaction({
    to: getSmartAccountsEnvironment(chain.id).DelegationManager,
    data: redeemCalldata,
  });

  console.log(`\nPermission redeemed`);
  console.log(`  Tx Hash: ${txHash}`);
}
