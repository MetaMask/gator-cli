import { toHex, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  Implementation,
  toMetaMaskSmartAccount,
  ROOT_AUTHORITY,
} from '@metamask/smart-accounts-kit';
import { loadConfig } from '../lib/config.js';
import { getPublicClient, getWalletClient } from '../lib/clients.js';
import { getStorageClient } from '../lib/storage.js';
import { buildCaveatList } from '../lib/caveats.js';
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

  const fromSmartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Stateless7702,
    address: account.address,
    signer: { walletClient },
  });

  console.log(`Building caveats: ${opts.allow.join(', ')}...`);
  const caveats = await buildCaveatList(
    opts,
    publicClient,
    fromSmartAccount.environment,
  );

  console.log('  Creating delegation...');
  const delegation = {
    delegate: opts.to,
    delegator: fromSmartAccount.address,
    authority: ROOT_AUTHORITY as Hex,
    caveats,
    salt: toHex(crypto.getRandomValues(new Uint8Array(32))),
  };

  console.log('  Signing...');
  const signature = await fromSmartAccount.signDelegation({ delegation });
  const signedDelegation = { ...delegation, signature };

  console.log('  Storing...');
  const storageClient = getStorageClient(config, opts.profile);
  const delegationHash = await storageClient.storeDelegation(signedDelegation);

  console.log(`\nPermission granted and stored`);
  console.log(`  Hash:      ${delegationHash}`);
  console.log(`  Caveats:   ${opts.allow.join(', ')}`);
  console.log(`  From:      ${account.address}`);
  console.log(`  To:        ${opts.to}`);
}
