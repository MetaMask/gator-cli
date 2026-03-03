# @metamask/gator-cli

> **Alpha version:** This CLI stores your private key in a local JSON file (`~/.gator-cli/`). Do not use it with accounts holding significant funds.

## Installation

Yarn:

```sh
yarn add @metamask/gator-cli
```

## Quick Start

```bash
# 1. Initialize — generates a key and saves config to ~/.gator-cli/permissions.json (default profile)
gator init
gator init --chain baseSepolia   # or: sepolia
gator init --profile alice       # named profile

# 2. Fund the address shown, then configure storage + rpcUrl in ~/.gator-cli/permissions.json

# 3. Upgrade to EIP-7702 smart account
gator create

# 4. Grant a permission (use --allow to specify caveat types)
gator grant \
  --to 0xBOB \
  --allow erc20TransferAmount \
  --tokenAddress 0xUSDC \
  --maxAmount 50

# 5. Inspect delegations
gator inspect
```

## Commands

| Command   | Description                              |
| --------- | ---------------------------------------- |
| `init`    | Generate a private key and save config   |
| `create`  | Upgrade EOA to an EIP-7702 smart account |
| `show`    | Display the EOA address                  |
| `status`  | Check config and on-chain account status |
| `balance` | Show native or ERC-20 balance            |
| `grant`   | Create, sign, and store a delegation     |
| `redeem`  | Redeem a delegation using an action type |
| `revoke`  | Revoke a delegation on-chain             |
| `inspect` | View delegations for your account        |

Run `gator help <command>` for full flag details.

## Profiles

By default, gator uses the `default` profile at `~/.gator-cli/permissions.json`.
To use a named profile, pass `--profile <name>` to `init` and all other commands:

```bash
gator init --profile alice
gator status --profile alice
gator grant --profile alice --to 0xBOB --allow nativeTokenTransferAmount --maxAmount 1
```

Named profiles are stored at `~/.gator-cli/profiles/<name>.json`.

## Granting Permissions

Use the `grant` command with one or more `--allow <type>` flags to attach caveats to a delegation. Each caveat type has its own set of required flags.

### Examples

```bash
# Allow up to 50 USDC transfers
gator grant --to 0xBOB \
  --allow erc20TransferAmount \
  --tokenAddress 0xUSDC --maxAmount 50

# Allow up to 1 ETH in native token transfers, limited to 3 calls
gator grant --to 0xBOB \
  --allow nativeTokenTransferAmount --maxAmount 1 \
  --allow limitedCalls --limit 3

# Time-bounded delegation
gator grant --to 0xBOB \
  --allow nativeTokenTransferAmount --maxAmount 0.5 \
  --allow timestamp --afterTimestamp 1700000000 --beforeTimestamp 1800000000

# Restrict to specific redeemer addresses
gator grant --to 0xBOB \
  --allow nativeTokenTransferAmount --maxAmount 1 \
  --allow redeemer --redeemers 0xADDR1,0xADDR2
```

### Caveat Types

| Caveat Type                  | Required Flags                                                                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `erc20TransferAmount`        | `--tokenAddress`, `--maxAmount`                                                                                                         |
| `erc20PeriodTransfer`        | `--tokenAddress`, `--periodAmount`, `--periodDuration`                                                                                  |
| `erc20Streaming`             | `--tokenAddress`, `--amountPerSecond`, `--initialAmount`, `--maxAmount`                                                                 |
| `erc721Transfer`             | `--tokenAddress`, `--tokenId`                                                                                                           |
| `nativeTokenTransferAmount`  | `--maxAmount`                                                                                                                           |
| `nativeTokenPeriodTransfer`  | `--periodAmount`, `--periodDuration`                                                                                                    |
| `nativeTokenStreaming`       | `--amountPerSecond`, `--initialAmount`, `--maxAmount`                                                                                   |
| `ownershipTransfer`          | `--contractAddress`                                                                                                                     |
| `limitedCalls`               | `--limit`                                                                                                                               |
| `timestamp`                  | `--afterTimestamp`, `--beforeTimestamp`                                                                                                  |
| `blockNumber`                | `--afterBlock`, `--beforeBlock`                                                                                                         |
| `redeemer`                   | `--redeemers` (comma-separated)                                                                                                         |
| `nonce`                      | `--nonce` (hex)                                                                                                                         |
| `id`                         | `--caveatId`                                                                                                                            |
| `valueLte`                   | `--maxValue`                                                                                                                            |
| `allowedTargets`             | `--allowedTargets` (comma-separated)                                                                                                    |
| `allowedMethods`             | `--allowedMethods` (comma-separated)                                                                                                    |
| `allowedCalldata`            | `--calldataStartIndex`, `--calldataValue`                                                                                               |
| `argsEqualityCheck`          | `--argsCheck` (hex)                                                                                                                     |
| `exactCalldata`              | `--exactCalldata` (hex)                                                                                                                 |
| `exactExecution`             | `--execTarget`                                                                                                                          |
| `nativeTokenPayment`         | `--paymentRecipient`, `--paymentAmount`                                                                                                 |
| `nativeBalanceChange`        | `--nativeBalanceRecipient`, `--nativeBalanceAmount`, `--nativeBalanceChangeType`                                                         |
| `erc20BalanceChange`         | `--erc20BalanceToken`, `--erc20BalanceRecipient`, `--erc20BalanceAmount`, `--erc20BalanceChangeType`                                    |
| `erc721BalanceChange`        | `--erc721BalanceToken`, `--erc721BalanceRecipient`, `--erc721BalanceAmount`, `--erc721BalanceChangeType`                                |
| `erc1155BalanceChange`       | `--erc1155BalanceToken`, `--erc1155BalanceRecipient`, `--erc1155BalanceTokenId`, `--erc1155BalanceAmount`, `--erc1155BalanceChangeType` |
| `deployed`                   | `--deployAddress`, `--deploySalt`, `--deployBytecode`                                                                                   |

