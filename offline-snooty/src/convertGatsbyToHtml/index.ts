/**
 * This process takes in a filepath and converts all the contents
 * of a gatsby output into a gzip of contents (limited to .html, .css, .png <or other image extension>)
 *
 * @param path full directory path of gatsby output
 */

import { type Gzip, createGzip } from "node:zlib";
import {
  existsSync,
  readdirSync,
  lstatSync,
  mkdirSync,
  writeFileSync,
  createWriteStream,
} from "node:fs";
import { create } from "tar";
import { join } from "node:path";
import { handleHtmlFile } from "./fileHandler";

type fileUpdateLog = {
  processedHtmlFiles: string[];
  removedFiles: string[];
  filePathsPerDir: { [key: string]: string[] };
};

// travels into a directory, and handles each file.
// each file type handler should handle what to do with current file
async function scanFileTree(
  directoryPath: string,
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
    if (stat.isDirectory()) {
      scanFileTree(filename, fileUpdateLog); //recurse
    } else if (filename.endsWith(".html")) {
      await handleHtmlFile(filename);
      fileUpdateLog.processedHtmlFiles.push(filename);
    } else if (filename.endsWith("test")) {
    }
  }
}

export const convertGatsbyToHtml = async (path: string): Promise<void> => {
  await scanFileTree(path);
  await create(
    {
      gzip: true,
      file: "test-create-gzip.tgz", // TODO: update with netlify site,
      cwd: process.cwd(),
    },
    [path]
  );
};