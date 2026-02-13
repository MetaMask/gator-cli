#!/usr/bin/env node

import { Command } from "commander";
import { init } from "./commands/init.js";
import { create } from "./commands/create.js";
import { show } from "./commands/show.js";
import { status } from "./commands/status.js";
import { grantPermission } from "./commands/grantPermission.js";
import { redeemPermission } from "./commands/redeemPermission.js";
import { revokePermission } from "./commands/revokePermission.js";
import { inspect } from "./commands/inspect.js";
import type { Address, Hex } from "viem";

function commaSplit(val: string): string[] {
  return val.split(",").map((s) => s.trim());
}

const program = new Command();

program
  .name("permissions-cli")
  .description(
    "ERC-7710 Delegation CLI — grant, redeem, and revoke permissions on MetaMask Smart Accounts",
  )
  .version("0.1.0");

// init
program
  .command("init")
  .description("Generate a private key and save to permissions.json (fund before upgrading)")
  .option("--chain <chain>", "Target chain (base, sepolia)", "base")
  .action(init);

// create
program
  .command("create")
  .description("Upgrade existing EOA to EIP-7702 smart account (requires funded account)")
  .action(create);

// show
program
  .command("show")
  .description("Display the EOA address")
  .action(show);

// status
program
  .command("status")
  .description("Check if permissions.json exists and show account details")
  .action(status);

// grantPermission
program
  .command("grantPermission")
  .description("Create, sign, and store a delegation with a predefined scope")
  .requiredOption("--delegate <address>", "Delegate address")
  .requiredOption(
    "--scope <type>",
    "Scope type: erc20TransferAmount, erc20PeriodTransfer, erc20Streaming, erc721Transfer, nativeTokenPeriodTransfer, nativeTokenStreaming, functionCall, ownershipTransfer",
  )
  // Token scopes
  .option("--tokenAddress <address>", "ERC-20/721 token contract address")
  .option("--maxAmount <amount>", "Max amount (human readable, e.g. '10')")
  .option("--tokenId <id>", "ERC-721 token ID")
  // Periodic scopes
  .option("--periodAmount <amount>", "Amount per period (human readable)")
  .option("--periodDuration <seconds>", "Period duration in seconds", parseInt)
  .option("--startDate <timestamp>", "Start date (unix seconds)", parseInt)
  // Streaming scopes
  .option("--amountPerSecond <amount>", "Streaming rate (human readable)")
  .option("--initialAmount <amount>", "Initial released amount")
  .option("--startTime <timestamp>", "Start time (unix seconds)", parseInt)
  // Function call scope
  .option("--targets <addresses>", "Contract addresses (comma-separated)", commaSplit)
  .option("--selectors <sigs>", "Function signatures (comma-separated)", commaSplit)
  .option("--valueLte <ether>", "Max native token value per call")
  // Ownership transfer
  .option("--contractAddress <address>", "Contract for ownership transfer")
  .action((opts) => {
    grantPermission({
      delegate: opts.delegate as Address,
      scope: opts.scope,
      tokenAddress: opts.tokenAddress as Address | undefined,
      maxAmount: opts.maxAmount,
      tokenId: opts.tokenId,
      periodAmount: opts.periodAmount,
      periodDuration: opts.periodDuration,
      startDate: opts.startDate,
      amountPerSecond: opts.amountPerSecond,
      initialAmount: opts.initialAmount,
      startTime: opts.startTime,
      targets: opts.targets,
      selectors: opts.selectors,
      valueLte: opts.valueLte,
      contractAddress: opts.contractAddress as Address | undefined,
    });
  });

// redeemPermission
program
  .command("redeemPermission")
  .description("Redeem a delegation (looks up by delegator+delegate from storage)")
  .requiredOption("--delegator <address>", "Delegator address")
  .requiredOption("--target <address>", "Target contract address for execution")
  .requiredOption("--callData <hex>", "Calldata for execution")
  .option("--value <ether>", "Native token value to send")
  .action((opts) => {
    redeemPermission({
      delegator: opts.delegator as Address,
      target: opts.target as Address,
      callData: opts.callData as Hex,
      value: opts.value,
    });
  });

// revokePermission
program
  .command("revokePermission")
  .description("Revoke a delegation on-chain")
  .requiredOption("--delegate <address>", "Delegate address to revoke")
  .action((opts) => {
    revokePermission({ delegate: opts.delegate as Address });
  });

// inspect
program
  .command("inspect")
  .description("Inspect delegations for your account")
  .option("--delegator <address>", "Filter by delegator address")
  .option("--delegate <address>", "Filter by delegate address")
  .action((opts) => {
    inspect({
      delegator: opts.delegator as Address | undefined,
      delegate: opts.delegate as Address | undefined,
    });
  });

program.parse();
