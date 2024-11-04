import { renameSync, mkdirSync, writeFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { NEW_SNOOTY_PATH } from "..";

const OUTPUT_DIR = "public";
const BASE_PATH = `${NEW_SNOOTY_PATH}/snooty/${OUTPUT_DIR}/`;

const getRelativePathToRoot = (filepath: string) => {
  const filePathParts = filepath.split("/");
  let relativePath = "";
  for (let index = filePathParts.length - 2; index >= 0; index--) {
    const pathPart = filePathParts[index];
    if (pathPart === OUTPUT_DIR) {
      break;
    }
    relativePath += "../";
  }
  return relativePath ? relativePath : "./";
};

export const handleHtmlFile = async (filepath: string) => {
  const dom = await JSDOM.fromFile(filepath);
  console.log("dom created");
  const document = dom.window.document;
  const images = document.querySelectorAll("img");
  const links = document.querySelectorAll("a");

  // filepath Desktop/repositories/snooty-offline/snooty/public/getting-started/index.html
  // targetPath Desktop/repositories/snooty-offline/snooty/public/getting-started
  const targetPath = filepath.split("/").slice(0, -1).join("/");
  const relativePath = getRelativePathToRoot(targetPath);

  for (const image of [...images]) {
    if (!image.src.startsWith("http")) {
      image.src = `${relativePath}${image.src}`;
      image.srcset = "";
    }
  }
  for (const link of [...links]) {
    if (!link.href.startsWith("http")) {
      const pureHref = link.href.split("#")[0];
      const tag = link.href.split("#")[1];
      link.href = `${relativePath}${pureHref}${tag ? `#${tag}` : ``}`;
    }
  }

  mkdirSync(targetPath.split("/").slice(0, -1).join("/"), { recursive: true });
  writeFileSync(targetPath + ".html", dom.serialize());
};
