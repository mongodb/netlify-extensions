// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from '@netlify/sdk';
import { downloadPersistenceModule } from './persistence';

const integration = new NetlifyIntegration();
const ZIP_PATH = `${process.cwd()}/bundle/documents`;

integration.addBuildEventHandler(
  'onPreBuild',
  async ({ utils: { cache, run } }) => {
    try {
      await downloadPersistenceModule(run);
    } catch (e) {
      console.error('Unable to run the persistence module', e);
    }
  },
);
export { integration };
