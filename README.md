# @metamask/gator-cli

## Installation

Yarn:

```sh
yarn install @metamask/gator-cli
```

## Quick Start

```bash
# 1. Initialize — generates a key and saves config to ~/.gator-cli/permissions.json
@metamask/gator-cli init
@metamask/gator-cli init --chain baseSepolia   # or: sepolia

# 2. Fund the address shown, then configure storage + bundler in ~/.gator-cli/permissions.json

# 3. Upgrade to EIP-7702 smart account
@metamask/gator-cli create

# 4. Grant a permission
@metamask/gator-cli grantPermission \
  --delegate 0xBOB \
  --scope erc20TransferAmount \
  --tokenAddress 0xUSDC \
  --maxAmount 50

# 5. Inspect delegations
@metamask/gator-cli inspect
```

## Commands

| Command            | Description                                   |
| ------------------ | --------------------------------------------- |
| `init`             | Generate a private key and save config        |
| `create`           | Upgrade EOA to an EIP-7702 smart account      |
| `show`             | Display the EOA address                       |
| `status`           | Check config and on-chain account status      |
| `grantPermission`  | Create, sign, and store a delegation          |
| `redeemPermission` | Redeem a delegation (scope-aware or raw mode) |
| `revokePermission` | Revoke a delegation on-chain                  |
| `inspect`          | View delegations for your account             |

Run `@metamask/gator-cli help <command>` for full flag details.

## Scopes

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

## Redeeming Permissions

`redeemPermission` supports two modes:

**Scope-aware mode** -- the CLI encodes calldata for you:

```bash
# Transfer 10 USDC using a delegation from 0xALICE
@metamask/gator-cli redeemPermission \
  --delegator 0xALICE --scope erc20Transfer \
  --tokenAddress 0xUSDC --to 0xCHARLIE --amount 10

# Send 0.5 ETH
@metamask/gator-cli redeemPermission \
  --delegator 0xALICE --scope nativeTransfer \
  --to 0xCHARLIE --amount 0.5

# Call a contract function
@metamask/gator-cli redeemPermission \
  --delegator 0xALICE --scope functionCall \
  --target 0xUSDC --function "approve(address,uint256)" \
  --args "0xSPENDER,1000000"
```

**Raw mode** -- pass pre-encoded calldata directly:

```bash
@metamask/gator-cli redeemPermission \
  --delegator 0xALICE --target 0xUSDC --callData 0xa9059cbb...
```

### Redeem Flags per Scope

| Scope               | Required Flags                        |
| ------------------- | ------------------------------------- |
| `erc20Transfer`     | `--tokenAddress`, `--to`, `--amount`  |
| `erc721Transfer`    | `--tokenAddress`, `--to`, `--tokenId` |
| `nativeTransfer`    | `--to`, `--amount`                    |
| `functionCall`      | `--target`, `--function`, `--args`    |
| `ownershipTransfer` | `--contractAddress`, `--to`           |

## Configuration

After `@metamask/gator-cli init`, edit `~/.gator-cli/permissions.json` to add your delegation storage credentials and bundler URL:

```json
{
  "delegationStorage": {
    "apiKey": "your-api-key",
    "apiKeyId": "your-api-key-id"
  },
  "bundlerUrl": "https://your-bundler-rpc.com"
}
```

Then run `@metamask/gator-cli create` to upgrade the EOA to an EIP-7702 smart account.

## Documentation

[Head to the MetaMask Smart Accounts Kit documentation](https://docs.metamask.io/smart-accounts-kit/) to learn more about the delegation framework.

## Useful Links

- [MetaMask Smart Accounts Kit Quick Start](https://docs.metamask.io/smart-accounts-kit/get-started/quickstart/)
- [ERC-7710 Specification](https://eips.ethereum.org/EIPS/eip-7710)
- [MetaMask Smart Accounts Kit docs](https://docs.metamask.io/smart-accounts-kit)
