import { envVarToBool, Extension } from 'util/extension';
import { generateAndUploadManifests } from './generateAndUpload';
import type { NetlifyConfig } from '@netlify/build';

const extension = new Extension({
  isEnabled: envVarToBool(process.env.SEARCH_MANIFEST_ENABLED),
});

//Return indexing data from a page's AST for search purposes.
extension.addBuildEventHandler(
  'onSuccess',
  async ({ utils: { run }, netlifyConfig, dbEnvVars }) => {
    console.log(process.env.ENV);
    console.log('running search-manifest build event handler extension');
    generateAndUploadManifests({
      configEnvironment: netlifyConfig?.build?.environment,
      run,
      dbEnvVars,
    });
  },
);

export { extension };
