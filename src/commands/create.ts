import { privateKeyToAccount } from "viem/accounts";
import { zeroAddress } from "viem";
import {
  Implementation,
  toMetaMaskSmartAccount,
  getSmartAccountsEnvironment,
} from "@metamask/smart-accounts-kit";
import { loadConfig, saveConfig } from "../lib/config.js";
import { getPublicClient, getWalletClient } from "../lib/clients.js";
import { SUPPORTED_CHAINS, DEFAULT_CHAIN } from "../lib/constants.js";
import type { Chain } from "viem";

export async function create() {
  const config = loadConfig();

  if (config.account.upgraded) {
    console.error("❌ Account already upgraded to EIP-7702.");
    console.error(`   Address: ${config.account.address}`);
    process.exit(1);
  }

  const chain: Chain =
    Object.values(SUPPORTED_CHAINS).find((c) => c.id === config.account.chainId) ?? DEFAULT_CHAIN;

  console.log(`🐊 Upgrading account to EIP-7702 on ${chain.name}...`);
  console.log(`   Address: ${config.account.address}`);

  const account = privateKeyToAccount(config.account.privateKey);
  const publicClient = getPublicClient(chain);
  const walletClient = getWalletClient(account, chain);

  // Get the 7702 contract address
  const environment = getSmartAccountsEnvironment(chain.id);
  const contractAddress = environment.implementations.EIP7702StatelessDeleGatorImpl;

  // Sign authorization
  console.log("   Signing EIP-7702 authorization...");
  const authorization = await walletClient.signAuthorization({
    account,
    contractAddress,
    executor: "self",
  });

  // Submit 7702 transaction
  console.log("   Submitting 7702 upgrade transaction...");
  const hash = await walletClient.sendTransaction({
    authorizationList: [authorization],
    data: "0x",
    to: zeroAddress,
  });

  // Verify smart account creation
  await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Stateless7702,
    address: account.address,
    signer: { walletClient },
  });

  // Update config
  config.account.upgraded = true;
  config.account.upgradeTxHash = hash;
  saveConfig(config);

  console.log(`\n✅ Account upgraded to EIP-7702`);
  console.log(`   Address:  ${config.account.address}`);
  console.log(`   Chain:    ${chain.name} (${chain.id})`);
  console.log(`   Tx:       ${hash}`);
}
