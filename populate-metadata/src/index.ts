// Documentation: https://sdk.netlify.com
import { envVarToBool, Extension } from './extension';
import { updateConfig } from './updateConfig';

const extension = new Extension({
  isEnabled: envVarToBool(process.env.POPULATE_METADATA_ENABLED),
});

await extension.addBuildEventHandler(
  'onPreBuild',
  async ({ netlifyConfig }) => {
    await updateConfig(netlifyConfig);
  },
);

export { extension };
