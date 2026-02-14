import { parseUnits, parseEther, type PublicClient } from "viem";
import { getTokenDecimals } from "./token.js";
import type { GrantOptions } from "../types.js";

export async function buildScope(
  opts: GrantOptions,
  publicClient: PublicClient,
) {
  const now = Math.floor(Date.now() / 1000);

  switch (opts.scope) {
    case "erc20TransferAmount": {
      if (!opts.tokenAddress) throw new Error("--tokenAddress required");
      if (!opts.maxAmount) throw new Error("--maxAmount required");
      const decimals = await getTokenDecimals(publicClient, opts.tokenAddress);
      return {
        type: "erc20TransferAmount" as const,
        tokenAddress: opts.tokenAddress,
        maxAmount: parseUnits(opts.maxAmount, decimals),
      };
    }

    case "erc20PeriodTransfer": {
      if (!opts.tokenAddress) throw new Error("--tokenAddress required");
      if (!opts.periodAmount) throw new Error("--periodAmount required");
      if (!opts.periodDuration) throw new Error("--periodDuration required");
      const decimals = await getTokenDecimals(publicClient, opts.tokenAddress);
      return {
        type: "erc20PeriodTransfer" as const,
        tokenAddress: opts.tokenAddress,
        periodAmount: parseUnits(opts.periodAmount, decimals),
        periodDuration: opts.periodDuration,
        startDate: opts.startDate ?? now,
      };
    }

    case "erc20Streaming": {
      if (!opts.tokenAddress) throw new Error("--tokenAddress required");
      if (!opts.amountPerSecond) throw new Error("--amountPerSecond required");
      if (!opts.initialAmount) throw new Error("--initialAmount required");
      if (!opts.maxAmount) throw new Error("--maxAmount required");
      const decimals = await getTokenDecimals(publicClient, opts.tokenAddress);
      return {
        type: "erc20Streaming" as const,
        tokenAddress: opts.tokenAddress,
        amountPerSecond: parseUnits(opts.amountPerSecond, decimals),
        initialAmount: parseUnits(opts.initialAmount, decimals),
        maxAmount: parseUnits(opts.maxAmount, decimals),
        startTime: opts.startTime ?? now,
      };
    }

    case "erc721Transfer": {
      if (!opts.tokenAddress) throw new Error("--tokenAddress required");
      if (!opts.tokenId) throw new Error("--tokenId required");
      return {
        type: "erc721Transfer" as const,
        tokenAddress: opts.tokenAddress,
        tokenId: BigInt(opts.tokenId),
      };
    }

    case "nativeTokenPeriodTransfer": {
      if (!opts.periodAmount) throw new Error("--periodAmount required");
      if (!opts.periodDuration) throw new Error("--periodDuration required");
      return {
        type: "nativeTokenPeriodTransfer" as const,
        periodAmount: parseEther(opts.periodAmount),
        periodDuration: opts.periodDuration,
        startDate: opts.startDate ?? now,
      };
    }

    case "nativeTokenStreaming": {
      if (!opts.amountPerSecond) throw new Error("--amountPerSecond required");
      if (!opts.initialAmount) throw new Error("--initialAmount required");
      if (!opts.maxAmount) throw new Error("--maxAmount required");
      return {
        type: "nativeTokenStreaming" as const,
        amountPerSecond: parseEther(opts.amountPerSecond),
        initialAmount: parseEther(opts.initialAmount),
        maxAmount: parseEther(opts.maxAmount),
        startTime: opts.startTime ?? now,
      };
    }

    case "functionCall": {
      if (!opts.targets?.length) throw new Error("--targets required");
      if (!opts.selectors?.length) throw new Error("--selectors required");
      return {
        type: "functionCall" as const,
        targets: opts.targets,
        selectors: opts.selectors,
        ...(opts.valueLte && {
          valueLte: { maxValue: parseEther(opts.valueLte) },
        }),
      };
    }

    case "ownershipTransfer": {
      if (!opts.contractAddress) throw new Error("--contractAddress required");
      return {
        type: "ownershipTransfer" as const,
        contractAddress: opts.contractAddress,
      };
    }

    default:
      throw new Error(`❌ Unknown scope type: ${opts.scope}`);
  }
}
