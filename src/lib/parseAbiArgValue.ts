import type { AbiParameter } from 'viem';

/**
 * Recursively converts a CLI string argument into the JS type that viem's
 * `encodeAbiParameters` / `encodeFunctionData` expects, based on the
 * Solidity type declared in the ABI parameter.
 *
 * Type dispatch mirrors viem's internal `prepareParam` order:
 *  1. Arrays  (T[] / T[N]) — JSON-parse, recurse each element
 *  2. Tuples  — JSON-parse, recurse each component
 *  3. Bool    — "true" / "false" → boolean
 *  4. Integers (uint* / int*) — BigInt
 *  5. Everything else (address, bytes*, string) — pass-through
 */
export function parseAbiArgValue(value: string, param: AbiParameter): unknown {
  // Dynamic (T[]) and fixed-size (T[N]) arrays: strip the trailing bracket,
  // JSON-parse the value, and recurse on each element with the base type.
  if (param.type.match(/\[\d*\]$/)) {
    const baseType = param.type.replace(/\[\d*\]$/, '');
    const parsed = JSON.parse(value);
    return parsed.map((item: unknown) =>
      parseAbiArgValue(String(item), {
        ...param,
        type: baseType,
      } as AbiParameter),
    );
  }

  // Tuples (structs): JSON-parse the value, then recurse each field using
  // the ABI `components` array. Supports both named keys and positional index.
  if (param.type === 'tuple' && 'components' in param) {
    const parsed = JSON.parse(value);
    return param.components.map((comp, i) =>
      parseAbiArgValue(String(parsed[comp.name!] ?? parsed[i]), comp),
    );
  }

  if (param.type === 'bool') return value === 'true';

  if (param.type.startsWith('uint') || param.type.startsWith('int'))
    return BigInt(value);

  // address, bytes*, string — viem accepts these as plain strings.
  return value;
}
