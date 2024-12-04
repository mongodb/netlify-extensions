import {
  HTMLAnchorElement,
  HTMLImageElement,
  type Node,
  Window,
} from 'happy-dom';
import { promises as fsPromises } from 'node:fs';

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
      node.src = (prefix + node.src).replace(/\/+/, '/');
    }
  }
}

function removeScripts(document: Window['document']) {
  const query = 'script:not(.structured_data)';
  const scripts = document.querySelectorAll(query);
  for (const script of scripts) {
    script.parentNode?.removeChild(script);
  }
}

export const handleHtmlFile = async (
  filepath: string,
  relativePath: string,
) => {
  console.log('handlehtmlfile ', filepath);
  // update the DOM. change paths for links and images
  // first open the file. as a DOM string.
  const html = (await fsPromises.readFile(filepath)).toString();
  const window = new Window();
  const document = window.document;
  document.write(html);

  const links = document.querySelectorAll('a');
  const images = document.querySelectorAll('img');
  // TODO as part of DOP-5196
  updateToRelativePaths([...links, ...images], relativePath ?? './');
  removeScripts(document);

  console.log('writing file html ', filepath);

  await fsPromises.writeFile(filepath, document.documentElement.innerHTML);

  await window.happyDOM.close();
};
