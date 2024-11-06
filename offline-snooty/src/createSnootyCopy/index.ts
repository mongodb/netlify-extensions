import type { NetlifyPluginUtils } from "@netlify/build";

export const createSnootyCopy = async (
  run: NetlifyPluginUtils["run"],
  targetPath: string
) => {
  await run.command(
    `rsync -av --progress  ${process.cwd()}/snooty ${targetPath} --exclude public --exclude node_modules`
  );

  const offlineSnootyPath = `${targetPath}/snooty`;

  await run.command(`npm ci --legacy-peer-deps`, {
    cwd: offlineSnootyPath,
  });

  await run.command(`npm run clean`, {
    cwd: offlineSnootyPath,
  });

  await run.command(`npm run build:no-prefix`, {
    cwd: offlineSnootyPath,
  });
};
