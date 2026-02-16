import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { configExists, saveConfig } from '../lib/config.js';
import {
  SUPPORTED_CHAINS,
  DEFAULT_CHAIN,
  CONFIG_FILE,
} from '../lib/constants.js';
import type { CreateOptions, PermissionsConfig } from '../types.js';

export async function init(opts: CreateOptions) {
  if (configExists()) {
    throw new Error(
      'Account already exists. Run `@metamask/gator-cli show` to view.',
    );
  }

  const chain = opts.chain
    ? (SUPPORTED_CHAINS[opts.chain] ?? DEFAULT_CHAIN)
    : DEFAULT_CHAIN;

  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  const config: PermissionsConfig = {
    version: 1,
    account: {
      address: account.address,
      privateKey,
      upgraded: false,
      chainId: chain.id,
    },
    delegationStorage: {
      apiKey: '',
      apiKeyId: '',
    },
    rpcUrl: undefined,
  };

  saveConfig(config);

  console.log(`\nAccount initialized`);
  console.log(`  Address:  ${account.address}`);
  console.log(`  Chain:    ${chain.name} (${chain.id})`);
  console.log(`  Config:   ${CONFIG_FILE}`);
  console.log(
    `\nFund this address with native token, then run \`@metamask/gator-cli create\` to upgrade to EIP-7702.`,
  );
  console.log(
    `Also configure delegationStorage.apiKey, apiKeyId, and rpcUrl in ${CONFIG_FILE}`,
  );
}
