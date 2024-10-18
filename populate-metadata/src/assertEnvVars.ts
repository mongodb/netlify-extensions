import type { EnvVars } from './types';

const assertEnvVars = (vars: EnvVars) => {
  const missingVars = Object.entries(vars)
    .filter(([, value]) => !value)
    .map(([key]) => `- ${key}`)
    .join('\n');
  if (missingVars)
    throw new Error(`Missing env var(s) ${JSON.stringify(missingVars)}`);
  return vars;
};

export const getEnvVars = () => {
  const environmentVariables = assertEnvVars({
    ATLAS_CLUSTER0_URI: `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_CLUSTER0_HOST}/?retryWrites=true&w=majority`,
    ATLAS_SEARCH_URI: `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_SEARCH_HOST}/?retryWrites=true&w=majority`,
    SEARCH_DB_NAME: `${process.env.MONGO_ATLAS_SEARCH_DB_NAME}`,
    SNOOTY_DB_NAME: `${process.env.MONGO_ATLAS_POOL_DB_NAME}`,
    REPOS_BRANCHES_COLLECTION: `${process.env.REPOS_BRANCHES_COLLECTION}`,
    DOCSETS_COLLECTION: `${process.env.DOCSETS_COLLECTION}`,
    DOCUMENTS_COLLECTION: `${process.env.DOCUMENTS_COLLECTION}`,
  });
  return environmentVariables;
};
