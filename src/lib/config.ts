import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { CONFIG_FILE, PROFILE_CONFIG_DIR } from './constants.js';
import type { PermissionsConfig } from '../types.js';

function getProfileConfigPath(profile?: string): string {
  if (!profile || profile === 'default') {
    return CONFIG_FILE;
  }
  return join(PROFILE_CONFIG_DIR, `${profile}.json`);
}

export function getConfigPath(profile?: string): string {
  return getProfileConfigPath(profile);
}

export function configExists(profile?: string): boolean {
  return existsSync(getProfileConfigPath(profile));
}

export function loadConfig(profile?: string): PermissionsConfig {
  const configPath = getProfileConfigPath(profile);
  if (!existsSync(configPath)) {
    const profileArg =
      profile && profile !== 'default' ? ` --profile ${profile}` : '';
    throw new Error(
      `${configPath} not found. Run \`gator init${profileArg}\` first.`,
    );
  }
  const raw = readFileSync(configPath, 'utf-8');
  return JSON.parse(raw) as PermissionsConfig;
}

export function saveConfig(config: PermissionsConfig, profile?: string): void {
  const configPath = getProfileConfigPath(profile);
  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
}
