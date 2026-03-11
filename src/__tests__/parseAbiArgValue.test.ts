import { describe, it, expect } from 'vitest';
import type { AbiParameter } from 'viem';
import { parseAbiArgValue } from '../lib/parseAbiArgValue.js';

function param(type: string, components?: AbiParameter[]): AbiParameter {
  if (components) {
    return { type, components } as AbiParameter;
  }
  return { type } as AbiParameter;
}

// -------------------------------------------------------------------------
// Integers
// -------------------------------------------------------------------------

describe('parseAbiArgValue – integers', () => {
  it('converts uint256 to BigInt', () => {
    expect(parseAbiArgValue('1000', param('uint256'))).toBe(1000n);
  });

  it('converts uint8 to BigInt', () => {
    expect(parseAbiArgValue('255', param('uint8'))).toBe(255n);
  });

  it('converts int256 to BigInt', () => {
    expect(parseAbiArgValue('-42', param('int256'))).toBe(-42n);
  });

  it('converts int128 to BigInt', () => {
    expect(parseAbiArgValue('100', param('int128'))).toBe(100n);
  });

  it('converts bare uint to BigInt', () => {
    expect(parseAbiArgValue('0', param('uint'))).toBe(0n);
  });

  it('converts bare int to BigInt', () => {
    expect(parseAbiArgValue('7', param('int'))).toBe(7n);
  });
});

// -------------------------------------------------------------------------
// Bool
// -------------------------------------------------------------------------

describe('parseAbiArgValue – bool', () => {
  it('converts "true" to true', () => {
    expect(parseAbiArgValue('true', param('bool'))).toBe(true);
  });

  it('converts "false" to false', () => {
    expect(parseAbiArgValue('false', param('bool'))).toBe(false);
  });

  it('converts any non-"true" string to false', () => {
    expect(parseAbiArgValue('yes', param('bool'))).toBe(false);
  });
});

// -------------------------------------------------------------------------
// Pass-through types (address, bytes, string)
// -------------------------------------------------------------------------

describe('parseAbiArgValue – pass-through', () => {
  it('passes address through as string', () => {
    const addr = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    expect(parseAbiArgValue(addr, param('address'))).toBe(addr);
  });

  it('passes bytes32 through as string', () => {
    const hex =
      '0xabcdef0000000000000000000000000000000000000000000000000000000000';
    expect(parseAbiArgValue(hex, param('bytes32'))).toBe(hex);
  });

  it('passes dynamic bytes through as string', () => {
    const hex = '0xdeadbeef';
    expect(parseAbiArgValue(hex, param('bytes'))).toBe(hex);
  });

  it('passes string through as string', () => {
    expect(parseAbiArgValue('hello', param('string'))).toBe('hello');
  });
});

// -------------------------------------------------------------------------
// Dynamic arrays
// -------------------------------------------------------------------------

describe('parseAbiArgValue – dynamic arrays', () => {
  it('parses uint256[] and converts each element to BigInt', () => {
    const result = parseAbiArgValue('[1,2,3]', param('uint256[]'));
    expect(result).toEqual([1n, 2n, 3n]);
  });

  it('parses address[] and passes each element through', () => {
    const a1 = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    const a2 = '0xEC12d2450934E3c158129D0B387739506C789b07';
    const result = parseAbiArgValue(JSON.stringify([a1, a2]), param('address[]'));
    expect(result).toEqual([a1, a2]);
  });

  it('parses bool[] correctly', () => {
    const result = parseAbiArgValue('[true,false,true]', param('bool[]'));
    expect(result).toEqual([true, false, true]);
  });

  it('handles empty array', () => {
    const result = parseAbiArgValue('[]', param('uint256[]'));
    expect(result).toEqual([]);
  });
});

// -------------------------------------------------------------------------
// Fixed-size arrays
// -------------------------------------------------------------------------

describe('parseAbiArgValue – fixed-size arrays', () => {
  it('parses uint256[3] and converts each element to BigInt', () => {
    const result = parseAbiArgValue('[10,20,30]', param('uint256[3]'));
    expect(result).toEqual([10n, 20n, 30n]);
  });

  it('parses address[2] and passes through', () => {
    const a1 = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    const a2 = '0xEC12d2450934E3c158129D0B387739506C789b07';
    const result = parseAbiArgValue(
      JSON.stringify([a1, a2]),
      param('address[2]'),
    );
    expect(result).toEqual([a1, a2]);
  });
});

// -------------------------------------------------------------------------
// Tuples
// -------------------------------------------------------------------------

describe('parseAbiArgValue – tuples', () => {
  it('parses tuple with named keys from JSON object', () => {
    const components: AbiParameter[] = [
      { name: 'recipient', type: 'address' } as AbiParameter,
      { name: 'amount', type: 'uint256' } as AbiParameter,
    ];

    const addr = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    const value = JSON.stringify({ recipient: addr, amount: '500' });
    const result = parseAbiArgValue(value, param('tuple', components));

    expect(result).toEqual([addr, 500n]);
  });

  it('parses tuple with positional index from JSON array', () => {
    const components: AbiParameter[] = [
      { name: 'to', type: 'address' } as AbiParameter,
      { name: 'flag', type: 'bool' } as AbiParameter,
    ];

    const addr = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    const value = JSON.stringify([addr, 'true']);
    const result = parseAbiArgValue(value, param('tuple', components));

    expect(result).toEqual([addr, true]);
  });

  it('handles nested tuple with integer fields', () => {
    const innerComponents: AbiParameter[] = [
      { name: 'x', type: 'uint128' } as AbiParameter,
      { name: 'y', type: 'uint128' } as AbiParameter,
    ];
    const outerComponents: AbiParameter[] = [
      { name: 'id', type: 'uint256' } as AbiParameter,
      { name: 'point', type: 'tuple', components: innerComponents } as AbiParameter,
    ];

    const value = JSON.stringify({ id: '1', point: JSON.stringify({ x: '10', y: '20' }) });
    const result = parseAbiArgValue(value, param('tuple', outerComponents));

    expect(result).toEqual([1n, [10n, 20n]]);
  });
});

// -------------------------------------------------------------------------
// Nested arrays (e.g. uint256[][])
// -------------------------------------------------------------------------

describe('parseAbiArgValue – nested arrays', () => {
  it('parses uint256[][] with recursive conversion', () => {
    const value = JSON.stringify([
      JSON.stringify([1, 2]),
      JSON.stringify([3, 4]),
    ]);
    const result = parseAbiArgValue(value, param('uint256[][]'));
    expect(result).toEqual([
      [1n, 2n],
      [3n, 4n],
    ]);
  });
});
