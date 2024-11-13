import { HTMLAnchorElement, HTMLImageElement, Node, Window } from "happy-dom";
import { promises as fsPromises } from "node:fs";

function updateToRelativePaths(nodeList: Node[], prefix: string) {
  // for links: href = relativePath + href + index.html
  // for images: src = relativePath + src
  for (let index = 0; index < nodeList.length; index++) {
    const node = nodeList[index];
    if (node instanceof HTMLAnchorElement) {
      if (!node["href"].startsWith("/")) {
        continue;
      }
      node["href"] = (prefix + node["href"] + "/index.html").replace(
        /\/+/,
        "/"
      );
    } else if (node instanceof HTMLImageElement) {
      if (!node["src"].startsWith("/")) {
        continue;
      }
      node["src"] = (prefix + node["src"]).replace(/\/+/, "/");
    }
  }
}

export const handleHtmlFile = async (
  filepath: string,
  relativePath: string
) => {
  // update the DOM. change paths for links and images
  // first open the file. as a DOM string.
  const html = (await fsPromises.readFile(filepath)).toString();
  const window = new Window();
  const document = window.document;
  document.write(html);

  const links = document.querySelectorAll("a");
  const images = document.querySelectorAll("img");
  updateToRelativePaths([...links, ...images], relativePath ?? "./");
  document.toString();
  await fsPromises.writeFile(filepath, document.toString());
  console.log(`wrote new html ${filepath}`);
};

export const renameFile = async (filepath: string, relativePath: string) => {};

export const deleteFile = async (filePath: string) => {};
