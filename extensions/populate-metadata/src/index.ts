// Documentation: https://sdk.netlify.com
import { Extension, envVarToBool } from 'util/extension';
import { updateConfig } from './updateConfig';

const extension = new Extension({
  isEnabled: envVarToBool(process.env.POPULATE_METADATA_ENABLED),
});

extension.addBuildEventHandler(
  'onPreBuild',
  async ({ netlifyConfig, dbEnvVars }) => {
    await updateConfig({
      configEnvironment: netlifyConfig?.build?.environment,
      dbEnvVars,
    });
  },
);

export { extension };