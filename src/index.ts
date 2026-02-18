#!/usr/bin/env node

import { Command } from 'commander';
import { init } from './commands/init.js';
import { create } from './commands/create.js';
import { show } from './commands/show.js';
import { status } from './commands/status.js';
import { balance } from './commands/balance.js';
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

program
  .command('balance')
  .description('Show native balance (and optional ERC-20 balance)')
  .option('--tokenAddress <address>', 'ERC-20 token contract address')
  .option('--profile <name>', 'Profile name', 'default')
  .action((opts) => {
    balance({
      profile: opts.profile,
      tokenAddress: opts.tokenAddress as Address | undefined,
    });
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
  .description('Redeem a delegation using a specific action type')
  .requiredOption('--from <address>', 'Delegator address')
  .requiredOption(
    '--action <type>',
    'Action type: erc20Transfer, erc721Transfer, nativeTransfer, functionCall, ownershipTransfer, raw',
  )
  .option('--profile <name>', 'Profile name', 'default')
  // erc20Transfer / erc721Transfer
  .option('--tokenAddress <address>', 'ERC-20/721 token contract address')
  .option('--to <address>', 'Recipient address')
  .option('--amount <amount>', 'Amount to transfer (human readable)')
  .option('--tokenId <id>', 'ERC-721 token ID')
  // functionCall
  .option('--target <address>', 'Target contract address')
  .option(
    '--function <sig>',
    'Function signature (e.g. "approve(address,uint256)")',
  )
  .option('--args <values>', 'Function arguments (comma-separated)', commaSplit)
  // ownershipTransfer
  .option('--contractAddress <address>', 'Contract for ownership transfer')
  // raw
  .option('--callData <hex>', 'Calldata for execution (raw mode)')
  .option('--value <ether>', 'Native token value to send')
  .action((opts) => {
    redeem({
      profile: opts.profile,
      from: opts.from as Address,
      action: opts.action,
      tokenAddress: opts.tokenAddress as Address | undefined,
      to: opts.to as Address | undefined,
      amount: opts.amount,
      tokenId: opts.tokenId,
      target: opts.target as Address | undefined,
      function: opts.function,
      args: opts.args,
      value: opts.value,
      contractAddress: opts.contractAddress as Address | undefined,
      callData: opts.callData as Hex | undefined,
    });
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
  .option('--from <address>', 'Filter by from address')
  .option('--to <address>', 'Filter by delegate address')
  .option('--profile <name>', 'Profile name', 'default')
  .action((opts) => {
    inspect({
      profile: opts.profile,
      from: opts.from as Address | undefined,
      to: opts.to as Address | undefined,
    });
  });

program.parse();
