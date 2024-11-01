// Documentation: https://sdk.netlify.com
import { NetlifyExtension } from '@netlify/sdk';

const extension = new NetlifyExtension();

extension.addBuildEventHandler('onPreBuild', () => {
  // If the build event handler is not enabled, return early
  if (!process.env['OFFLINE_SNOOTY_ENABLED']) {
    return;
  }
  console.log('Hello there.');
});

export { extension };
