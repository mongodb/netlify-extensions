// Documentation: https://sdk.netlify.com
import { NetlifyExtension } from '@netlify/sdk';
import { downloadPersistenceModule } from './persistence';

const extension = new NetlifyExtension();
const ZIP_PATH = `${process.cwd()}/bundle/documents`;

extension.addBuildEventHandler('onPreBuild', async ({ utils: { run } }) => {
  if (!process.env.PERSISTENCE_MODULE_ENABLED) return;
  try {
    await downloadPersistenceModule(run);
  } catch (e) {
    console.error('Unable to run the persistence module', e);
  }
});

export { extension };
