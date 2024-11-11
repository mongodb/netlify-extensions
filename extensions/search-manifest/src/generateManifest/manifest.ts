import type { ManifestEntry } from '../types';

export class Manifest {
  url: string;
  global: boolean;
  documents: ManifestEntry[];

  constructor(url = '', includeInGlobalSearch = false) {
    this.url = url;
    this.documents = [];
    this.global = includeInGlobalSearch;
  }

  setUrl(url: string) {
    this.url = url;
  }

  setGlobalSearchValue(global: boolean) {
    this.global = global;
  }

  // Adds a document to a manifest
  addDocument(document: ManifestEntry) {
    this.documents.push(document);
  }

  // Returns the manifest as JSON formatted string
  export() {
    const manifest = {
      url: this.url,
      includeInGlobalSearch: this.global,
      documents: this.documents,
    };

    return JSON.stringify(manifest);
  }
}
