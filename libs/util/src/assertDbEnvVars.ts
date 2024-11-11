export type Environments = 'dev' | 'stg' | 'dotcomstg' | 'prd' | 'dotcomprd';

export type CollectionName = 'repos_branches' | 'docsets' | 'documents';

export type S3UploadParams = {
  bucket: string;
  prefix: string;
  fileName: string;
  manifest: string;
};

export type DbConfig = {
  ATLAS_CLUSTER0_URI: string;
  ATLAS_SEARCH_URI: string;
  AWS_S3_ACCESS_KEY_ID: string;
  AWS_S3_SECRET_ACCESS_KEY: string;
  DOCSETS_COLLECTION: CollectionName;
  DOCUMENTS_COLLECTION: CollectionName;
  REPOS_BRANCHES_COLLECTION: CollectionName;
  SLACK_SIGNING_SECRET: string;
};

const assertEnvVars = (vars: DbConfig) => {
  const missingVars = Object.entries(vars)
    .filter(([, value]) => !value)
    .map(([key]) => `- ${key}`)
    .join('\n');
  // if (missingVars)
  //   throw new Error(`Missing env var(s) ${JSON.stringify(missingVars)}`);
  return vars;
};

export const getDbConfig = (): DbConfig => {
  const environmentVariables = assertEnvVars({
    ATLAS_CLUSTER0_URI: `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_CLUSTER0_HOST}/?retryWrites=true&w=majority`,
    ATLAS_SEARCH_URI: `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_SEARCH_HOST}/?retryWrites=true&w=majority`,
    AWS_S3_ACCESS_KEY_ID: process.env.AWS_S3_ACCESS_KEY_ID as string,
    AWS_S3_SECRET_ACCESS_KEY: process.env.AWS_S3_SECRET_ACCESS_KEY as string,
    DOCSETS_COLLECTION:
      (process.env.DOCSETS_COLLECTION as CollectionName) ?? 'docsets',
    DOCUMENTS_COLLECTION:
      (process.env.DOCUMENTS_COLLECTION as CollectionName) ?? 'documents',
    REPOS_BRANCHES_COLLECTION:
      (process.env.REPOS_BRANCHES_COLLECTION as CollectionName) ??
      'repos_branches',
    SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET as string,
  });

  return environmentVariables;
};
