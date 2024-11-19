/**
 * This process takes in a filepath and converts all the contents
 * of a gatsby output into a gzip of contents (limited to .html, .css, .png <or other image extension>)
 *
 * @param path full directory path of gatsby output
 */

import { existsSync, promises as fsPromises } from 'node:fs';
import { join, dirname } from 'node:path';
import { create } from 'tar';
import { handleHtmlFile } from './fileHandler';
import { IMAGE_EXT } from './imageExtensions';
import { PUBLIC_OUTPUT_PATH } from '..';

type FileUpdateLog = {
  processedHtmlFiles: string[];
  removedFiles: string[];
  filePathsPerDir: { [key: string]: string[] };
};

const log: FileUpdateLog = {
  processedHtmlFiles: [],
  removedFiles: [],
  filePathsPerDir: {},
};

// get all full directory pathnames leading up to current path
function getParentPaths(filename: string): string[] {
  const res: string[] = [];
  let currentDirectory = dirname(filename);
  let isRoot = currentDirectory === PUBLIC_OUTPUT_PATH;
  while (!isRoot) {
    res.push(currentDirectory);
    const currentParts = currentDirectory.split('/');
    currentDirectory = currentParts.slice(0, -1).join('/');
    // note: can update this to be read from original rootfilename of scanFileTree.
    isRoot = currentDirectory === PUBLIC_OUTPUT_PATH;
  }

  return res;
}

// traverses into a directory, and handles each file.
// each file type handler should handle what to do with current file type
async function scanFileTree(directoryPath: string) {
  if (!existsSync(directoryPath)) {
    console.error(`no directory at ${directoryPath}`);
    return;
  }
  if (!log.filePathsPerDir[directoryPath]) {
    log.filePathsPerDir[directoryPath] = [];
  }

  const files = await fsPromises.readdir(directoryPath, { recursive: true });
  for (const file of files) {
    const filename = join(directoryPath, file);
    const stat = await fsPromises.stat(filename);
    const extName = filename.split('.').pop() ?? '';

    if (stat.isDirectory() || IMAGE_EXT.has(extName)) {
      continue;
    }
    if (extName.endsWith('html')) {
      const allParentPaths = getParentPaths(filename);
      const pathBackToRoot = '../'.repeat(allParentPaths.length);
      await handleHtmlFile(filename, pathBackToRoot || './');
      for (const parentPath of allParentPaths) {
        if (!log.filePathsPerDir[parentPath]) {
          log.filePathsPerDir[parentPath] = [];
        }
        log.filePathsPerDir[parentPath].push(filename);
      }
    } else {
      // delete the file
      await fsPromises.rm(filename);
      console.log('removing file ', filename);

      log.removedFiles.push(filename);
    }
  }
}

export const convertGatsbyToHtml = async (
  gatsbyOutputPath: string,
  fileName: string,
): Promise<void> => {
  await scanFileTree(gatsbyOutputPath);
  console.log('>>>>>>>>>> converted gatsby results <<<<<<<<<<<<<');
  console.log(JSON.stringify(log));

  // remove empty directories
  await Promise.all(
    Object.entries(log.filePathsPerDir).map(async ([path, filenames]) => {
      if (!filenames.length && path !== PUBLIC_OUTPUT_PATH) {
        return fsPromises.rm(path, { recursive: true, force: true });
      }
    }),
  );

  await create(
    {
      gzip: true,
      file: fileName,
      cwd: gatsbyOutputPath,
    },
    ['./'],
  );
};
