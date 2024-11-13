import { HTMLAnchorElement, HTMLImageElement, Node, Window } from 'happy-dom';
import { promises as fsPromises } from 'node:fs';

function updateToRelativePaths(nodeList: Node[], prefix: string) {
  // for links: href = relativePath + href + index.html
  // for images: src = relativePath + src
  for (let index = 0; index < nodeList.length; index++) {
    const node = nodeList[index];
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

  await fsPromises.writeFile(filepath, document.documentElement.innerHTML);
};
