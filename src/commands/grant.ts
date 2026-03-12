import { toHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  Implementation,
  toMetaMaskSmartAccount,
  createDelegation,
  ROOT_AUTHORITY,
  Delegation,
} from '@metamask/smart-accounts-kit';
import { loadConfig } from '../lib/config.js';
import { getPublicClient, getWalletClient } from '../lib/clients.js';
import { getStorageClient } from '../lib/storage.js';
import { buildDelegationAuthority } from '../lib/caveats.js';
import { SUPPORTED_CHAINS, DEFAULT_CHAIN } from '../lib/constants.js';
import type { GrantOptions } from '../types.js';

export async function grant(opts: GrantOptions) {
  const config = loadConfig(opts.profile);
  const account = privateKeyToAccount(config.account.privateKey);

  const chain =
    Object.values(SUPPORTED_CHAINS).find(
      (c) => c.id === config.account.chainId,
    ) ?? DEFAULT_CHAIN;

  const publicClient = getPublicClient(chain, config.rpcUrl);
  const walletClient = getWalletClient(account, chain, config.rpcUrl);
  const storageClient = getStorageClient(config, opts.profile);

  if (opts.parentDelegation) {
    // This will throw when parent delegation is not found in storage. 
    const parentDelegation = await storageClient.getDelegation(
      opts.parentDelegation,
    );
    const parentDelegate = parentDelegation.delegate.toLowerCase();
    if (parentDelegate !== account.address.toLowerCase()) {
      throw new Error(
        `Current account ${account.address} is not the delegate of parent delegation ${opts.parentDelegation} (delegate is ${parentDelegation.delegate})`,
      );
    }
  }

  const fromSmartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Stateless7702,
    address: account.address,
    signer: { walletClient },
  });

  console.log(`Building delegation: ${opts.allow.join(', ')}...`);
  const { scope, caveats } = await buildDelegationAuthority(
    opts,
    publicClient,
    fromSmartAccount.environment,
  );

  if (opts.parentDelegation) {
    console.log(`  Sub-delegation of: ${opts.parentDelegation}`);
  }

  let delegation: Delegation;
  const salt = toHex(crypto.getRandomValues(new Uint8Array(32)));
  if (scope) {
    console.log(`  Using scope: ${scope.type}`);
    delegation = createDelegation({
      from: fromSmartAccount.address,
      to: opts.to,
      environment: fromSmartAccount.environment,
      parentDelegation: opts.parentDelegation,
      scope,
      caveats: caveats,
      salt,
    });
  } else {
    console.log('  Building without scope (caveats only)...');
    delegation = {
      delegate: opts.to,
      delegator: fromSmartAccount.address,
      authority: opts.parentDelegation ?? ROOT_AUTHORITY,
      caveats,
      salt,
      signature: '0x00',
    };
  }

  console.log('  Signing...');
  const signature = await fromSmartAccount.signDelegation({ delegation });
  const signedDelegation = { ...delegation, signature };

  console.log('  Storing...');
  const delegationHash = await storageClient.storeDelegation(signedDelegation);

  console.log(`\nPermission granted and stored`);
  console.log(`  Hash:      ${delegationHash}`);
  console.log(`  Allow:     ${opts.allow.join(', ')}`);
  console.log(`  From:      ${account.address}`);
  console.log(`  To:        ${opts.to}`);
  if (opts.parentDelegation) {
    console.log(`  Parent:    ${opts.parentDelegation}`);
  }
}
