import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseEther } from "viem";
import type { PublicClient } from "viem";
import { buildScope } from "../lib/scopes.js";
import type { GrantOptions } from "../types.js";

vi.mock("../lib/token.js", () => ({
  getTokenDecimals: vi.fn().mockResolvedValue(6),
}));

const DELEGATE = "0xEC12d2450934E3c158129D0B387739506C789b07" as const;
const TOKEN = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;
const CONTRACT = "0x0000000000000000000000000000000000000001" as const;

const mockPublicClient = {} as PublicClient;

function makeOpts(overrides: Partial<GrantOptions>): GrantOptions {
  return { delegate: DELEGATE, scope: "erc20TransferAmount", ...overrides };
}

describe("buildScope – validation", () => {
  it("throws for unknown scope type", async () => {
    await expect(
      buildScope(makeOpts({ scope: "unknownScope" }), mockPublicClient),
    ).rejects.toThrow("Unknown scope type");
  });

  it("throws when erc20TransferAmount is missing tokenAddress", async () => {
    await expect(
      buildScope(
        makeOpts({ scope: "erc20TransferAmount", maxAmount: "10" }),
        mockPublicClient,
      ),
    ).rejects.toThrow("--tokenAddress required");
  });

  it("throws when erc20TransferAmount is missing maxAmount", async () => {
    await expect(
      buildScope(
        makeOpts({
          scope: "erc20TransferAmount",
          tokenAddress: TOKEN,
        }),
        mockPublicClient,
      ),
    ).rejects.toThrow("--maxAmount required");
  });

  it("throws when erc721Transfer is missing tokenAddress", async () => {
    await expect(
      buildScope(
        makeOpts({ scope: "erc721Transfer", tokenId: "1" }),
        mockPublicClient,
      ),
    ).rejects.toThrow("--tokenAddress required");
  });

  it("throws when erc721Transfer is missing tokenId", async () => {
    await expect(
      buildScope(
        makeOpts({ scope: "erc721Transfer", tokenAddress: TOKEN }),
        mockPublicClient,
      ),
    ).rejects.toThrow("--tokenId required");
  });

  it("throws when nativeTokenPeriodTransfer is missing periodAmount", async () => {
    await expect(
      buildScope(
        makeOpts({
          scope: "nativeTokenPeriodTransfer",
          periodDuration: 3600,
        }),
        mockPublicClient,
      ),
    ).rejects.toThrow("--periodAmount required");
  });

  it("throws when nativeTokenPeriodTransfer is missing periodDuration", async () => {
    await expect(
      buildScope(
        makeOpts({
          scope: "nativeTokenPeriodTransfer",
          periodAmount: "1",
        }),
        mockPublicClient,
      ),
    ).rejects.toThrow("--periodDuration required");
  });

  it("throws when nativeTokenStreaming is missing amountPerSecond", async () => {
    await expect(
      buildScope(
        makeOpts({
          scope: "nativeTokenStreaming",
          initialAmount: "1",
          maxAmount: "100",
        }),
        mockPublicClient,
      ),
    ).rejects.toThrow("--amountPerSecond required");
  });

  it("throws when functionCall is missing targets", async () => {
    await expect(
      buildScope(
        makeOpts({
          scope: "functionCall",
          selectors: ["0x12345678"],
        }),
        mockPublicClient,
      ),
    ).rejects.toThrow("--targets required");
  });

  it("throws when functionCall is missing selectors", async () => {
    await expect(
      buildScope(
        makeOpts({
          scope: "functionCall",
          targets: [CONTRACT],
        }),
        mockPublicClient,
      ),
    ).rejects.toThrow("--selectors required");
  });

  it("throws when ownershipTransfer is missing contractAddress", async () => {
    await expect(
      buildScope(
        makeOpts({ scope: "ownershipTransfer" }),
        mockPublicClient,
      ),
    ).rejects.toThrow("--contractAddress required");
  });
});

