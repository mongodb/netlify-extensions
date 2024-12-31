// Documentation: https://sdk.netlify.com
import type {
  DocsetsDocument,
  ReposBranchesDocument,
  BranchEntry,
  EnvironmentConfig,
} from 'util/databaseConnection/types';
import { Extension, envVarToBool } from 'util/extension';
import { convertGatsbyToHtml } from './convertGatsbyToHtml';
import { createSnootyCopy } from './createSnootyCopy';
import { updateReposBranches } from './updateReposBranches';
import { destroyClient, uploadToS3 } from './uploadToS3';
import { readEnvConfigs } from './uploadToS3/utils';

const extension = new Extension({
  isEnabled: envVarToBool(process.env.OFFLINE_SNOOTY_ENABLED),
});
const NEW_SNOOTY_PATH = `${process.cwd()}/snooty-offline`;
export const PUBLIC_OUTPUT_PATH = `${NEW_SNOOTY_PATH}/snooty/public`;
const EXTENSION_NAME = 'offline-snooty';
const ENVS_TO_RUN = ['dotcomprd', 'dotcomstg'];

// run this extension after the build and deploy are successful
extension.addBuildEventHandler(
  'onSuccess',
  async ({ netlifyConfig, dbEnvVars, utils: { run } }) => {
    const environment = netlifyConfig.build.environment as Record<
      string,
      string | DocsetsDocument | ReposBranchesDocument | BranchEntry
    >;
    // NOTE: prd and dotcomprd both read from pool.repos_branches
    // would be an improvement to separate prd and dotcomprd repos_branches
    // skip this step if step is `prd`
    // could only test in dotcomstg :(
    // if (!ENVS_TO_RUN.includes(environment.ENV as string)) {
    //   console.log('skipping repos branches update');
    //   return;
    // }
    const { bucketName, fileName, baseUrl } = readEnvConfigs({
      env: (environment.ENV as keyof EnvironmentConfig) ?? '',
      repoEntry: (environment.REPO_ENTRY as ReposBranchesDocument) ?? {},
      branchEntry: (environment.BRANCH_ENTRY as BranchEntry) ?? {},
      docsetEntry: (environment.DOCSET_ENTRY as DocsetsDocument) ?? {},
    });

    try {
      console.log('... creating snooty copy');
      await createSnootyCopy(run, NEW_SNOOTY_PATH);
      console.log('... converting gatsby to html');
      await convertGatsbyToHtml(PUBLIC_OUTPUT_PATH, fileName);
      console.log(
        '... uploading to AWS S3 ',
        bucketName,
        'docs/offline',
        fileName,
      );
      await uploadToS3(`${process.cwd()}/${fileName}`, bucketName, fileName);
      console.log('... uploaded to AWS S3');
      await updateReposBranches(
        {
          repoEntry: environment.REPO_ENTRY as ReposBranchesDocument,
          branchEntry: environment.BRANCH_ENTRY as BranchEntry,
          collectionName: dbEnvVars.REPOS_BRANCHES_COLLECTION,
        },
        {
          clusterZeroURI: dbEnvVars.ATLAS_CLUSTER0_URI,
          databaseName: netlifyConfig?.build?.environment.POOL_DB_NAME ?? '',
          appName: EXTENSION_NAME,
        },
        baseUrl,
        fileName,
      );
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      destroyClient();
    }
  },
);

export { extension };
