// Documentation: https://sdk.netlify.com
import { Extension, envVarToBool } from './extension';
import { updateConfig } from './updateConfig';

const extension = new Extension({
  isEnabled: envVarToBool(process.env.POPULATE_METADATA_ENABLED),
});

extension.addBuildEventHandler(
  'onPreBuild',
  async ({ netlifyConfig, dbEnvVars }) => {
    await updateConfig(netlifyConfig?.build?.environment, dbEnvVars);
  },
  {
    if: () => {
      console.log('first if statement');
      return true;
    },
  },
);

export { extension };
