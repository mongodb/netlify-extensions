// TODO: Move this out of individual extensions with nx with DOP-5009

import type { NetlifyPluginOptions } from '@netlify/build';
// Documentation: https://sdk.netlify.com
import {
  type BuildHookOptions,
  type BuildHookType,
  NetlifyExtension,
} from '@netlify/sdk';
import type z from 'zod';
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
  if (missingVars)
    throw new Error(`Missing env var(s) ${JSON.stringify(missingVars)}`);
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

type BuildHookWithEnvVars<
  DbConfig,
  BuildContext extends z.ZodSchema,
  BuildConfigSchema extends z.ZodSchema,
> = (
  options: {
    dbEnvVars: DbConfig;
    buildContext?: BuildContext;
    buildConfig?: BuildConfigSchema;
  } & Omit<NetlifyPluginOptions, 'inputs'>,
) => void | Promise<void>;

type ExtensionOptions = {
  isEnabled: boolean;
};

export const envVarToBool = (envVar: boolean | string = 'false'): boolean => {
  if (typeof envVar === 'boolean') {
    return envVar;
  }
  return JSON.parse(envVar);
};

export class Extension<
  BuildContext extends z.ZodSchema = z.ZodUnknown,
  BuildConfigSchema extends z.ZodSchema = z.ZodUnknown,
> extends NetlifyExtension<
  z.ZodUnknown,
  z.ZodUnknown,
  // In case of issues, double check that BuildContext, BuildConfigSchema are in correct spots within the order of type params
  BuildContext,
  BuildConfigSchema,
  z.ZodUnknown
> {
  isEnabled: boolean;
  dbEnvVars: DbConfig;

  constructor({ isEnabled }: ExtensionOptions) {
    super();
    this.isEnabled = isEnabled;
    console.log(`Extension enabled: ${this.isEnabled}`);
    this.dbEnvVars = getDbConfig();
  }

  addBuildEventHandler = async (
    type: BuildHookType,
    func: BuildHookWithEnvVars<
      DbConfig,
      Zod.infer<BuildContext>,
      Zod.infer<BuildConfigSchema>
    >,
    options?: BuildHookOptions,
  ): Promise<void> => {
    super.addBuildEventHandler(
      type,
      async (args) => {
        const dbEnvVars = this.dbEnvVars;
        try {
          await func({ dbEnvVars, ...args });
        } catch (e) {
          console.info(
            `Build handler did not complete successfully. Errored with error: ${e}`,
          );
        }
      },
      {
        ...options,
        if: (buildConfig: Zod.infer<BuildConfigSchema>) => {
          if (!this.isEnabled) {
            return false;
          }
          // Ensure if option is not overwritten if passed into build event handler
          return options?.if === undefined || options.if(buildConfig);
        },
      },
    );
  };
}
