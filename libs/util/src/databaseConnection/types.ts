import type { ObjectId } from 'mongodb';

export type Environments = 'dev' | 'stg' | 'dotcomstg' | 'prd' | 'dotcomprd';

export type EnvironmentConfig = {
  dev?: string;
  stg: string;
  dotcomstg: string;
  prd: string;
  dotcomprd: string;
};

export type DocsetsDocument = {
  project: string;
  bucket: EnvironmentConfig;
  url: EnvironmentConfig;
  prefix: EnvironmentConfig;
};

export type ClusterZeroConnectionInfo = {
  clusterZeroURI: string;
  databaseName: ClusterZeroDBName;
  collectionName: string;
  extensionName: string;
};

export type SearchClusterConnectionInfo = {
  searchURI: string;
  databaseName: SearchDBName;
  collectionName: string;
  extensionName: string;
};

export type BranchEntry = {
  id?: ObjectId;
  name?: string;
  gitBranchName: string;
  active: boolean;
  isStableBranch: boolean;
  urlSlug: string;
  publishOriginalBranchName: boolean;
  urlAliases: Array<string>;
};

export type ReposBranchesDocument = {
  _id?: ObjectId;
  repoName: string;
  project: string;
  search?: {
    categoryTitle: string;
    categoryName?: string;
  };
  branches?: Array<BranchEntry>;
  prodDeployable: boolean;
  internalOnly: boolean;
};

export type S3UploadParams = {
  bucket: string;
  prefix: string;
  fileName: string;
  obj: string;
};

export type SearchDocument = {
  url: string;
  slug: string;
  lastModified: Date;
  manifestRevisionId: string;
  searchProperty: Array<string>;
  includeInGlobalSearch: boolean;
};

export type ProjectsDocument = {
  name: string;
  owner: string;
  baseUrl: string;
  github: {
    organization: OrganizationName;
    repo: string;
  };
  jira: {
    component: string;
  };
};

export type OASFilesDocument = {
  api: string;
  fileContent: string;
  gitHash: string;
  versions: Record<string, Array<string>>;
  lastUpdated: Date;
};

export type OASFilePartial = Pick<OASFilesDocument, 'gitHash' | 'versions'>;

export type DocumentsDocument = {
  page_id: string;
  filename: string;
  ast: Ast;
  source: string;
  static_assets: Array<StaticAsset>;
  github_username: string;
  facets?: Array<Facet>;
  build_id: ObjectId;
  created_at: Date;
};

export type Facet = {
  category: string;
  value: string;
  sub_facets: Array<Facet>;
  display_name: string;
};

type StaticAsset = {
  checksum: string;
  key: string;
  updated_at?: Date;
};

type Ast = {
  type: string;
  position: Record<string, Record<string, number>>;
  children: Array<Ast>;
  fileid: string;
  options: {
    headings?: Array<AstHeadings>;
  };
};

type AstHeadings = {
  depth: number;
  id: string;
  title: Array<Record<string, string>>;
  // biome-ignore: <Most selector_id fields appear to be nullish>
  selector_ids: unknown;
};

export type OrganizationName = 'mongodb' | '10gen';

export type SearchDBName = 'search' | 'search-test' | 'search-staging';

export type PoolDBName = 'pool' | 'pool_test';

export type MetadataDBName = 'docs_metadata';

export type SnootyDBName =
  | 'test'
  | 'snooty_dev'
  | 'snooty_prod'
  | 'snooty_dotcomstg'
  | 'snooty_dotcomprd';

export type ClusterZeroDBName = PoolDBName | MetadataDBName | SnootyDBName;