describe("buildScope – nativeTokenPeriodTransfer", () => {
  it("returns correct shape with parsed ether values", async () => {
    const scope = await buildScope(
      makeOpts({
        scope: "nativeTokenPeriodTransfer",
        periodAmount: "1.5",
        periodDuration: 3600,
        startDate: 1700000000,
      }),
      mockPublicClient,
    );
    expect(scope).toEqual({
      type: "nativeTokenPeriodTransfer",
      periodAmount: parseEther("1.5"),
      periodDuration: 3600,
      startDate: 1700000000,
    });
  });

  it("defaults startDate to current timestamp when not provided", async () => {
    const before = Math.floor(Date.now() / 1000);
    const scope = await buildScope(
      makeOpts({
        scope: "nativeTokenPeriodTransfer",
        periodAmount: "1",
        periodDuration: 86400,
      }),
      mockPublicClient,
    );
    const after = Math.floor(Date.now() / 1000);

    expect(scope.type).toBe("nativeTokenPeriodTransfer");
    expect((scope as any).startDate).toBeGreaterThanOrEqual(before);
    expect((scope as any).startDate).toBeLessThanOrEqual(after);
  });
});

describe("buildScope – nativeTokenStreaming", () => {
  it("returns correct shape with parsed ether values", async () => {
    const scope = await buildScope(
      makeOpts({
        scope: "nativeTokenStreaming",
        amountPerSecond: "0.001",
        initialAmount: "0.5",
        maxAmount: "100",
        startTime: 1700000000,
      }),
      mockPublicClient,
    );
    expect(scope).toEqual({
      type: "nativeTokenStreaming",
      amountPerSecond: parseEther("0.001"),
      initialAmount: parseEther("0.5"),
      maxAmount: parseEther("100"),
      startTime: 1700000000,
    });
  });
});

describe("buildScope – erc721Transfer", () => {
  it("converts tokenId to bigint", async () => {
    const scope = await buildScope(
      makeOpts({
        scope: "erc721Transfer",
        tokenAddress: TOKEN,
        tokenId: "42",
      }),
      mockPublicClient,
    );
    expect(scope).toEqual({
      type: "erc721Transfer",
      tokenAddress: TOKEN,
      tokenId: 42n,
    });
  });
});

describe("buildScope – functionCall", () => {
  it("returns targets and selectors", async () => {
    const scope = await buildScope(
      makeOpts({
        scope: "functionCall",
        targets: [CONTRACT],
        selectors: ["0xa9059cbb"],
      }),
      mockPublicClient,
    );
    expect(scope).toEqual({
      type: "functionCall",
      targets: [CONTRACT],
      selectors: ["0xa9059cbb"],
    });
  });

  it("includes valueLte when provided", async () => {
    const scope = await buildScope(
      makeOpts({
        scope: "functionCall",
        targets: [CONTRACT],
        selectors: ["0xa9059cbb"],
        valueLte: "1.0",
      }),
      mockPublicClient,
    );
    expect(scope).toEqual({
      type: "functionCall",
      targets: [CONTRACT],
      selectors: ["0xa9059cbb"],
      valueLte: { maxValue: parseEther("1.0") },
    });
  });
});

describe("buildScope – ownershipTransfer", () => {
  it("returns correct shape", async () => {
    const scope = await buildScope(
      makeOpts({
        scope: "ownershipTransfer",
        contractAddress: CONTRACT,
      }),
      mockPublicClient,
    );
    expect(scope).toEqual({
      type: "ownershipTransfer",
      contractAddress: CONTRACT,
    });
  });
});

describe("buildScope – erc20TransferAmount (mocked decimals=6)", () => {
  it("parses maxAmount with token decimals", async () => {
    const scope = await buildScope(
      makeOpts({
        scope: "erc20TransferAmount",
        tokenAddress: TOKEN,
        maxAmount: "10",
      }),
      mockPublicClient,
    );
    expect(scope).toEqual({
      type: "erc20TransferAmount",
      tokenAddress: TOKEN,
      maxAmount: 10_000_000n, // 10 * 10^6
    });
  });
});
