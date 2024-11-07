// Documentation: https://sdk.netlify.com
import { envVarToBool, Extension } from '@populate-metadata/extension';
const extension = new Extension({
  isEnabled: envVarToBool(process.env.OFFLINE_SNOOTY_ENABLED),
});

extension.addBuildEventHandler('onPreBuild', () => {
  // If the build event handler is not enabled, return early
  if (!process.env.OFFLINE_SNOOTY_ENABLED) {
    return;
  }
  console.log('Hello there.');
});

export { extension };
