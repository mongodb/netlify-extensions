import {
  HTMLAnchorElement,
  HTMLImageElement,
  type Node,
  Window,
} from 'happy-dom';
import { promises as fsPromises, createWriteStream } from 'node:fs';
import { Readable, promises } from 'node:stream';
import { join } from 'node:path';
import { PUBLIC_OUTPUT_PATH } from '..';

function updateToRelativePaths(nodeList: Node[], prefix: string) {
  // for links: href = relativePath + href + index.html
  // for images: src = relativePath + src
  for (const node of nodeList) {
    if (node instanceof HTMLAnchorElement && node.href.startsWith('/')) {
      // TODO: strip hash and query portions
      const targetHref = `${prefix + node.href}/index.html`.replaceAll(
        /\/+/g,
        '/',
      );
      node.setAttribute('href', targetHref);
    } else if (node instanceof HTMLImageElement && node.src.startsWith('/')) {
      node.src = (prefix + node.src).replace(/\/+/g, '/');
    }
  }
}

async function saveImageAndUpdateSrc(img: HTMLImageElement, prefix: string) {
  const url = new URL(img.getAttribute('src'));
  // get the path to save the file to
  const targetFileName = url.pathname;
  const fileNameParts = targetFileName.split('/');
  console.log('check fileNameParts ', fileNameParts);

  // create the directory, at same URL path as original image src
  const targetDir = `${PUBLIC_OUTPUT_PATH}/images/${fileNameParts.slice(0, fileNameParts.length - 1).join('/')}`;
  const targetFilePath = `${targetDir}/${fileNameParts[fileNameParts.length - 1]}`;
  await fsPromises.mkdir(targetDir, { recursive: true });

  // save res to file
  const res = await fetch(url);
  const filestream = createWriteStream(targetFilePath);
  await promises.finished(
    Readable.fromWeb(res.body as ReadableStream).pipe(filestream),
  );

  // update img src to be relative to above
  img.src = join(prefix, 'images', targetFileName);
}

async function downloadRemoteImages(
  document: Window['document'],
  prefix: string,
) {
  // find all remote img src
  const imgNodes = document.querySelectorAll('img[src^=http]');
  const promises = [];

  for (const imgNode of imgNodes.values()) {
    promises.push(saveImageAndUpdateSrc(imgNode as HTMLImageElement, prefix));
  }

  return Promise.all(promises);
}

function removeScripts(document: Window['document']) {
  const offlineScriptsClass = 'snooty-offline-ui';
  const structuredDataClass = 'structured_data';
  const query = `script:not(.${structuredDataClass}):not(.${offlineScriptsClass})`;
  const scripts = document.querySelectorAll(query);
  for (const script of scripts) {
    script.parentNode?.removeChild(script);
  }
}

export const handleHtmlFile = async (
  filepath: string,
  relativePath: string,
) => {
  // update the DOM. change paths for links and images
  // first open the file. as a DOM string.
  try {

    const html = (await fsPromises.readFile(filepath)).toString();
    const window = new Window();
    const document = window.document;
    document.write(html);
  
    const links = document.querySelectorAll('a');
    const images = document.querySelectorAll('img');
    await downloadRemoteImages(document, relativePath);
    updateToRelativePaths([...links, ...images], relativePath ?? './');
    removeScripts(document);
  
    await fsPromises.writeFile(filepath, document.documentElement.innerHTML);
  
    await window.happyDOM.close();
  } catch (e) {
    console.error('Error while handling html file')
    console.error(e);
    throw e;
  }
};
