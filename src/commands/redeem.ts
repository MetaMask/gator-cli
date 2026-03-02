import type { Address } from 'viem';
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
import type { RedeemOptions } from '../types.js';

export async function redeem(opts: RedeemOptions) {
  if (!opts.delegationHash && !opts.from) {
    throw new Error('Either --from or --delegationHash must be provided');
  }

  const config = loadConfig(opts.profile);
  const account = privateKeyToAccount(config.account.privateKey);

  const chain =
    Object.values(SUPPORTED_CHAINS).find(
      (c) => c.id === config.account.chainId,
    ) ?? DEFAULT_CHAIN;

  const publicClient = getPublicClient(chain, config.rpcUrl);
  const walletClient = getWalletClient(account, chain, config.rpcUrl);
  const storageClient = getStorageClient(config, opts.profile);

  let delegationChain;
  let delegator: Address;

  if (opts.delegationHash) {
    console.log(`Redeeming delegation ${opts.delegationHash} directly...`);
    delegationChain = await storageClient.getDelegationChain(
      opts.delegationHash,
    );
    delegator = delegationChain[0]!.delegator as Address;
  } else {
    const from = opts.from!;
    console.log(`Looking up delegations from ${from}...`);
    const received = await storageClient.fetchDelegations(
      account.address,
      'RECEIVED',
    );

    const matching = received.filter(
      (d) => d.delegator.toLowerCase() === from.toLowerCase(),
    );

    if (matching.length === 0) {
      throw new Error(`No delegation found from ${from} to ${account.address}`);
    }

    console.log(`  Found ${matching.length} delegation(s). Using first match.`);

    delegationChain = await storageClient.getDelegationChain(matching[0]!);
    delegator = from;
  }

  console.log(`  Building ${opts.action} execution...`);
  const execution = await buildExecution(opts, delegator, publicClient);

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
