// // Documentation: https://sdk.netlify.com
import { envVarToBool, Extension } from './extension';
import { mutRedirectsAndPublish } from './mutRedirectsAndPublish';

const extension = new Extension({
  isEnabled: envVarToBool(process.env.MUT_COMMANDS_ENABLED),
});

extension.addBuildEventHandler(
  'onSuccess',
  async ({ utils: { run }, netlifyConfig }) => {
    // in the future this should also account for dotcomprd
    if (netlifyConfig?.build?.environment.ENV !== 'dotcomstg') {
      return;
    }
    await mutRedirectsAndPublish(netlifyConfig?.build?.environment, run);
  },
);

export { extension };
