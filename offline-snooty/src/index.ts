// Documentation: https://sdk.netlify.com
import { NetlifyExtension } from "@netlify/sdk";
import { createSnootyCopy } from "./createSnootyCopy";

const extension = new NetlifyExtension();
const NEW_SNOOTY_PATH = `${process.cwd()}/snooty-offline`;

// run this extension after the build and deploy are successful
extension.addBuildEventHandler("onSuccess", async ({ utils: { run } }) => {
  // If the build event handler is not enabled, return early
  if (!process.env["OFFLINE_SNOOTY_ENABLED"]) {
    return;
  }
  console.log("snooty offline onSuccess.");
  try {
    await createSnootyCopy(run, NEW_SNOOTY_PATH);
    // await processGatsbyOutput
  }
  // convertSnootyToHtml('/public')

  // new module
  // convertSnootyToHtml:

  // if (!(html or folder)) { delete file }
  //
});

export { extension };
