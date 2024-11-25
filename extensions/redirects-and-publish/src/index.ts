// // Documentation: https://sdk.netlify.com
import { envVarToBool, Extension } from 'util/extension';
import { mutRedirectsAndPublish } from './mutRedirectsAndPublish';

const extension = new Extension({
  isEnabled: envVarToBool(process.env.MUT_COMMANDS_ENABLED),
});

extension.addBuildEventHandler(
  'onSuccess',
  async ({ utils: { run }, netlifyConfig }) => {
    // TODO: In the future this should also account for dotcomprd
   console.log("the netlify config is",netlifyConfig)
    if (netlifyConfig?.build?.environment.ENV !== 'dotcomstg') {
      return;
    }
    await mutRedirectsAndPublish(netlifyConfig?.build?.environment, run);
  },
);

export { extension };
