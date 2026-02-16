# @metamask/gator-cli

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

# 4. Grant a permission
gator grant \
  --to 0xBOB \
  --scope erc20TransferAmount \
  --tokenAddress 0xUSDC \
  --maxAmount 50

# 5. Inspect delegations
gator inspect
```

## Commands

| Command   | Description                                   |
| --------- | --------------------------------------------- |
| `init`    | Generate a private key and save config        |
| `create`  | Upgrade EOA to an EIP-7702 smart account      |
| `show`    | Display the EOA address                       |
| `status`  | Check config and on-chain account status      |
| `grant`   | Create, sign, and store a delegation          |
| `redeem`  | Redeem a delegation (scope-aware or raw mode) |
| `revoke`  | Revoke a delegation on-chain                  |
| `inspect` | View delegations for your account             |

Run `gator help <command>` for full flag details.

## Profiles

By default, gator uses the `default` profile at `~/.gator-cli/permissions.json`.
To use a named profile, pass `--profile <name>` to `init` and all other commands:

```bash
gator init --profile alice
gator status --profile alice
gator grant --profile alice --to 0xBOB --scope erc20TransferAmount --tokenAddress 0xUSDC --maxAmount 50
```

Named profiles are stored at `~/.gator-cli/profiles/<name>.json`.

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

`redeem` supports two modes:

**Scope-aware mode** -- the CLI encodes calldata for you:

```bash
# Transfer 10 USDC using a delegation from 0xALICE
gator redeem \
  --delegator 0xALICE --scope erc20TransferAmount \
  --tokenAddress 0xUSDC --to 0xCHARLIE --amount 10

# Send 0.5 ETH
gator redeem \
  --delegator 0xALICE --scope nativeTokenTransferAmount \
  --to 0xCHARLIE --amount 0.5

# Call a contract function
gator redeem \
  --delegator 0xALICE --scope functionCall \
  --target 0xUSDC --function "approve(address,uint256)" \
  --args "0xSPENDER,1000000"
```

**Raw mode** -- pass pre-encoded calldata directly:

```bash
gator redeem \
  --delegator 0xALICE --target 0xUSDC --callData 0xa9059cbb...
```

### Redeem Flags per Scope

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
- [ERC-7710 Specification](https://eips.ethereum.org/EIPS/eip-7710)
- [MetaMask Smart Accounts Kit docs](https://docs.metamask.io/smart-accounts-kit)
