import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import {
  insert,
  mockDb,
  removeDocuments,
  teardownMockDbClient,
} from '../utils/mockDB';

import {
  getBranch,
  getProperties,
} from '../../src/uploadToAtlas/getProperties';

import { afterEach } from 'node:test';
import type { BranchEntry } from '../../src/types';
import { getDocumentsCollection } from '../../src/uploadToAtlas/searchConnector';
import { uploadManifest } from '../../src/uploadToAtlas/uploadManifest';
//simulate the docsests collection in an object
import docsets from '../resources/mockCollections/docsets.json';
// simulate the repos_branches collection in an object
import repos_branches from '../resources/mockCollections/repos-branches.json';
import { getManifest } from '../utils/getManifest';

const BRANCH_NAME_MASTER = 'master';
const BRANCH_NAME_BETA = 'beta';
const BRANCH_NAME_GIBBERISH = 'gibberish';

const DOCS_COMPASS_NAME = 'docs-compass';
const DOCS_CLOUD_NAME = 'cloud-docs';
const DOCS_APP_SERVICES_NAME = 'docs-app-services';
const DOCS_MONGODB_INTERNAL_NAME = 'docs-mongodb-internal';
const DOCS_MMS_NAME = 'mms-docs';

beforeAll(async () => {
  //insert repo metadata into dummy repos_branches and docsets collections
  const db = await mockDb();
  await insert(db, 'repos_branches', repos_branches);
  await insert(db, 'docsets', docsets);

  vi.mock('../../src/uploadToAtlas/searchConnector', async () => {
    const {
      teardownMockDbClient,
      getReposBranchesCollection,
      getDocsetsCollection,
      getDocumentsCollection,
      getSearchDb,
      getSnootyDb,
    } = await import('../utils/mockDB');
    return {
      teardown: teardownMockDbClient,
      getSearchDb: getSearchDb,
      getSnootyDb: getSnootyDb,
      getDocumentsCollection: getDocumentsCollection,
      getReposBranchesCollection: getReposBranchesCollection,
      getDocsetsCollection: getDocsetsCollection,
    };
  });
});

afterAll(async () => {
  //teardown db instance
  await removeDocuments('repos_branches');
  await teardownMockDbClient();
});

describe('given an array of branches and a branch name, the corrct output is returned', () => {
  //mock branches object
  const branches: Array<BranchEntry> = repos_branches[1].branches;
  test('given a branch name that exists in the branches array, the correct branch object is returned', () => {
    expect(getBranch(branches, BRANCH_NAME_MASTER)).toEqual({
      gitBranchName: 'master',
      isStableBranch: true,
      urlSlug: 'current',
      active: true,
    });
  });

  test('given a branch name that exists with different capitalization than in the branches array, the correct branch object is still returned', () => {
    expect(getBranch(branches, 'MASTER')).toEqual({
      gitBranchName: 'master',
      isStableBranch: true,
      urlSlug: 'current',
      active: true,
    });
  });

  test("given a branch name that doesn't exist in the branches array, undefined is returned", () => {
    expect(() => getBranch(branches, BRANCH_NAME_GIBBERISH)).toThrowError(
      new Error(`Branch ${BRANCH_NAME_GIBBERISH} not found in branches object`),
    );
  });
  test('given a branch name and an empty branches array, undefined is returned', () => {
    expect(() => getBranch([], BRANCH_NAME_MASTER)).toThrowError(
      `Branch ${BRANCH_NAME_MASTER} not found in branches object`,
    );
  });
});

