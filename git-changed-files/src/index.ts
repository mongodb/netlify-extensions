import { NetlifyExtension } from '@netlify/sdk';

const extension = new NetlifyExtension();

extension.addBuildEventHandler('onSuccess', ({ utils: { status, git } }) => {
  if (!process.env.GIT_CHANGED_FILES_ENABLED) return;

  console.log('Checking if any files changed on git -----');
  console.log('Modified files:', git.modifiedFiles);

  if (!process.env.DEPLOY_PRIME_URL) {
    console.error('ERROR! process.env.DEPLOY_PRIME_URL is not defined.');
    return;
  }

  const markdownList = createMarkdown(
    git.modifiedFiles,
    process.env.DEPLOY_PRIME_URL,
  );

  if (markdownList.length !== 0) {
    status.show({
      title: 'URLs to Changed Files',
      summary: markdownList.join('\n'),
    });
  }
});

/**
 * Function to convert git modifed files to links of the staged files. Needs to be in markdown
 * so on the deploy summary the text appears as a link not just as text.
 *
 * @param modifiedFiles
 * @param netlifyURL
 * @returns string[]
 */
export function createMarkdown(
  modifiedFiles: readonly string[],
  netlifyURL: string,
): string[] {
  const IGNORED_DIRS = new Set(['includes', 'images', 'examples']);

  const markdownList = [];
  for (const modifiedFile of modifiedFiles) {
    const modifiedFilePath = modifiedFile.split('/');

    // check if this is equal to 'source'
    const isSourceDir = modifiedFilePath[0] === 'source';

    // check if this is equal to either images, includes, or examples
    const isNonIgnoredDir = !IGNORED_DIRS.has(modifiedFilePath[1]);

    if (isSourceDir && isNonIgnoredDir) {
      const shortform = modifiedFile.replace('source', '').replace('.txt', '');
      markdownList.push(`[${modifiedFile}](${netlifyURL + shortform})`);
    }
  }

  return markdownList;
}
export { extension };
