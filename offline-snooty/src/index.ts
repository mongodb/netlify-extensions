// Documentation: https://sdk.netlify.com
import { NetlifyExtension } from "@netlify/sdk";
import { createSnootyCopy } from "./createSnootyCopy";
import { convertGatsbyToHtml } from "./convertGatsbyToHtml";
import { uploadToS3 } from "./uploadToS3";

const extension = new NetlifyExtension();
export const NEW_SNOOTY_PATH = `${process.cwd()}/snooty-offline`;

// run this extension after the build and deploy are successful
extension.addBuildEventHandler(
  "onSuccess",
  async ({ netlifyConfig, utils: { run } }) => {
    // If the build event handler is not enabled, return early
    if (!process.env.OFFLINE_SNOOTY_ENABLED) {
      return;
    }
    console.log("snooty offline onSuccess.");
    try {
      await createSnootyCopy(run, NEW_SNOOTY_PATH);
      await convertGatsbyToHtml(`${NEW_SNOOTY_PATH}/snooty/public`);
      await uploadToS3(
        `${process.cwd}/test-create-gzip.tgz`,
        netlifyConfig.build.environment.ENV ?? ""
        // netlifyConfig.build.environment.REPO_ENTRY ?? {}
      );
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
);

export { extension };
