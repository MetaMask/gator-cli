import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { configExists, saveConfig } from "@/lib/config.js";
import { SUPPORTED_CHAINS, DEFAULT_CHAIN } from "@/lib/constants.js";
import type { CreateOptions, PermissionsConfig } from "@/types.js";

export async function init(opts: CreateOptions) {
  if (configExists()) {
    console.error("❌ Account already exists. Run `permissions-cli show` to view.");
    process.exit(1);
  }

  const chain = opts.chain ? SUPPORTED_CHAINS[opts.chain] ?? DEFAULT_CHAIN : DEFAULT_CHAIN;

  // Generate key
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  // Save config (not yet upgraded)
  const config: PermissionsConfig = {
    version: 1,
    account: {
      address: account.address,
      privateKey,
      upgraded: false,
      chainId: chain.id,
    },
    delegationStorage: {
      apiKey: "",
      apiKeyId: "",
    },
    bundlerUrl: "",
  };

  saveConfig(config);

  console.log(`\n✅ Account initialized`);
  console.log(`   Address:  ${account.address}`);
  console.log(`   Chain:    ${chain.name} (${chain.id})`);
  console.log(`\n💰 Fund this address with native token, then run \`permissions-cli create\` to upgrade to EIP-7702.`);
  console.log(`⚠️  Also configure delegationStorage.apiKey, apiKeyId, and bundlerUrl in permissions.json`);
}
