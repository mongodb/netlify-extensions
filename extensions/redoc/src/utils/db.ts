import { type Db, MongoClient } from 'mongodb';

export const COLLECTION_NAME = 'oas_files';

const getAtlasURL = () => {
  const isHostLocal = process.env.DB_HOST?.includes('localhost');
  if (isHostLocal) {
    console.log('On local host');
    return `mongodb://${process.env.MONGO_ATLAS_CLUSTER0_HOST}/?retryWrites=true&w=majority`;
  }
  return `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_CLUSTER0_HOST}/?retryWrites=true&w=majority`;
};

const atlasURL = getAtlasURL();
const client = new MongoClient(atlasURL);
// cached db object, so we can handle initial connection process once if unitialized
let dbInstance: Db;

export const teardown = async () => {
  await client.close();
};

const getDbName = () => {
  // should I replace this with configEnv.ENV
  const env = process.env.SNOOTY_ENV ?? '';

  switch (env) {
    // Autobuilder's prd env
    case 'production':
      return 'snooty_prod';
    case 'dotcomprd':
      return 'snooty_dotcomprd';
    // Autobuilder's pre-prd env
    case 'staging':
      return 'snooty_stage';
    case 'dotcomstg':
      return 'snooty_dotcomstg';
    default:
      // snooty_dotcomprd.oas_files should be guaranteed to have the latest data
      return 'snooty_dotcomprd';
  }
};
export const db = async () => {
  if (!dbInstance) {
    try {
      await client.connect();
      const dbName = getDbName();
      dbInstance = client.db(dbName);
    } catch (error) {
      console.error(`Error at db client connection: ${error}`);
      throw error;
    }
  }
  return dbInstance;
};
