import { envVarToBool, Extension } from 'util/extension';
import { generateAndUploadManifests } from './generateAndUpload';

const extension = new Extension({
  isEnabled: envVarToBool(process.env.SEARCH_MANIFEST_ENABLED),
});

//Return indexing data from a page's AST for search purposes.
extension.addBuildEventHandler(
  'onSuccess',
  async ({ utils: { run }, netlifyConfig, dbEnvVars }) => {
    if (process.env.ENV !== 'dotcomstg') {
      console.log(
        `shouldn't generate manifest for ${process.env.ENV}, returning`,
      );
      return;
    }
    console.log(
      `Running search-manifest build event handler extension in ${process.env.ENV}`,
    );
    await generateAndUploadManifests({
      configEnvironment: netlifyConfig?.build?.environment,
      run,
      dbEnvVars,
    });
  },
);

export { extension };
