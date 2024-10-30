
export const envVarToBool = (envVar: boolean | string = 'false'): boolean => {
    if (typeof envVar === 'boolean') {
      return envVar;
    }
    return JSON.parse(envVar);
  };