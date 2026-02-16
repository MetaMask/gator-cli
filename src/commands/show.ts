import { loadConfig } from '../lib/config.js';

export function show() {
  const config = loadConfig();
  console.log(config.account.address);
}
