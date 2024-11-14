// Documentation: https://sdk.netlify.com
import { NetlifyExtension } from '@netlify/sdk';
import { envVarToBool, Extension } from 'util/extension';

const ext = new Extension({
  isEnabled: envVarToBool(process.env.SLACK_ENABLED),
});

const extension = new NetlifyExtension();

ext.addFunctions('./src/functions', {
  prefix: 'slack',
  shouldInjectFunction: ({ name }) => {
    console.log(`name is ${name}`);
    // If the function is not enabled, return early
    return !!process.env.SLACK_ENABLED;
  },
});

// extension.addFunctions('./src/functions', {
//   prefix: 'slack',
//   shouldInjectFunction: ({ name }) => {
//     console.log(name);
//     // If the function is not enabled, return early
//     return !!process.env.SLACK_ENABLED;
//   },
// });

export { extension };
