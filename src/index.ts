#!/usr/bin/env node

import { Command } from 'commander';
import { init } from './commands/init.js';
import { create } from './commands/create.js';
import { show } from './commands/show.js';
import { status } from './commands/status.js';
import { grant } from './commands/grant.js';
import { redeem } from './commands/redeem.js';
import { revoke } from './commands/revoke.js';
import { inspect } from './commands/inspect.js';
import type { Address, Hex } from 'viem';
import { commaSplit } from './lib/utils.js';

const program = new Command();

program
  .name('gator')
  .description(
    'ERC-7710 Delegation CLI — grant, redeem, and revoke permissions on MetaMask Smart Accounts',
  )
  .version('0.1.0');

// init
program
  .command('init')
  .description('Generate a private key and save config (fund before upgrading)')
  .option('--chain <chain>', 'Target chain (base, sepolia)', 'base')
  .option('--profile <name>', 'Profile name', 'default')
  .action((opts) => {
    init({ chain: opts.chain, profile: opts.profile });
  });

// create
program
  .command('create')
  .description(
    'Upgrade existing EOA to EIP-7702 smart account (requires funded account)',
  )
  .option('--profile <name>', 'Profile name', 'default')
  .action((opts) => {
    create({ profile: opts.profile });
  });

// show
program
  .command('show')
  .description('Display the EOA address')
  .option('--profile <name>', 'Profile name', 'default')
  .action((opts) => {
    show({ profile: opts.profile });
  });

// status
program
  .command('status')
  .description('Check if config exists and show account details')
  .option('--profile <name>', 'Profile name', 'default')
  .action((opts) => {
    status({ profile: opts.profile });
  });

// grant
program
  .command('grant')
  .description('Create, sign, and store a delegation with a predefined scope')
  .requiredOption('--to <address>', 'Delegate address')
  .option('--profile <name>', 'Profile name', 'default')
  .requiredOption(
    '--scope <type>',
    'Scope type: erc20TransferAmount, erc20PeriodTransfer, erc20Streaming, erc721Transfer, nativeTokenTransferAmount, nativeTokenPeriodTransfer, nativeTokenStreaming, functionCall, ownershipTransfer',
  )
  // Token scopes
  .option('--tokenAddress <address>', 'ERC-20/721 token contract address')
  .option('--maxAmount <amount>', "Max amount (human readable, e.g. '10')")
  .option('--tokenId <id>', 'ERC-721 token ID')
  // Periodic scopes
  .option('--periodAmount <amount>', 'Amount per period (human readable)')
  .option('--periodDuration <seconds>', 'Period duration in seconds', parseInt)
  .option('--startDate <timestamp>', 'Start date (unix seconds)', parseInt)
  // Streaming scopes
  .option('--amountPerSecond <amount>', 'Streaming rate (human readable)')
  .option('--initialAmount <amount>', 'Initial released amount')
  .option('--startTime <timestamp>', 'Start time (unix seconds)', parseInt)
  // Function call scope
  .option(
    '--targets <addresses>',
    'Contract addresses (comma-separated)',
    commaSplit,
  )
  .option(
    '--selectors <sigs>',
    'Function signatures (comma-separated)',
    commaSplit,
  )
  .option('--valueLte <ether>', 'Max native token value per call')
  // Ownership transfer
  .option('--contractAddress <address>', 'Contract for ownership transfer')
  .action((opts) => {
    grant({
      profile: opts.profile,
      to: opts.to as Address,
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

// redeem
program
  .command('redeem')
  .description(
    'Redeem a delegation (scope-aware mode encodes calldata automatically)',
  )
  .requiredOption('--delegator <address>', 'Delegator address')
  .option('--profile <name>', 'Profile name', 'default')
  // Scope-aware mode
  .option(
    '--scope <type>',
    'Scope type (uses human-readable flags instead of raw calldata)',
  )
  .option('--to <address>', 'Recipient address for transfers')
  .option('--amount <amount>', 'Amount to transfer (human readable)')
  .option('--tokenAddress <address>', 'ERC-20/721 token contract address')
  .option('--tokenId <id>', 'ERC-721 token ID')
  .option(
    '--function <sig>',
    'Function signature (e.g. "approve(address,uint256)")',
  )
  .option('--args <values>', 'Function arguments (comma-separated)', commaSplit)
  .option('--contractAddress <address>', 'Contract for ownership transfer')
  // Raw mode (fallback)
  .option('--target <address>', 'Target contract address (raw mode)')
  .option('--callData <hex>', 'Calldata for execution (raw mode)')
  .option('--value <ether>', 'Native token value to send')
  .action((opts) => {
    if (!opts.scope && (!opts.target || !opts.callData)) {
      throw new Error(
        'Provide --scope for human-readable mode, or --target and --callData for raw mode.',
      );
    }

    if (opts.scope) {
      redeem({
        profile: opts.profile,
        delegator: opts.delegator as Address,
        scope: opts.scope,
        tokenAddress: opts.tokenAddress as Address | undefined,
        to: opts.to as Address | undefined,
        amount: opts.amount,
        tokenId: opts.tokenId,
        target: opts.target as Address | undefined,
        function: opts.function,
        args: opts.args,
        value: opts.value,
        contractAddress: opts.contractAddress as Address | undefined,
      });
    } else {
      redeem({
        profile: opts.profile,
        delegator: opts.delegator as Address,
        target: opts.target as Address,
        callData: opts.callData as Hex,
        value: opts.value,
      });
    }
  });

// revoke
program
  .command('revoke')
  .description('Revoke a delegation on-chain')
  .requiredOption('--to <address>', 'Delegate address to revoke')
  .option('--profile <name>', 'Profile name', 'default')
  .action((opts) => {
    revoke({ profile: opts.profile, to: opts.to as Address });
  });

// inspect
program
  .command('inspect')
  .description('Inspect delegations for your account')
  .option('--delegator <address>', 'Filter by delegator address')
  .option('--to <address>', 'Filter by delegate address')
  .option('--profile <name>', 'Profile name', 'default')
  .action((opts) => {
    inspect({
      profile: opts.profile,
      delegator: opts.delegator as Address | undefined,
      to: opts.to as Address | undefined,
    });
  });

program.parse();
