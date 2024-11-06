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
  // TODO: DOP-5167 use happy-dom to manipulate HTML file.
  // 
};


