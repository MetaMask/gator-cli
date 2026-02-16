import { toHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  Implementation,
  toMetaMaskSmartAccount,
  createDelegation,
} from '@metamask/smart-accounts-kit';
import { loadConfig } from '../lib/config.js';
import { getPublicClient, getWalletClient } from '../lib/clients.js';
import { getStorageClient } from '../lib/storage.js';
import { buildScope } from '../lib/scopes.js';
import { SUPPORTED_CHAINS, DEFAULT_CHAIN } from '../lib/constants.js';
import type { GrantOptions } from '../types.js';

export async function grantPermission(opts: GrantOptions) {
  const config = loadConfig();
  const account = privateKeyToAccount(config.account.privateKey);

  const chain =
    Object.values(SUPPORTED_CHAINS).find(
      (c) => c.id === config.account.chainId,
    ) ?? DEFAULT_CHAIN;

  const publicClient = getPublicClient(chain);
  const walletClient = getWalletClient(account, chain);

  const delegatorSmartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Stateless7702,
    address: account.address,
    signer: { walletClient },
  });

  console.log(`Building ${opts.scope} scope...`);
  const scope = await buildScope(opts, publicClient);

  console.log('  Creating delegation...');
  const delegation = createDelegation({
    scope,
    to: opts.delegate,
    from: delegatorSmartAccount.address,
    environment: delegatorSmartAccount.environment,
    salt: toHex(crypto.getRandomValues(new Uint8Array(32))),
  });

  console.log('  Signing...');
  const signature = await delegatorSmartAccount.signDelegation({ delegation });
  const signedDelegation = { ...delegation, signature };

  console.log('  Storing...');
  const storageClient = getStorageClient(config);
  const delegationHash = await storageClient.storeDelegation(signedDelegation);

  console.log(`\nPermission granted and stored`);
  console.log(`  Hash:      ${delegationHash}`);
  console.log(`  Scope:     ${opts.scope}`);
  console.log(`  Delegator: ${account.address}`);
  console.log(`  Delegate:  ${opts.delegate}`);
}
