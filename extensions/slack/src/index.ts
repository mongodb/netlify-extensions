// Documentation: https://sdk.netlify.com
import { NetlifyExtension } from '@netlify/sdk';
import { Extension } from 'util/extensions';

const ext = new Extension();

const extension = new NetlifyExtension();

extension.addFunctions('./src/functions', {
  prefix: 'slack',
  shouldInjectFunction: () => {
    // If the function is not enabled, return early
    return !!process.env.SLACK_ENABLED;
  },
});

export { extension };
