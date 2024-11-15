// Documentation: https://sdk.netlify.com
import { NetlifyExtension } from '@netlify/sdk';

// TODO: Change this to use derived Extension class once "addFunctions" implementation is ready
const extension = new NetlifyExtension();

extension.addFunctions('./src/functions', {
  prefix: 'slack',
  shouldInjectFunction: ({ name }) => {
    console.log(`name is ${name}`);
    // If the function is not enabled, return early
    return !!process.env.SLACK_ENABLED;
  },
});

export { extension };
