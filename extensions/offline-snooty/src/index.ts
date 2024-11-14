// Documentation: https://sdk.netlify.com
import { NetlifyExtension } from '@netlify/sdk';
import { convertGatsbyToHtml } from './convertGatsbyToHtml';
import { createSnootyCopy } from './createSnootyCopy';
import { destroyClient, uploadToS3 } from './uploadToS3';
import {
  type BranchEntry,
  type DocsetsDocument,
  type ReposBranchesDocument,
  readEnvConfigs,
} from './uploadToS3/utils';

const extension = new NetlifyExtension();
export const NEW_SNOOTY_PATH = `${process.cwd()}/snooty-offline`;

// run this extension after the build and deploy are successful
extension.addBuildEventHandler(
  'onSuccess',
  async ({ netlifyConfig, utils: { run } }) => {
    // If the build event handler is not enabled, return early
    if (!process.env.OFFLINE_SNOOTY_ENABLED) {
      return;
    }
    const { bucketName, fileName } = readEnvConfigs({
      env: netlifyConfig.build.environment.ENV ?? '',
      docsetEntry:
        (netlifyConfig.build.environment
          .DOCSET_ENTRY as unknown as DocsetsDocument) ?? {},
      repoEntry:
        (netlifyConfig.build.environment
          .REPO_ENTRY as unknown as ReposBranchesDocument) ?? {},
      branchEntry:
        (netlifyConfig.build.environment
          .BRANCH_ENTRY as unknown as BranchEntry) ?? {},
    });

    try {
      console.log('... creating snooty copy');
      await createSnootyCopy(run, NEW_SNOOTY_PATH);
      console.log('... converting gatsby to html');
      await convertGatsbyToHtml(`${NEW_SNOOTY_PATH}/snooty/public`, fileName);
      console.log('... uploading to AWS S3');
      await uploadToS3(`${process.cwd()}/${fileName}`, bucketName, fileName);
      console.log('... uploaded to AWS S3');
      // TODO: update atlas collection repos_branches to signal offline availability
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      destroyClient();
    }
  },
);

export { extension };
