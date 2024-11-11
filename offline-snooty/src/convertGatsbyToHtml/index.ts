/**
 * This process takes in a filepath and converts all the contents
 * of a gatsby output into a gzip of contents (limited to .html, .css, .png <or other image extension>)
 *
 * @param path full directory path of gatsby output
 */

import { type Gzip, createGzip } from 'node:zlib';

export const convertGatsbyToHtml = async (path: string): Promise<Gzip> => {
  return createGzip();
};