### Optional Flags

Some caveats accept optional flags with sensible defaults:

- **Periodic caveats** (`erc20PeriodTransfer`, `nativeTokenPeriodTransfer`): `--startDate` defaults to the current timestamp.
- **Streaming caveats** (`erc20Streaming`, `nativeTokenStreaming`): `--startTime` defaults to the current timestamp.
- **`timestamp`**: both `--afterTimestamp` and `--beforeTimestamp` default to `0` (no bound) when omitted.
- **`blockNumber`**: both `--afterBlock` and `--beforeBlock` default to `0` when omitted.
- **`exactExecution`**: `--execValue` defaults to `0` and `--execCalldata` defaults to `0x`.

## Redeeming Permissions

`redeem` requires an `--action` flag that determines how the execution calldata is built.

```bash
# Transfer 10 USDC using a delegation from 0xALICE
gator redeem \
  --from 0xALICE --action erc20Transfer \
  --tokenAddress 0xUSDC --to 0xCHARLIE --amount 10

# Transfer an NFT
gator redeem \
  --from 0xALICE --action erc721Transfer \
  --tokenAddress 0xNFT --to 0xCHARLIE --tokenId 42

# Send 0.5 ETH
gator redeem \
  --from 0xALICE --action nativeTransfer \
  --to 0xCHARLIE --amount 0.5

# Call a contract function
gator redeem \
  --from 0xALICE --action functionCall \
  --target 0xUSDC --function "approve(address,uint256)" \
  --args "0xSPENDER,1000000"

# Transfer contract ownership
gator redeem \
  --from 0xALICE --action ownershipTransfer \
  --contractAddress 0xCONTRACT --to 0xNEW_OWNER

# Raw mode — pass pre-encoded calldata directly
gator redeem \
  --from 0xALICE --action raw \
  --target 0xUSDC --callData 0xa9059cbb...
```

### Redeem Flags per Action

| Action              | Required Flags                        |
| ------------------- | ------------------------------------- |
| `erc20Transfer`     | `--tokenAddress`, `--to`, `--amount`  |
| `erc721Transfer`    | `--tokenAddress`, `--to`, `--tokenId` |
| `nativeTransfer`    | `--to`, `--amount`                    |
| `functionCall`      | `--target`, `--function`, `--args`    |
| `ownershipTransfer` | `--contractAddress`, `--to`           |
| `raw`               | `--target`, `--callData`              |

## Balance

```bash
# Native balance
gator balance

# ERC-20 balance
gator balance --tokenAddress 0xUSDC
```

## Configuration

After `gator init`, edit the profile config to add your delegation storage credentials and RPC URL:

```json
{
  "delegationStorage": {
    "apiKey": "your-api-key",
    "apiKeyId": "your-api-key-id"
  },
  "rpcUrl": "https://your-rpc-url.com"
}
```

If `delegationStorage` is not configured, delegations are stored locally in
`~/.gator-cli/delegations/<profile>.json`.

Then run `gator create` to upgrade the EOA to an EIP-7702 smart account.

## Documentation

[Head to the MetaMask Smart Accounts Kit documentation](https://docs.metamask.io/smart-accounts-kit/) to learn more about the delegation framework.

## Useful Links

- [MetaMask Smart Accounts Kit Quick Start](https://docs.metamask.io/smart-accounts-kit/get-started/quickstart/)
- [Caveats Reference](https://docs.metamask.io/smart-accounts-kit/reference/delegation/caveats)
- [ERC-7710 Specification](https://eips.ethereum.org/EIPS/eip-7710)
- [MetaMask Smart Accounts Kit docs](https://docs.metamask.io/smart-accounts-kit)