//two tests for a repo with multiple branches, one test for a repo with only one branch
describe('Given a branchname, get the properties associated with it from repos_branches', () => {
  //mock repo name
  test(`correct properties are retrieved for branch ${BRANCH_NAME_MASTER} of repoName ${DOCS_COMPASS_NAME}`, async () => {
    //define expected properties object for master branch of Compass repo
    const compassMasterProperties = {
      searchProperty: 'compass-current',
      projectName: 'compass',
      url: 'http://mongodb.com/docs/compass/',
      includeInGlobalSearch: true,
    };
    expect(
      await getProperties({
        branchName: BRANCH_NAME_MASTER,
        repoName: DOCS_COMPASS_NAME,
      }),
    ).toEqual(compassMasterProperties);
  });

  test(`correct properties are retrieved for branch ${BRANCH_NAME_MASTER} of repoName ${DOCS_CLOUD_NAME}`, async () => {
    //define expected properties object for master branch of cloud-docs repo
    const cloudDocsMasterProperties = {
      searchProperty: 'atlas-master',
      projectName: 'cloud-docs',
      url: 'http://mongodb.com/docs/atlas/',
      includeInGlobalSearch: true,
    };

    expect(
      await getProperties({
        branchName: BRANCH_NAME_MASTER,
        repoName: DOCS_CLOUD_NAME,
      }),
    ).toEqual(cloudDocsMasterProperties);
  });
});

describe(
  'GetProperties behaves as expected for stale properties',
  () => {
    afterEach(async () => {
      console.log(await removeDocuments('documents'));
    });

    test('getting properties for an inactive branch with no existing documents executes correctly and does not change db document count', async () => {
      //populate db with manifests
      const manifest1 = await getManifest('mms-master');
      await uploadManifest(manifest1, 'mms-docs-stable');
      //check number of documents initially in db
      const documentCount = await (
        await getDocumentsCollection()
      ).countDocuments();

      //getProperties for beta doens't change number of documents in collection
      await expect(
        getProperties({
          branchName: BRANCH_NAME_BETA,
          repoName: DOCS_COMPASS_NAME,
        }),
      ).rejects.toThrow();
      expect(await (await getDocumentsCollection()).countDocuments()).toEqual(
        documentCount,
      );
    });

    test("non prod-deployable repo throws and doesn't return properties", async () => {
      await expect(
        getProperties({
          branchName: 'v5.0',
          repoName: DOCS_MONGODB_INTERNAL_NAME,
        }),
      ).rejects.toThrow(
        `Search manifest should not be generated for repo ${DOCS_MONGODB_INTERNAL_NAME}. Removing all associated manifests`,
      );
    });

    test(`no properties are retrieved for branch on repo ${DOCS_APP_SERVICES_NAME} without a "search" field. `, async () => {
      await expect(
        getProperties({
          branchName: BRANCH_NAME_MASTER,
          repoName: DOCS_MONGODB_INTERNAL_NAME,
        }),
      ).rejects.toThrow();
    });

    test('repo with no search categoryTitle removes all old documents with search properties beginning with that project name', async () => {
      //add documents for project from two diff branches to search DB
      const manifest1 = await getManifest('mms-master');

      await uploadManifest(manifest1, 'mms-docs-stable');

      const manifest2 = await getManifest('mms-v1.3');
      await uploadManifest(manifest2, 'mms-docs-v1.3');

      //trying to get properties for repo removes those older documents
      const documentCount = await (
        await getDocumentsCollection()
      ).countDocuments();
      await expect(
        getProperties({
          branchName: BRANCH_NAME_MASTER,
          repoName: DOCS_MMS_NAME,
        }),
      ).rejects.toThrow();
      //throws
      //no return type

      const documentCount2 = await (
        await getDocumentsCollection()
      ).countDocuments();
      expect(documentCount2).toEqual(
        documentCount - manifest1.documents.length - manifest2.documents.length,
      );
    });

    test('getting properties for an inactive branch removes all old documents with that exact project-version searchProperty', async () => {
      //add documents for project from two diff branches to DB-- docs-compass master and beta
      const manifest1 = await getManifest('compass-master');
      await uploadManifest(manifest1, 'compass-current');
      const manifest2 = await getManifest('compass-beta');
      await uploadManifest(manifest2, 'compass-upcoming');

      //trying to get properties for repo removes only the older documents from that specific branch, beta

      const documentCount = await (
        await getDocumentsCollection()
      ).countDocuments();
      await expect(
        getProperties({
          branchName: BRANCH_NAME_BETA,
          repoName: DOCS_COMPASS_NAME,
        }),
      ).rejects.toThrow();
      const documentCount2 = await (
        await getDocumentsCollection()
      ).countDocuments();
      expect(documentCount2).toEqual(
        documentCount - manifest2.documents.length,
      );
    });
  },
  { timeout: 10000 },
);
