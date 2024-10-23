// Documentation: https://sdk.netlify.com
import {
  type BuildHookOptions,
  type BuildHookType,
  NetlifyExtension,
} from '@netlify/sdk';
import type z from 'zod';
import { getDbConfig } from './assertDbEnvVars';
import type { BuildHookWithEnvVars, DbConfig, ExtensionOptions } from './types';

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
        await func({ dbEnvVars, ...args });
      },
      {
        if: () => {
          console.log('Build event handler', this.isEnabled);
          if (!this.isEnabled) {
            return false;
          }
          // If an "if" function has been passed as an option to the third addBuildEventHandler, execute that conditional
          // return options?.if === undefined || options.if(buildConfig);
        },
        ...options,
      },
    );
  };
}
