import { loadConfig } from '../lib/config.js';
import type { ProfileOptions } from '../types.js';

export function show(opts: ProfileOptions) {
  const config = loadConfig(opts.profile);
  console.log(config.account.address);
}
