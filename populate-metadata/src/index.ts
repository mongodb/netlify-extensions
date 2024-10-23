// Documentation: https://sdk.netlify.com
import { Extension, envVarToBool } from './extension';
import { updateConfig } from './updateConfig';

const extension = new Extension({
  isEnabled: envVarToBool(process.env.POPULATE_METADATA_ENABLED),
});

extension.addBuildEventHandler(
  'onPreBuild',
  async ({ netlifyConfig, dbEnvVars }) => {
    console.log('adding updateConfig build event handler');
    await updateConfig(netlifyConfig, dbEnvVars);
  },
);

export { extension };
