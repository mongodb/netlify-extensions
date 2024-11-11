import type { NetlifyPluginUtils } from '@netlify/build';
import type { OASPageMetadata } from '.';
import { getAtlasSpecUrl } from './atlas';
import { db } from './utils/db';
import { writeFileAsync } from './utils/fs-async';

export interface RedocVersionOptions {
  active: {
    apiVersion: string;
    resourceVersion: string;
  };
  rootUrl: string;
  resourceVersions: string[];
}
const GIT_HASH_URL = 'https://cloud-dev.mongodb.com/version';
const COLLECTION_NAME = 'oas_files';

const OAS_FILE_SERVER =
  'https://mongodb-mms-build-server.s3.amazonaws.com/openapi/';

export const normalizePath = (path: string) => path.replace(/\/+/g, '/');
export const normalizeUrl = (url: string) => {
  const urlObject = new URL(url);
  urlObject.pathname = normalizePath(urlObject.pathname);
  return urlObject.href;
};

interface GetOASpecParams {
  sourceType: string;
  source: string;
  output: string;
  pageSlug: string;
  siteUrl: string;
  siteTitle: string;
  resourceVersions?: string[];
  apiVersion?: string;
  resourceVersion?: string;
}

export async function getBuildOasSpecCommand({
  source,
  sourceType,
  pageSlug,
  output,
  siteUrl,
  siteTitle,
  apiVersion,
  resourceVersion,
}: GetOASpecParams) {
  try {
    let spec = '';
    let isSuccessfulBuild = true;

    if (sourceType === 'url') {
      spec = source;
    } else if (sourceType === 'local') {
      const localFilePath = `source${source}`;
      spec = localFilePath;
    } else if (sourceType === 'atlas') {
      const { oasFileURL, successfulGitHash } = await getAtlasSpecUrl({
        apiKeyword: source,
        apiVersion,
        resourceVersion,
      });

      spec = oasFileURL;
      isSuccessfulBuild = successfulGitHash;
    } else {
      throw new Error(
        `Unsupported source type "${sourceType}" for ${pageSlug}`,
      );
    }

    const path = `${output}/${pageSlug}/index.html`;
    const finalFilename = normalizePath(path);
    await writeFileAsync(
      `${process.cwd()}/options.json`,
      JSON.stringify({ siteUrl, siteTitle, ignoreIncompatibleTypes: true }),
    );
    return `node ${process.cwd()}/redoc/cli/index.js build ${spec} --output ${finalFilename} --options ${process.cwd()}/options.json`;
  } catch (e) {
    console.error(e);
    return '';
  }
}

interface PageBuilderOptions {
  siteTitle: string;
  siteUrl: string;
}

const fetchTextData = async (url: string, errMsg: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    // Error should be caught when creating pages.
    throw new Error(`${errMsg}; ${res.statusText}`);
  }
  return res.text();
};

const createFetchGitHash = () => {
  let gitHashCache: string;
  return {
    fetchGitHash: async () => {
      if (gitHashCache) return gitHashCache;
      try {
        const gitHash = await fetchTextData(
          GIT_HASH_URL,
          'Could not find current version or git hash',
        );
        gitHashCache = gitHash;
        return gitHash;
      } catch (e) {
        console.error(e);
        throw new Error('Unsuccessful git hash fetch');
      }
    },
    resetGitHashCache: () => {
      gitHashCache = '';
    },
  };
};

const { fetchGitHash, resetGitHashCache } = createFetchGitHash();
export const fetchVersionData = async (gitHash: string, serverURL: string) => {
  const versionUrl = `${serverURL}${gitHash}-api-versions.json`;
  const res = await fetch(versionUrl);
  const { versions } = await res.json();
  return versions;
};

export interface OASFile {
  api: string;
  fileContent: string;
  gitHash: string;
  lastUpdated: string;
  versions: Record<string, string>;
}

export const saveSuccessfulBuildVersionData = async (
  apiKeyword: string,
  gitHash: string,
  versionData: Record<string, string>,
) => {
  const dbSession = await db();
  try {
    const query = {
      api: apiKeyword,
    };
    const update = {
      $set: {
        gitHash: gitHash,
        versions: versionData,
        lastUpdated: new Date().toISOString(),
      },
    };
    const options = {
      upsert: true,
    };

    const oasFilesCollection = dbSession.collection<OASFile>(COLLECTION_NAME);
    await oasFilesCollection.updateOne(query, update, options);
  } catch (error) {
    console.error(
      `Error updating lastest git hash and versions for API: ${apiKeyword}.`,
    );
    throw error;
  }
};

export async function buildOpenAPIPages(
  entries: [string, OASPageMetadata][],
  { siteUrl, siteTitle }: PageBuilderOptions,
  run: NetlifyPluginUtils['run'],
) {
  for (const [pageSlug, data] of entries) {
    const {
      source_type: sourceType,
      source,
      api_version: apiVersion,
      resource_versions: resourceVersions,
    } = data;

    let isSuccessfulBuild = true;

    if (resourceVersions) {
      const isRunSuccessfulArray = await Promise.all(
        resourceVersions.map(async (resourceVersion) => {
          // if a resource versions array is provided, then we can loop through the resourceVersions array and call the getOASpec
          // for each minor version
          try {
            const command = await getBuildOasSpecCommand({
              source,
              sourceType,
              output: `${process.cwd()}/snooty/public`,
              pageSlug,
              siteUrl,
              siteTitle,
              apiVersion,
              resourceVersions,
              resourceVersion,
            });

            await run.command(command);

            return true;
          } catch (e) {
            console.error('an error occurred', e);

            return false;
          }
        }),
      );
      isSuccessfulBuild = isRunSuccessfulArray.every(
        (isSuccessful) => isSuccessful,
      );
    }

    try {
      const command = await getBuildOasSpecCommand({
        source,
        sourceType,
        output: `${process.cwd()}/snooty/public`,
        pageSlug,
        siteUrl,
        siteTitle,
        apiVersion,
      });
      await run.command(command);

      isSuccessfulBuild = true;
    } catch (e) {
      console.error('an error occurred', e);

      isSuccessfulBuild = false;
    }

    // If all builds successful, persist git hash and version data in db
    if (isSuccessfulBuild && sourceType === 'atlas') {
      try {
        const gitHash = await fetchGitHash();
        const versions = await fetchVersionData(gitHash, OAS_FILE_SERVER);
        await saveSuccessfulBuildVersionData(source, gitHash, versions);
      } catch (e) {
        console.error(e);
      }
    }
    resetGitHashCache();
  }
}
