// Documentation: https://sdk.netlify.com
import {
  type BuildHookOptions,
  type BuildHookType,
  type BuildHookWithContext,
  NetlifyExtension,
} from '@netlify/sdk';
import type z from 'zod';
import { getEnvVars } from './assertEnvVars';
import type { EnvVars } from './types';
import type { NetlifyPluginOptions } from '@netlify/build';

export const envVarToBool = (envVar: boolean | string = 'false') => {
  if (typeof envVar === 'boolean') {
    return envVar;
  }
  return JSON.parse(envVar) as boolean;
};

export type ExtensionOptions = {
  isEnabled: boolean;
};

export type BuildHookWithEnvVars<
  EnvVars,
  Context extends Record<string, any> = Record<string, never>,
  Config extends Record<string, any> = Record<string, never>,
> = (
  options: {
    envVars: EnvVars;
    buildContext?: Context;
    buildConfig?: Config;
  } & Omit<NetlifyPluginOptions, 'inputs'>,
) => void | Promise<void>;

export class Extension<
  BuildContext extends z.ZodSchema = z.ZodUnknown,
  BuildConfigSchema extends z.ZodSchema = z.ZodUnknown,
> extends NetlifyExtension<
  z.ZodUnknown,
  z.ZodUnknown,
  BuildContext,
  // In case of issues, double check that BuildConfigSchema is in correct spot within the order of type params
  BuildConfigSchema,
  z.ZodUnknown
> {
  isEnabled: boolean;
  envVars: EnvVars;

  constructor({ isEnabled }: ExtensionOptions) {
    super();
    this.isEnabled = isEnabled;
    this.envVars = getEnvVars();
  }

  addBuildEventHandler = async (
    type: BuildHookType,
    func: BuildHookWithEnvVars<
      EnvVars,
      Zod.infer<BuildContext>,
      Zod.infer<BuildConfigSchema>
    >,
    options?: BuildHookOptions,
  ): Promise<void> => {
    super.addBuildEventHandler(
      type,
      async (args) => {
        const envVars = this.envVars;
        await func({ envVars, ...args });
      },
      {
        ...options,
        if: (buildConfig) => {
          if (!this.isEnabled) {
            return false;
          }
          return options?.if === undefined || options.if(buildConfig);
        },
      },
    );
  };
}