// Documentation: https://sdk.netlify.com
import {
  NetlifyExtension,
  type BuildHookOptions,
  type BuildHookType,
  type BuildHookWithContext,
} from '@netlify/sdk';
import type z from 'zod';

export const envVarToBool = (envVar: boolean | string = 'false') => {
  if (typeof envVar === 'boolean') {
    return envVar;
  }
  return JSON.parse(envVar) as boolean;
};

export type ExtensionOptions = {
  isEnabled: boolean;
};
export class Extension<
  BuildContext extends z.ZodSchema = z.ZodUnknown,
  BuildConfigSchema extends z.ZodSchema = z.ZodUnknown,
> extends NetlifyExtension<
  z.ZodUnknown,
  z.ZodUnknown,
  BuildContext,
  // In case of issues, double check that BuildConfigSchema is in correct spot in order of type params
  BuildConfigSchema,
  z.ZodUnknown
> {
  isEnabled: boolean;

  constructor({ isEnabled }: ExtensionOptions) {
    super();
    this.isEnabled = isEnabled;
    console.log('Extension enabled:', this.isEnabled);
  }

  addBuildEventHandler = async (
    type: BuildHookType,
    func: BuildHookWithContext<
      Zod.infer<BuildContext>,
      Zod.infer<BuildConfigSchema>
    >,
    options?: BuildHookOptions,
  ): Promise<void> => {
    super.addBuildEventHandler(
      type,
      async (args) => {
        await func(args);
      },
      {
        ...options,
        if: (buildConfig) => {
          console.log(this.isEnabled);
          if (!this.isEnabled) {
            return false;
          }
          return options?.if === undefined || options.if(buildConfig);
        },
      },
    );
  };
}
