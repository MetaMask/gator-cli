# gator-cli 🐊

ERC-7710 Delegation CLI — grant, redeem, and revoke permissions on MetaMask Smart Accounts.

Built with [`@metamask/smart-accounts-kit`](https://docs.metamask.io/smart-accounts-kit/) and [viem](https://viem.sh/).

## Install

```bash
yarn install
yarn build
```

## Commands

### `init`

Generate a private key and save to `~/.gator-cli/permissions.json`. Fund the address before upgrading.

```bash
gator-cli init                    # Default: Base
gator-cli init --chain sepolia    # Sepolia testnet
```

### `create`

Upgrade an existing EOA to an EIP-7702 smart account. Requires a funded account (run `init` first).

```bash
gator-cli create
```

### `show`

Display the EOA address.

```bash
gator-cli show
```

### `status`

Check account status — config, on-chain 7702 verification, storage & bundler config.

```bash
gator-cli status
```

### `grantPermission`

Create, sign, and store a delegation with a predefined scope. Token decimals are auto-read from the contract.

```bash
# ERC-20 transfer limit (10 USDC)
gator-cli grantPermission \
  --delegate 0xBOB \
  --scope erc20TransferAmount \
  --tokenAddress 0xUSDC \
  --maxAmount 10

# Native token transfer limit (0.1 ETH)
gator-cli grantPermission \
  --delegate 0xBOB \
  --scope nativeTokenTransferAmount \
  --maxAmount 0.1

# Native token periodic (0.01 ETH/day)
gator-cli grantPermission \
  --delegate 0xBOB \
  --scope nativeTokenPeriodTransfer \
  --periodAmount 0.01 \
  --periodDuration 86400

# ERC-20 streaming
gator-cli grantPermission \
  --delegate 0xBOB \
  --scope erc20Streaming \
  --tokenAddress 0xUSDC \
  --amountPerSecond 0.1 \
  --initialAmount 10 \
  --maxAmount 100

# Function call (multiple targets & selectors)
gator-cli grantPermission \
  --delegate 0xBOB \
  --scope functionCall \
  --targets "0xAAA,0xBBB" \
  --selectors "approve(address,uint256),transfer(address,uint256)"

# Ownership transfer
gator-cli grantPermission \
  --delegate 0xBOB \
  --scope ownershipTransfer \
  --contractAddress 0xCONTRACT

# ERC-721 transfer
gator-cli grantPermission \
  --delegate 0xBOB \
  --scope erc721Transfer \
  --tokenAddress 0xNFT \
  --tokenId 42
```

### `redeemPermission`

Redeem a delegation. Automatically looks up the delegation from storage by delegator+delegate pair.

```bash
gator-cli redeemPermission \
  --delegator 0xALICE \
  --target 0xUSDC \
  --callData 0x... \
  --value 0
```

### `revokePermission`

Revoke a delegation on-chain.

```bash
gator-cli revokePermission --delegate 0xBOB
```

### `inspect`

View delegations for your account.

```bash
gator-cli inspect                          # All delegations
gator-cli inspect --delegator 0xALICE      # From specific delegator
gator-cli inspect --delegate 0xBOB         # To specific delegate
```

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

## Configuration

After `init`, edit `~/.gator-cli/permissions.json` to add:

```json
{
  "delegationStorage": {
    "apiKey": "your-api-key",
    "apiKeyId": "your-api-key-id"
  },
  "bundlerUrl": "https://your-bundler-rpc.com"
}
```

Then run `gator-cli create` to upgrade the EOA to an EIP-7702 smart account.

## License

MIT
