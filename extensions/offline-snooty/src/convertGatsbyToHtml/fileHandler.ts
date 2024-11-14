import { HTMLAnchorElement, HTMLImageElement, Node, Window } from 'happy-dom';
import { promises as fsPromises } from 'node:fs';

function updateToRelativePaths(nodeList: Node[], prefix: string) {
  // for links: href = relativePath + href + index.html
  // for images: src = relativePath + src
  for (const node of nodeList) {
    if (node instanceof HTMLAnchorElement) {
      if (!node['href'].startsWith('/')) {
        continue;
      }
      // TODO: strip hash and query portions
      const targetHref = (prefix + node['href'] + '/index.html').replaceAll(
        /\/+/g,
        '/',
      );
      node.setAttribute('href', targetHref);
    } else if (node instanceof HTMLImageElement) {
      if (!node['src'].startsWith('/')) {
        continue;
      }
      node['src'] = (prefix + node['src']).replace(/\/+/, '/');
    }
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
  // TODO: should handle background-image url as well
  updateToRelativePaths([...links, ...images], relativePath ?? './');

  console.log('writing file html ', filepath);

  await fsPromises.writeFile(filepath, document.documentElement.innerHTML);

  await window.happyDOM.close();
};
