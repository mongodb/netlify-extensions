// Documentation: https://sdk.netlify.com
import {
  type BuildHookOptions,
  type BuildHookType,
  NetlifyExtension,
} from '@netlify/sdk';
import type z from 'zod';
import { getEnvVars } from './assertEnvVars';
import type { BuildHookWithEnvVars, EnvVars, ExtensionOptions } from './types';

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
          console.log(JSON.stringify(options));
          // If an "if" function has been passed as an option to the third addBuildEventHandler, execute that conditional
          // return options?.if === undefined || options.if(buildConfig);
        },
      },
    );
  };
}
