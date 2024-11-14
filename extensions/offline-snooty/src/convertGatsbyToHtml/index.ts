/**
 * This process takes in a filepath and converts all the contents
 * of a gatsby output into a gzip of contents (limited to .html, .css, .png <or other image extension>)
 *
 * @param path full directory path of gatsby output
 */

import { existsSync, promises as fsPromises } from 'node:fs';
import { join } from 'node:path';
import { create } from 'tar';
import { handleHtmlFile } from './fileHandler';
import { IMAGE_EXT } from './imageExtensions';

type fileUpdateLog = {
  processedHtmlFiles: string[];
  removedFiles: string[];
  filePathsPerDir: { [key: string]: string[] };
};

// get all full directory pathnames leading up to current path
function getParentPaths(directoryPath: string): string[] {
  const res: string[] = [];
  let isRoot = false;
  let currentDirectory = directoryPath;
  while (!isRoot) {
    res.push(currentDirectory);
    const currentParts = currentDirectory.split('/');
    currentDirectory = currentParts.slice(0, -1).join('/');
    // note: can update this to be read from original rootDirectoryPath of scanFileTree.
    isRoot =
      currentParts[currentParts.length - 1] === 'public' &&
      currentParts[currentParts.length - 2] === 'snooty';
  }

  return res;
}

// traverses into a directory, and handles each file.
// each file type handler should handle what to do with current file type
async function scanFileTree(
  directoryPath: string,
  pathToRoot: string,
  fileUpdateLog: fileUpdateLog = {
    processedHtmlFiles: [],
    removedFiles: [],
    filePathsPerDir: {},
  },
) {
  console.log('scanFileTree');
  console.log(`directoryPath ${directoryPath}`);

  if (!existsSync(directoryPath)) {
    console.log(`no directory at ${directoryPath}`);
    return fileUpdateLog;
  }
  if (!fileUpdateLog.filePathsPerDir[directoryPath]) {
    fileUpdateLog.filePathsPerDir[directoryPath] = [];
  }

  const files = await fsPromises.readdir(directoryPath);
  for (const file of files) {
    const filename = join(directoryPath, file);
    const stat = await fsPromises.stat(filename);

    const extName = filename.split('.').pop() ?? '';
    console.log(
      `extName ${extName} of filename ${filename} isDIrectory ${stat.isDirectory()}`,
    );

    if (stat.isDirectory()) {
      scanFileTree(filename, '../' + pathToRoot, fileUpdateLog); //recurse
    } else if (extName.endsWith('html')) {
      await handleHtmlFile(filename, pathToRoot || './');
      const allParentPaths = getParentPaths(directoryPath);
      for (const parentPath of allParentPaths) {
        fileUpdateLog.filePathsPerDir[parentPath].push(filename);
      }
    } else if (IMAGE_EXT.has(extName)) {
      continue;
    } else {
      // delete the file
      // await fsPromises.rm(filename);
      console.log('skipping removing file ', filename);

      fileUpdateLog.removedFiles.push(filename);
    }
  }
  return fileUpdateLog;
}

export const convertGatsbyToHtml = async (
  gatsbyOutputPath: string,
  fileName: string,
): Promise<void> => {
  const log = await scanFileTree(gatsbyOutputPath, '');
  console.log('>>>>>>>>>> converted gatsby results <<<<<<<<<<<<<');
  console.log(JSON.stringify(log));
  console.log('skipping removing directories');

  // remove empty directories
  // for (const [path, filenames] of Object.entries(log.filePathsPerDir)) {
  //   if (!filenames.length) {
  //     await fsPromises.rm(path, { recursive: true, force: true });
  //   }
  // }

  await create(
    {
      gzip: true,
      file: fileName,
      cwd: gatsbyOutputPath,
    },
    ['./'],
  );
};
