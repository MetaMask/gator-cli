import { configExists, loadConfig } from '../lib/config.js';
import { getPublicClient } from '../lib/clients.js';
import { SUPPORTED_CHAINS, DEFAULT_CHAIN } from '../lib/constants.js';

export async function status() {
  if (!configExists()) {
    throw new Error('Not initialized. Run `@metamask/gator-cli init` first.');
  }

  const config = loadConfig();
  const { address, chainId, upgraded, upgradeTxHash } = config.account;

  const chain =
    Object.values(SUPPORTED_CHAINS).find((c) => c.id === chainId) ??
    DEFAULT_CHAIN;

  const publicClient = getPublicClient(chain);
  let onChainUpgraded = false;
  try {
    const code = await publicClient.getCode({ address });
    onChainUpgraded = code !== undefined && code !== '0x';
  } catch {
    // RPC error — skip on-chain check
  }

  console.log('Account Status');
  console.log(`  Address:      ${address}`);
  console.log(`  Chain:        ${chain.name} (${chainId})`);
  console.log(`  7702 Config:  ${upgraded ? 'Yes' : 'No'}`);
  console.log(
    `  7702 On-chain: ${onChainUpgraded ? 'Verified' : 'Not detected'}`,
  );

  if (upgradeTxHash) {
    console.log(`  Upgrade Tx:   ${upgradeTxHash}`);
  }

  const hasStorage =
    config.delegationStorage.apiKey && config.delegationStorage.apiKeyId;
  console.log(
    `  Storage:      ${hasStorage ? 'Configured' : 'Not configured'}`,
  );
  console.log(
    `  RPC URL:      ${config.rpcUrl ? 'Configured' : 'Not configured'}`,
  );
}
