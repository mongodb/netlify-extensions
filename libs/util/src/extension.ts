// TODO: Move this out of individual extensions with nx with DOP-5009

import type { NetlifyPluginOptions } from '@netlify/build';
// Documentation: https://sdk.netlify.com
import {
  type BuildHookOptions,
  type BuildHookType,
  NetlifyExtension,
} from '@netlify/sdk';
import type z from 'zod';
import type {
  BranchEntry,
  DocsetsDocument,
  Environments,
  PoolDBName,
  ReposBranchesDocument,
  SearchDBName,
  SnootyDBName,
  ProjectsDocument,
  OrganizationName,
} from './databaseConnection/types';
import { getDbConfig, type StaticEnvVars } from './assertDbEnvVars';

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

type FunctionsOptions = {
  /**
   * A prefix value added to functions. For example, given a prefix value of `my_prefix`, a function
   * `hello-world.mts` will be named `my_prefix_hello-world`. Used to prevent naming collisions
   * between functions.
   */
  prefix: string;
  /**
   * An optional function that can be used to prevent functions from being injected into the user's
   * site. Receives the name of the function to be injected (excludes file extension).
   */
  shouldInjectFunction?:
    | ((options: {
        name: string;
      }) => boolean)
    | undefined;
};

export const envVarToBool = (envVar: boolean | string = 'false'): boolean => {
  if (typeof envVar === 'boolean') {
    return envVar;
  }
  return JSON.parse(envVar);
};

// class Extension extends NetlifyExtension
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
  staticEnvVars: StaticEnvVars;

  constructor({ isEnabled }: ExtensionOptions) {
    super();
    this.isEnabled = isEnabled;
    console.log(`Extension enabled: ${this.isEnabled}`);
    this.staticEnvVars = getDbConfig();
  }

  addBuildEventHandler = async (
    type: BuildHookType,
    func: BuildHookWithEnvVars<
      StaticEnvVars,
      Zod.infer<BuildContext>,
      Zod.infer<BuildConfigSchema>
    >,
    options?: BuildHookOptions,
  ): Promise<void> => {
    super.addBuildEventHandler(
      type,
      async (args) => {
        const dbEnvVars = this.staticEnvVars;
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

  // TODO: addFunctions implementation to be fixed later (DOP-5200); currently does not behave as expected
  // addFunctions = async (
  //   path: string,
  //   options: FunctionsOptions,
  // ): Promise<void> => {
  //   super.addFunctions(path, {
  //     prefix: options.prefix,
  //     shouldInjectFunction: () => {
  //       try {
  //         if (!this.isEnabled) {
  //           return false;
  //         }
  //         if (options?.shouldInjectFunction) {
  //           return options.shouldInjectFunction({
  //             name: options.shouldInjectFunction.name,
  //           });
  //         }
  //         return true;
  //       } catch (e) {
  //         console.info(
  //           `Function injection did not complete successfully. Errored with error: ${e}`,
  //         );
  //         return false;
  //       }
  //     },
  //   });
  // };
}

export type ConfigEnvironmentVariables = Partial<{
  // The name of the branch in the content repo that is being built
  BRANCH_NAME: string;
  // Usually duplicate of BRANCH_NAME property, this is the git primitve branch that the build is being built on
  BRANCH: string;
  REPO_NAME: string;
  ORG: OrganizationName;
  SITE_NAME: string;
  INCOMING_HOOK_URL: string;
  INCOMING_HOOK_TITLE: string;
  INCOMING_HOOK_BODY: string;
  ENV: Environments;
  REPO_ENTRY: ReposBranchesDocument;
  DOCSET_ENTRY: DocsetsDocument;
  BRANCH_ENTRY: BranchEntry;
  PROJECTS_ENTRY: ProjectsDocument;
  POOL_DB_NAME: PoolDBName;
  SEARCH_DB_NAME: SearchDBName;
  SNOOTY_DB_NAME: SnootyDBName;
}>;
