export type Environments = 'dev' | 'stg' | 'dotcomstg' | 'prd' | 'dotcomprd';

export type CollectionName = 'repos_branches' | 'docsets' | 'documents';

export type DbConfig = {
  ATLAS_CLUSTER0_URI: string;
  ATLAS_SEARCH_URI: string;
  REPOS_BRANCHES_COLLECTION: CollectionName;
  DOCSETS_COLLECTION: CollectionName;
  DOCUMENTS_COLLECTION: CollectionName;
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
    REPOS_BRANCHES_COLLECTION: process.env
      .REPOS_BRANCHES_COLLECTION as CollectionName,
    DOCSETS_COLLECTION: process.env.DOCSETS_COLLECTION as CollectionName,
    DOCUMENTS_COLLECTION: process.env.DOCUMENTS_COLLECTION as CollectionName,
  });

  return environmentVariables;
};