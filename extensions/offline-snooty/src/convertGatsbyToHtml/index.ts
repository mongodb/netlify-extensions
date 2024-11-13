/**
 * This process takes in a filepath and converts all the contents
 * of a gatsby output into a gzip of contents (limited to .html, .css, .png <or other image extension>)
 *
 * @param path full directory path of gatsby output
 */

import {
  existsSync,
  lstatSync,
  readdirSync,
  promises as fsPromises,
} from "node:fs";
import { join } from "node:path";
import { create } from "tar";
import { handleHtmlFile, renameFile } from "./fileHandler";
import { IMAGE_EXT } from "./imageExtensions";

type fileUpdateLog = {
  processedHtmlFiles: string[];
  removedFiles: string[];
  filePathsPerDir: { [key: string]: string[] };
};

// travels into a directory, and handles each file.
// each file type handler should handle what to do with current file
async function scanFileTree(
  directoryPath: string,
  relativePath: string,
  fileUpdateLog: fileUpdateLog = {
    processedHtmlFiles: [],
    removedFiles: [],
    filePathsPerDir: {},
  }
) {
  if (!existsSync(directoryPath)) {
    console.log(`no directory at ${directoryPath}`);
  }

  const files = readdirSync(directoryPath);
  for (const file of files) {
    const filename = join(directoryPath, file);
    const stat = lstatSync(filename);
    const extName = filename.split(".").pop() ?? "";
    if (stat.isDirectory()) {
      scanFileTree(filename, "../" + relativePath, fileUpdateLog); //recurse
    } else if (extName.endsWith("html")) {
      await handleHtmlFile(filename, relativePath);
      fileUpdateLog.processedHtmlFiles.push(filename);
    } else if (IMAGE_EXT.has(extName)) {
      continue;
    } else {
      // delete the file
      await fsPromises.rm(file);
    }
  }
}

export const convertGatsbyToHtml = async (
  path: string,
  fileName: string
): Promise<void> => {
  await scanFileTree(path, "");
  await create(
    {
      gzip: true,
      file: fileName,
      cwd: path,
    },
    ["./"]
  );
};
