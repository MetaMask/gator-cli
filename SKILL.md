---
name: gator-cli
description: Use when you need to operate the @metamask/gator-cli to initialize profiles, upgrade EOA to EIP-7702, grant/redeem/revoke ERC-7710 delegations, or inspect balances and delegations. Covers commands, required flags, scope-specific options, configuration locations, and common usage flows.
---

## Quick Reference

Use this skill to run the gator CLI from the repo and to choose the correct command/flags for delegation workflows.

## CLI Overview

- Binary name: `gator`
- Default profile: `default`
- Config path: `~/.gator-cli/permissions.json` (or `~/.gator-cli/profiles/<profile-name>.json`)
- Delegations local cache: `~/.gator-cli/delegations/<profile-name>.json` when storage not configured

## Configuration Requirements

Edit the profile config after `gator init`:

```json
{
  "delegationStorage": {
    "apiKey": "your-api-key",
    "apiKeyId": "your-api-key-id"
  },
  "rpcUrl": "https://your-rpc-url.com"
}
```

- `delegationStorage` is optional; when missing, delegations are stored locally.
- `rpcUrl` is required for on-chain actions.
- If you need a storage API key, tag `@osobotai` on X.

## Commands

### init

Generate a private key and save config. Errors if the profile already exists.

- `gator init [--chain <chain>] [--profile <profile-name>]`
- `--chain` values: `base`, `sepolia` (default: `base`)
- `--profile` default: `default`
- Prints: address, chain, and config file path.

### create

Upgrade an EOA to an EIP-7702 smart account. Uses the chain in your profile config.

- `gator create [--profile <profile-name>]`
- Requires the account to be funded with native token first.
- Prints: address, chain, and the upgrade transaction hash.

### show

Display the EOA address for a profile.

- `gator show [--profile <profile-name>]`

### status

Check config and on-chain account status.

- `gator status [--profile <profile-name>]`
- Prints: address, chain, config upgrade status, on-chain code presence, storage and RPC URL config.

### balance

Show native balance and optional ERC-20 balance.

- `gator balance [--tokenAddress <address>] [--profile <profile-name>]`
- If `--tokenAddress` is provided, prints ERC-20 balance and decimals-derived units.

### grant

Create, sign, and store a delegation with a predefined scope.

- `gator grant --to <to-address> --scope <type> [scope flags] [--profile <profile-name>]`

Scope flags:

- Token scopes: `--tokenAddress <token-address>`, `--maxAmount <amount>`, `--tokenId <id>`
- Periodic scopes: `--periodAmount <amount>`, `--periodDuration <seconds>`, `--startDate <timestamp>`
- Streaming scopes: `--amountPerSecond <amount>`, `--initialAmount <amount>`, `--startTime <timestamp>`
- Function call scope: `--targets <addresses>`, `--selectors <sigs>`
- Ownership transfer: `--contractAddress <contract-address>`
- Additional: `--valueLte <ether>` for `functionCall`

Supported scopes:

- `erc20TransferAmount`
- `erc20PeriodTransfer`
- `erc20Streaming`
- `erc721Transfer`
- `nativeTokenTransferAmount`
- `nativeTokenPeriodTransfer`
- `nativeTokenStreaming`
- `functionCall`
- `ownershipTransfer`

Grant flags per scope:

| Scope                       | Required Flags                                                          |
| --------------------------- | ----------------------------------------------------------------------- |
| `erc20TransferAmount`       | `--tokenAddress`, `--maxAmount`                                         |
| `erc20PeriodTransfer`       | `--tokenAddress`, `--periodAmount`, `--periodDuration`                  |
| `erc20Streaming`            | `--tokenAddress`, `--amountPerSecond`, `--initialAmount`, `--maxAmount` |
| `erc721Transfer`            | `--tokenAddress`, `--tokenId`                                           |
| `nativeTokenTransferAmount` | `--maxAmount`                                                           |
| `nativeTokenPeriodTransfer` | `--periodAmount`, `--periodDuration`                                    |
| `nativeTokenStreaming`      | `--amountPerSecond`, `--initialAmount`, `--maxAmount`                   |
| `functionCall`              | `--targets`, `--selectors`                                              |
| `ownershipTransfer`         | `--contractAddress`                                                     |

### redeem

Redeem a stored delegation. Two modes:

Scope-aware mode:

- `gator redeem --from <from-address> --scope <type> [scope flags] [--profile <profile-name>]`
- Scope-aware flags: `--to`, `--amount`, `--tokenAddress`, `--tokenId`, `--function`, `--args`, `--contractAddress`

Raw mode:

- `gator redeem --from <from-address> --target <contract-address> --callData <hex> [--value <ether>] [--profile <profile-name>]`

### revoke

Revoke a delegation on-chain. Revokes the first matching delegation.

- `gator revoke --to <to-address> [--profile <profile-name>]`

### inspect

Inspect delegations for your account.

- `gator inspect [--from <from-address>] [--to <to-address>] [--profile <profile-name>]`
- With no filters, prints both Given and Received.
- Printed fields: From, To, Authority, Caveats count, Signed flag.

## Redeem Flags per Scope

| Scope                       | Required Flags                        |
| --------------------------- | ------------------------------------- |
| `erc20TransferAmount`       | `--tokenAddress`, `--to`, `--amount`  |
| `erc20PeriodTransfer`       | `--tokenAddress`, `--to`, `--amount`  |
| `erc20Streaming`            | `--tokenAddress`, `--to`, `--amount`  |
| `erc721Transfer`            | `--tokenAddress`, `--to`, `--tokenId` |
| `nativeTokenTransferAmount` | `--to`, `--amount`                    |
| `nativeTokenPeriodTransfer` | `--to`, `--amount`                    |
| `nativeTokenStreaming`      | `--to`, `--amount`                    |
| `functionCall`              | `--target`, `--function`, `--args`    |
| `ownershipTransfer`         | `--contractAddress`, `--to`           |

## Example Flows

Initialize and upgrade:

```bash
gator init --profile <profile-name>
gator create --profile <profile-name>
```

Grant an ERC-20 transfer delegation:

```bash
gator grant --profile <profile-name> --to <to-address> --scope erc20TransferAmount \
  --tokenAddress <token-address> --maxAmount 50
```

Redeem in scope-aware mode:

```bash
gator redeem --profile <profile-name> --from <from-address> --scope erc20TransferAmount \
  --tokenAddress <token-address> --to <to-address> --amount 10
```

Redeem in raw mode:

```bash
gator redeem --profile <profile-name> --from <from-address> --target <contract-address> \
  --callData 0xa9059cbb...
```

Inspect delegations:

```bash
gator inspect --profile <profile-name>
gator inspect --profile <profile-name> --from <from-address>
gator inspect --profile <profile-name> --to <to-address>
```

Revoke a delegation:

```bash
gator revoke --profile <profile-name> --to <to-address>
```

## Operational Notes

- `--from` refers to the delegator address; `--to` refers to the delegate/recipient.
- `--targets` and `--selectors` are comma-separated lists.
- `--function` accepts a signature string like `"approve(address,uint256)"`.
- Scope-aware redeem requires `--scope` or the command must include `--target` and `--callData`.
