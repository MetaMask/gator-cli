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
function collect(val: string, arr: string[]) {
  arr.push(val);
  return arr;
}

program
  .command('grant')
  .description('Create, sign, and store a delegation with caveats')
  .requiredOption('--to <address>', 'Delegate address')
  .option('--profile <name>', 'Profile name', 'default')
  .option(
    '--allow <type>',
    'Allow permission type (list): erc20TransferAmount, erc20PeriodTransfer, erc20Streaming, erc721Transfer, nativeTokenTransferAmount, nativeTokenPeriodTransfer, nativeTokenStreaming, ownershipTransfer, functionCall, limitedCalls, timestamp, blockNumber, redeemer, nonce, id, valueLte, allowedTargets, allowedMethods, allowedCalldata, argsEqualityCheck, exactCalldata, nativeTokenPayment, nativeBalanceChange, erc20BalanceChange, erc721BalanceChange, erc1155BalanceChange, deployed, exactExecution, custom',
    collect,
    [],
  )
  // Token caveats
  .option('--tokenAddress <address>', 'ERC-20/721 token contract address')
  .option('--maxAmount <amount>', "Max amount (human readable, e.g. '10')")
  .option('--tokenId <id>', 'ERC-721 token ID')
  // Periodic caveats
  .option('--periodAmount <amount>', 'Amount per period (human readable)')
  .option('--periodDuration <seconds>', 'Period duration in seconds', parseInt)
  .option('--startDate <timestamp>', 'Start date (unix seconds)', parseInt)
  // Streaming caveats
  .option('--amountPerSecond <amount>', 'Streaming rate (human readable)')
  .option('--initialAmount <amount>', 'Initial released amount')
  .option('--startTime <timestamp>', 'Start time (unix seconds)', parseInt)
  // Ownership transfer
  .option('--contractAddress <address>', 'Contract for ownership transfer')
  // limitedCalls
  .option('--limit <n>', 'Max number of redemptions', parseInt)
  // timestamp
  .option(
    '--afterTimestamp <seconds>',
    'Valid after timestamp (unix seconds)',
    parseInt,
  )
  .option(
    '--beforeTimestamp <seconds>',
    'Valid before timestamp (unix seconds)',
    parseInt,
  )
  // blockNumber
  .option('--afterBlock <number>', 'Valid after block number')
  .option('--beforeBlock <number>', 'Valid before block number')
  // redeemer
  .option(
    '--redeemers <addresses>',
    'Allowed redeemer addresses (comma-separated)',
    commaSplit,
  )
  // nonce
  .option('--nonce <hex>', 'Nonce for bulk revocation')
  // id
  .option('--caveatId <number>', 'Caveat ID for mutual revocation')
  // valueLte
  .option('--maxValue <ether>', 'Max native token value per call')
  // allowedTargets
  .option(
    '--allowedTargets <addresses>',
    'Allowed target addresses (comma-separated)',
    commaSplit,
  )
  // allowedMethods
  .option(
    '--allowedMethods <selectors>',
    'Allowed method selectors (comma-separated)',
    commaSplit,
  )
  // allowedCalldata
  .option('--calldataStartIndex <n>', 'Calldata start index', parseInt)
  .option('--calldataValue <hex>', 'Expected calldata value')
  // argsEqualityCheck
  .option('--argsCheck <hex>', 'Expected args for equality check')
  // exactCalldata
  .option('--exactCalldata <hex>', 'Exact calldata to match')
  // nativeTokenPayment
  .option('--paymentRecipient <address>', 'Payment recipient address')
  .option('--paymentAmount <ether>', 'Payment amount in ether')
  // nativeBalanceChange
  .option(
    '--nativeBalanceRecipient <address>',
    'Native balance check recipient',
  )
  .option('--nativeBalanceAmount <amount>', 'Native balance change amount')
  .option(
    '--nativeBalanceChangeType <type>',
    'Balance change type (increase|decrease)',
  )
  // erc20BalanceChange
  .option(
    '--erc20BalanceToken <address>',
    'ERC-20 balance change token address',
  )
  .option('--erc20BalanceRecipient <address>', 'ERC-20 balance check recipient')
  .option('--erc20BalanceAmount <amount>', 'ERC-20 balance change amount')
  .option(
    '--erc20BalanceChangeType <type>',
    'ERC-20 balance change type (increase|decrease)',
  )
  // erc721BalanceChange
  .option(
    '--erc721BalanceToken <address>',
    'ERC-721 balance change token address',
  )
  .option(
    '--erc721BalanceRecipient <address>',
    'ERC-721 balance check recipient',
  )
  .option('--erc721BalanceAmount <amount>', 'ERC-721 balance change amount')
  .option(
    '--erc721BalanceChangeType <type>',
    'ERC-721 balance change type (increase|decrease)',
  )
  // erc1155BalanceChange
  .option(
    '--erc1155BalanceToken <address>',
    'ERC-1155 balance change token address',
  )
  .option(
    '--erc1155BalanceRecipient <address>',
    'ERC-1155 balance check recipient',
  )
  .option('--erc1155BalanceTokenId <id>', 'ERC-1155 token ID')
  .option('--erc1155BalanceAmount <amount>', 'ERC-1155 balance change amount')
  .option(
    '--erc1155BalanceChangeType <type>',
    'ERC-1155 balance change type (increase|decrease)',
  )
  // deployed
  .option('--deployAddress <address>', 'Contract address for deploy check')
  .option('--deploySalt <hex>', 'Salt for deploy check')
  .option('--deployBytecode <hex>', 'Bytecode for deploy check')
  // exactExecution
  .option('--execTarget <address>', 'Exact execution target address')
  .option('--execValue <ether>', 'Exact execution value')
  .option('--execCalldata <hex>', 'Exact execution calldata')
  // custom caveat enforcer
  .option(
    '--enforcerAddress <address>',
    'Custom caveat enforcer contract address',
  )
  .option(
    '--enforcerTerms <hex>',
    'ABI-encoded terms for custom caveat enforcer',
  )
  .action((opts) => {
    grant({
      profile: opts.profile,
      to: opts.to as Address,
      allow: opts.allow,
      tokenAddress: opts.tokenAddress as Address | undefined,
      maxAmount: opts.maxAmount,
      tokenId: opts.tokenId,
      periodAmount: opts.periodAmount,
      periodDuration: opts.periodDuration,
      startDate: opts.startDate,
      amountPerSecond: opts.amountPerSecond,
      initialAmount: opts.initialAmount,
      startTime: opts.startTime,
      contractAddress: opts.contractAddress as Address | undefined,
      limit: opts.limit,
      afterTimestamp: opts.afterTimestamp,
      beforeTimestamp: opts.beforeTimestamp,
      afterBlock: opts.afterBlock,
      beforeBlock: opts.beforeBlock,
      redeemers: opts.redeemers,
      nonce: opts.nonce as Hex | undefined,
      caveatId: opts.caveatId,
      maxValue: opts.maxValue,
      allowedTargets: opts.allowedTargets,
      allowedMethods: opts.allowedMethods,
      calldataStartIndex: opts.calldataStartIndex,
      calldataValue: opts.calldataValue as Hex | undefined,
      argsCheck: opts.argsCheck as Hex | undefined,
      exactCalldata: opts.exactCalldata as Hex | undefined,
      paymentRecipient: opts.paymentRecipient as Address | undefined,
      paymentAmount: opts.paymentAmount,
      nativeBalanceRecipient: opts.nativeBalanceRecipient as
        | Address
        | undefined,
      nativeBalanceAmount: opts.nativeBalanceAmount,
      nativeBalanceChangeType: opts.nativeBalanceChangeType,
      erc20BalanceToken: opts.erc20BalanceToken as Address | undefined,
      erc20BalanceRecipient: opts.erc20BalanceRecipient as Address | undefined,
      erc20BalanceAmount: opts.erc20BalanceAmount,
      erc20BalanceChangeType: opts.erc20BalanceChangeType,
      erc721BalanceToken: opts.erc721BalanceToken as Address | undefined,
      erc721BalanceRecipient: opts.erc721BalanceRecipient as
        | Address
        | undefined,
      erc721BalanceAmount: opts.erc721BalanceAmount,
      erc721BalanceChangeType: opts.erc721BalanceChangeType,
      erc1155BalanceToken: opts.erc1155BalanceToken as Address | undefined,
      erc1155BalanceRecipient: opts.erc1155BalanceRecipient as
        | Address
        | undefined,
      erc1155BalanceTokenId: opts.erc1155BalanceTokenId,
      erc1155BalanceAmount: opts.erc1155BalanceAmount,
      erc1155BalanceChangeType: opts.erc1155BalanceChangeType,
      deployAddress: opts.deployAddress as Address | undefined,
      deploySalt: opts.deploySalt as Hex | undefined,
      deployBytecode: opts.deployBytecode as Hex | undefined,
      execTarget: opts.execTarget as Address | undefined,
      execValue: opts.execValue,
      execCalldata: opts.execCalldata as Hex | undefined,
      enforcerAddress: opts.enforcerAddress as Address | undefined,
      enforcerTerms: opts.enforcerTerms as Hex | undefined,
    });
  });

// redeem
program
  .command('redeem')
  .description('Redeem a delegation using a specific action type')
  .option('--from <address>', 'Delegator address')
  .option('--delegationHash <hash>', 'Delegation hash to redeem directly')
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
      from: opts.from as Address | undefined,
      delegationHash: opts.delegationHash as Hex | undefined,
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
