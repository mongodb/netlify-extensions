// // Documentation: https://sdk.netlify.com
import { envVarToBool, Extension } from 'util/extension';
import {
  mutRedirectsAndPublish,
  setMutEnvVars,
} from './mutRedirectsAndPublish';

const extension = new Extension({
  isEnabled: envVarToBool(process.env.MUT_COMMANDS_ENABLED),
});

extension.addBuildEventHandler(
  'onBuild',
  async ({ utils: { run }, netlifyConfig, dbEnvVars }) => {
    // TODO: In the future this should also account for dotcomprd
    if (netlifyConfig?.build?.environment.ENV !== 'dotcomstg') {
      return;
    }
    setMutEnvVars(dbEnvVars);
    await mutRedirectsAndPublish(netlifyConfig?.build?.environment, run);
  },
);

export { extension };
