import type { Document } from 'mongodb';
import type { Environments } from './assertDbEnvVars';

export type RefreshInfo = {
  deleted: number;
  upserted: number;
  modified: number;
  dateStarted: Date;
  elapsedMS: number;
};

export type Metadata = {
  robots: boolean;
  keywords: string | null;
  description?: string;
};

export type S3UploadParams = {
  bucket: string;
  prefix: string;
  fileName: string;
  manifest: string;
};

// type EnvironmentConfig = {
//   dev?: string;
//   stg: string;
//   dotcomstg: string;
//   dotcomprd: string;
//   prd: string;
// };

export interface BranchEntry {
  name?: string;
  gitBranchName: string;
  urlSlug: string;
  isStableBranch: boolean;
  active: boolean;
}

// export interface DocsetsDocument extends Document {
//   project: string;
//   url: EnvironmentConfig;
//   prefix: EnvironmentConfig;
// }

// export interface ReposBranchesDocument {
//   repoName: string;
//   project: string;
//   search?: {
//     categoryTitle: string;
//     categoryName?: string;
//   };
//   branches?: Array<BranchEntry>;
//   prodDeployable: boolean;
//   internalOnly: boolean;
// }

// export interface SearchDocument {
//   url: string;
//   slug: string;
//   lastModified: Date;
//   manifestRevisionId: string;
//   searchProperty: Array<string>;
//   includeInGlobalSearch: boolean;
// }

// export type ManifestFacets = Record<string, Array<string> | undefined> | null;

// export type ManifestEntry = {
//   slug: string;
//   strippedSlug?: string;
//   title: string;
//   headings?: Array<string>;
//   paragraphs: string;
//   code: Array<{ lang: string | null; value: string }>;
//   preview?: string | null;
//   tags: string | null;
//   facets: ManifestFacets;
// };

// export type EnvVars = {
//   ATLAS_CLUSTER0_URI: string;
//   SNOOTY_DB_NAME: string;
//   ATLAS_SEARCH_URI: string;
//   SEARCH_DB_NAME: string;
//   REPOS_BRANCHES_COLLECTION: string;
//   DOCSETS_COLLECTION: string;
//   DOCUMENTS_COLLECTION: string;
// };

// export type ConfigEnvironmentVariables = Partial<{
//   BRANCH: string;
//   SITE_NAME: string;
//   INCOMING_HOOK_URL?: string;
//   INCOMING_HOOK_TITLE?: string;
//   INCOMING_HOOK_BODY?: string;
//   ENV: Environments;
//   REPO_ENTRY: ReposBranchesDocument;
//   DOCSET_ENTRY: DocsetsDocument;
//   BRANCH_ENTRY: BranchEntry;
//   POOL_DB_NAME: PoolDbName;
//   SEARCH_DB_NAME: SearchDbName;
//   SNOOTY_DB_NAME: SnootyDbName;
// }>;

// export type PoolDbName = 'pool' | 'pool_test';

// export type SearchDbName = 'search' | 'search-test' | 'search-stage';

// export type SnootyDbName =
//   | 'snooty_dev'
//   | 'snooty_stage'
//   | 'snooty_dotcomstg'
//   | 'snooty_prod'
//   | 'snooty_dotcomprd';
