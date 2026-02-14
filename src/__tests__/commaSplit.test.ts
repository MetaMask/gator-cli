import { describe, it, expect } from "vitest";
import { commaSplit } from "../lib/utils.js";

describe("commaSplit", () => {
  it("splits a comma-separated string into trimmed parts", () => {
    expect(commaSplit("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("trims whitespace around each value", () => {
    expect(commaSplit("a , b , c")).toEqual(["a", "b", "c"]);
  });

  it("handles a single value with no commas", () => {
    expect(commaSplit("0xabc")).toEqual(["0xabc"]);
  });

  it("handles addresses separated by commas", () => {
    const result = commaSplit(
      "0x1234567890abcdef1234567890abcdef12345678,0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    );
    expect(result).toEqual([
      "0x1234567890abcdef1234567890abcdef12345678",
      "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    ]);
  });

  it("preserves empty segments from consecutive commas", () => {
    expect(commaSplit("a,,b")).toEqual(["a", "", "b"]);
  });

  it("returns an array with one empty string for empty input", () => {
    expect(commaSplit("")).toEqual([""]);
  });
});
