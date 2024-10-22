// Documentation: https://sdk.netlify.com
import { Extension, envVarToBool } from './extension';
import { updateConfig } from './updateConfig';

const extension = new Extension({
  isEnabled: envVarToBool(process.env.POPULATE_METADATA_ENABLED),
});

extension.addBuildEventHandler(
  'onPreBuild',
  async ({ netlifyConfig, envVars }) => {
    console.log('ENV VARS in index', envVars);
    await updateConfig(netlifyConfig);
  },
);

export { extension };
