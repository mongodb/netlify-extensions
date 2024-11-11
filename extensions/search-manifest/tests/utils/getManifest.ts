import { generateManifest } from '../../src';

export const getManifest = async (manifestName: string) => {
  process.chdir(`documents/docs-${manifestName}`);
  const manifest = await generateManifest();
  // Restore cwd
  process.chdir('../../');
  return manifest;
};
