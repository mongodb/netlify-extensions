import { Extension, envVarToBool } from 'util/extension';
import { downloadPersistenceModule } from './persistence';

const extension = new Extension({
  isEnabled: envVarToBool(process.env.PERSISTENCE_MODULE_ENABLED),
});

extension.addBuildEventHandler('onPreBuild', async ({ utils: { run } }) => {
  try {
    await downloadPersistenceModule(run);
  } catch (e) {
    console.error('Unable to run the persistence module', e);
  }
});

export { extension };
