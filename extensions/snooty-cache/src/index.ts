// Documentation: https://sdk.netlify.com

import { envVarToBool, Extension } from 'util/extension';
import {
  createFrontendCache,
  createParserCache,
  restoreFrontendCache,
} from './handleCaching';

const extension = new Extension({
  isEnabled: envVarToBool(process.env.SNOOTY_CACHE_ENABLED),
});

extension.addBuildEventHandler(
  'onPreBuild',
  async ({ utils: { cache, run } }) => {
    await restoreFrontendCache(cache, run);
  },
);

extension.addBuildEventHandler(
  'onSuccess',
  async ({ utils: { cache, run } }) => {
    await createFrontendCache(cache, run);
  },
);

extension.addBuildEventHandler('onEnd', async ({ utils: { run, status } }) => {
  await createParserCache(run, status);
});

export { extension };
