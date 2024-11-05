// TODO: Move this out of individual extensions with nx with DOP-5009

import type { NetlifyPluginOptions } from '@netlify/build';
// Documentation: https://sdk.netlify.com
import {
  type BuildHookOptions,
  type BuildHookType,
  NetlifyExtension,
} from '@netlify/sdk';
import type z from 'zod';
import { type DbConfig, getDbConfig } from './assertDbEnvVars';

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
          console.log(this.isEnabled);
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
