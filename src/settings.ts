import { readFileSync } from 'fs';

export const PLATFORM_NAME = 'BlaubergVento';
export const PLUGIN_NAME = 'homebridge-blauberg-vento';
export const PLUGIN_VERSION = JSON.parse(readFileSync('./package.json', 'utf8')).dependencies[PLUGIN_NAME];
