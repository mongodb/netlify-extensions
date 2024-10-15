// Documentation: https://sdk.netlify.com
import { NetlifyExtension } from '@netlify/sdk';

const extension = new NetlifyExtension();

extension.addBuildEventHandler('onPreBuild', async ({ netlifyConfig }) => {
  // If the build event handler is not enabled, return early

  if (!process.env.POPULATE_METADATA_ENABLED) {
    return;
  }
  console.log('Hello there.');
  console.log(netlifyConfig?.build);
});

export { extension };
