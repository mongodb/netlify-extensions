export type Environments = 'dev' | 'stg' | 'dotcomstg' | 'prd' | 'dotcomprd';

export type PoolDbName = 'pool' | 'pool_test';

export type CollectionName = 'repos_branches' | 'docsets';

export type DbConfig = {
  ATLAS_CLUSTER0_URI: string;
  ATLAS_SEARCH_URI: string;
  POOL_DB_NAME: PoolDbName;
  REPOS_BRANCHES_COLLECTION: CollectionName;
  DOCSETS_COLLECTION: CollectionName;
  DOCUMENTS_COLLECTION: string;
};

const assertEnvVars = (vars: DbConfig) => {
  const missingVars = Object.entries(vars)
    .filter(([, value]) => !value)
    .map(([key]) => `- ${key}`)
    .join('\n');
  if (missingVars)
    throw new Error(`Missing env var(s) ${JSON.stringify(missingVars)}`);
  return vars;
};

export const getDbConfig = (): DbConfig => {
  const environmentVariables = assertEnvVars({
    ATLAS_CLUSTER0_URI: `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_CLUSTER0_HOST}/?retryWrites=true&w=majority`,
    ATLAS_SEARCH_URI: `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_SEARCH_HOST}/?retryWrites=true&w=majority`,
    // Set to "pool" as a teamwide environment variable and "pool_test" only in the "snooty-mongodb" site
    POOL_DB_NAME: `${process.env.MONGO_ATLAS_POOL_DB_NAME}` as PoolDbName,
    REPOS_BRANCHES_COLLECTION:
      `${process.env.REPOS_BRANCHES_COLLECTION}` as CollectionName,
    DOCSETS_COLLECTION: `${process.env.DOCSETS_COLLECTION}` as CollectionName,
    DOCUMENTS_COLLECTION: `${process.env.DOCUMENTS_COLLECTION}`,
  });
  return environmentVariables;
};
