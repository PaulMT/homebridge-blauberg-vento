import type { API } from 'homebridge';

import { BlaubergVentoPlatform } from './platform.js';
import { PLATFORM_NAME } from './settings.js';

export default (api: API) => {
  api.registerPlatform(PLATFORM_NAME, BlaubergVentoPlatform);
};
