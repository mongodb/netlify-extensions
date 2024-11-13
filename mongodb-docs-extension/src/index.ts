// Documentation: https://sdk.netlify.com
import { NetlifyExtension } from '@netlify/sdk';

const extension = new NetlifyExtension();

extension.addBuildEventHandler('onPreBuild', () => {
  // If the build event handler is not enabled, return early
  if (!process.env.MONGODB_DOCS_EXTENSION_ENABLED) {
    return;
  }
  console.log('Hello there.');
});

extension.addEdgeFunctions('./src/edge-functions', {
  prefix: 'ef_prefix',
  shouldInjectFunction: () => {
    // If the edge function is not enabled, return early
    if (!process.env.MONGODB_DOCS_EXTENSION_ENABLED) {
      return false;
    }
    return true;
  },
});

export { extension };
