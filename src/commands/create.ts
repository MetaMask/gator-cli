import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { zeroAddress } from "viem";
import {
  Implementation,
  toMetaMaskSmartAccount,
  getSmartAccountsEnvironment,
} from "@metamask/smart-accounts-kit";
import { configExists, saveConfig } from "../lib/config.js";
import { getPublicClient, getWalletClient } from "../lib/clients.js";
import { SUPPORTED_CHAINS, DEFAULT_CHAIN } from "../lib/constants.js";
import type { CreateOptions, PermissionsConfig } from "../types.js";

export async function create(opts: CreateOptions) {
  if (configExists()) {
    console.error("❌ Account already exists. Run `permissions-cli status` to view.");
    process.exit(1);
  }

  const chain = opts.chain ? SUPPORTED_CHAINS[opts.chain] ?? DEFAULT_CHAIN : DEFAULT_CHAIN;
  console.log(`🐊 Creating account on ${chain.name}...`);

  // Step 1: Generate key
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  console.log(`   Address: ${account.address}`);

  // Step 2: Set up clients
  const publicClient = getPublicClient(chain);
  const walletClient = getWalletClient(account, chain);

  // Step 3: Get the 7702 contract address
  const environment = getSmartAccountsEnvironment(chain.id);
  const contractAddress = environment.implementations.EIP7702StatelessDeleGatorImpl;

  // Step 4: Sign authorization
  console.log("   Signing EIP-7702 authorization...");
  const authorization = await walletClient.signAuthorization({
    account,
    contractAddress,
    executor: "self",
  });

  // Step 5: Submit 7702 transaction
  console.log("   Submitting 7702 upgrade transaction...");
  const hash = await walletClient.sendTransaction({
    authorizationList: [authorization],
    data: "0x",
    to: zeroAddress,
  });

  // Step 6: Verify smart account creation
  const smartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Stateless7702,
    address: account.address,
    signer: { walletClient },
  });

  // Step 7: Save config
  const config: PermissionsConfig = {
    version: 1,
    account: {
      address: account.address,
      privateKey,
      upgraded: true,
      chainId: chain.id,
      upgradeTxHash: hash,
    },
    delegationStorage: {
      apiKey: "",
      apiKeyId: "",
    },
    bundlerUrl: "",
  };

  saveConfig(config);

  console.log(`\n✅ Account created & upgraded to EIP-7702`);
  console.log(`   Address:  ${account.address}`);
  console.log(`   Chain:    ${chain.name} (${chain.id})`);
  console.log(`   Tx:       ${hash}`);
  console.log(`\n⚠️  Configure delegationStorage.apiKey, apiKeyId, and bundlerUrl in permissions.json`);
}
