// // Documentation: https://sdk.netlify.com
// import { NetlifyExtension } from '@netlify/sdk';
// import { getProperties } from './getProperties';
import { envVarToBool, Extension } from './extension';
import { mutRedirectsAndPublish } from './mutRedirectsAndPublish';

const extension = new Extension({
  isEnabled: envVarToBool(process.env.MUT_COMMANDS_ENABLED),
});

const MUT_VERSION = '0.11.4';

extension.addBuildEventHandler(
  'onSuccess',
  async ({ utils: { status, git, run }, netlifyConfig }) => {
    await mutRedirectsAndPublish(netlifyConfig?.build?.environment, run);
  },
);

export { extension };
