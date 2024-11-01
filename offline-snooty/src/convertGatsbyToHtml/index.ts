/**
 * This process takes in a filepath and converts all the contents
 * of a gatsby output into a gzip of contents (limited to .html, .css, .png <or other image extension>)
 *
 * @param path full directory path of gatsby output
 */

import * as zlib from 'zlib';

export const convertGatsbyToHtml = async (path: string): Promise<zlib.Gzip> => {
  return zlib.createGzip();
};
