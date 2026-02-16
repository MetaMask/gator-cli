import { privateKeyToAccount } from 'viem/accounts';

import { loadConfig } from '../lib/config.js';
import { getWalletClient } from '../lib/clients.js';
import { getStorageClient } from '../lib/storage.js';
import { SUPPORTED_CHAINS, DEFAULT_CHAIN } from '../lib/constants.js';
import { DelegationManager } from '@metamask/smart-accounts-kit/contracts';
import type { RevokeOptions } from '../types.js';

export async function revoke(opts: RevokeOptions) {
  const config = loadConfig();
  const account = privateKeyToAccount(config.account.privateKey);

  const chain =
    Object.values(SUPPORTED_CHAINS).find(
      (c) => c.id === config.account.chainId,
    ) ?? DEFAULT_CHAIN;

  const walletClient = getWalletClient(account, chain, config.rpcUrl);
  const storageClient = getStorageClient(config);

  console.log(`Looking up delegations to ${opts.delegate}...`);
  const given = await storageClient.fetchDelegations(account.address, 'GIVEN');

  const matching = given.filter(
    (d) => d.delegate.toLowerCase() === opts.delegate.toLowerCase(),
  );

  if (matching.length === 0) {
    throw new Error(`No delegation found to ${opts.delegate}`);
  }

  console.log(
    `  Found ${matching.length} delegation(s). Revoking first match.`,
  );

  const disableCalldata = DelegationManager.encode.disableDelegation({
    delegation: matching[0]!,
  });

  console.log('  Submitting revocation...');
  const txHash = await walletClient.sendTransaction({
    to: account.address,
    data: disableCalldata,
  });

  console.log(`\nPermission revoked`);
  console.log(`  Tx Hash: ${txHash}`);
}
