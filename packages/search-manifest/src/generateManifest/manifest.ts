import { ManifestEntry } from "./manifestEntry";

export class Manifest {
  url: string;
  global: boolean;
  documents: ManifestEntry[];

  constructor(includeInGlobalSearch: boolean, url: string = "") {
    this.url = url;
    this.global = includeInGlobalSearch;
    this.documents = [];
  }

  addDocument(document: ManifestEntry | null) {
    //Add a document to the manifest
    if (document) {
      this.documents.push(document);
    }
  }

  export() {
    //return the manifest as json
    const manifest = {
      url: this.url,
      includeInGlobalSearch: this.global,
      documents: this.documents,
    };

    return manifest;
  }
}
