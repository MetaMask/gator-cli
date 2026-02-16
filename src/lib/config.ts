import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { CONFIG_DIR, CONFIG_FILE } from './constants.js';
import type { PermissionsConfig } from '../types.js';

export function configExists(): boolean {
  return existsSync(CONFIG_FILE);
}

export function loadConfig(): PermissionsConfig {
  if (!configExists()) {
    throw new Error(`${CONFIG_FILE} not found. Run \`gator init\` first.`);
  }
  const raw = readFileSync(CONFIG_FILE, 'utf-8');
  return JSON.parse(raw) as PermissionsConfig;
}

export function saveConfig(config: PermissionsConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n');
}
