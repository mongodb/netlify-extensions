import { afterEach, beforeAll, describe, expect, it, test, vi } from 'vitest';
import type { ManifestEntry } from '../../src/types';
import atlasAppServicesManifest from '../resources/s3Manifests/atlas-app-services-master.json';
import compassMasterManifest from '../resources/s3Manifests/compass-current.json';
import compassBetaManifest from '../resources/s3Manifests/compass-upcoming.json';
import kotlinManifest from '../resources/s3Manifests/kotlin-upcoming.json';
import nodeManifest from '../resources/s3Manifests/node-current.json';
import { getManifest } from '../utils/getManifest';

describe.each([
  { manifestName: 'node-current', s3Manifest: nodeManifest },
  { manifestName: 'kotlin', s3Manifest: kotlinManifest },
  { manifestName: 'compass-beta', s3Manifest: compassBetaManifest },
  // { manifestName: "compass-master", s3Manifest: compassMasterManifest },

  // { manifestName: "app-services-master", s3Manifest: atlasAppServicesManifest },
])('Generate manifests from ast', async ({ manifestName, s3Manifest }) => {
  //generate new manifest
  const manifest = await getManifest(manifestName);

  it('has generated the manifest', async () => {
    expect(manifest).toBeTruthy();
  });

  it('has the correct document length', () => {
    expect(manifest.documents).toHaveLength(s3Manifest.documents.length);
  });
});

describe.each([
  {
    manifestName: 'node-current',
    s3Manifest: nodeManifest,
  },
  { manifestName: 'kotlin', s3Manifest: kotlinManifest },
  { manifestName: 'compass-beta', s3Manifest: compassBetaManifest },
])(
  'has the correct document properties',
  async ({ manifestName, s3Manifest }) => {
    const manifest = await getManifest(manifestName);
    let slug: string;

    //TODO: put in a loop to check multiple manifestEntries against each other
    let equivDoc: ManifestEntry;
    let manifestDoc: ManifestEntry;
    for (const doc of manifest.documents) {
      slug = doc.slug;
      manifestDoc = doc;
      for (const document of s3Manifest.documents) {
        if (document.slug === slug) {
          equivDoc = document;
        }
      }

      it('is of type string', () => {
        expect(manifestDoc.slug).toBeTypeOf('string');
      });

      it('matches the slug', () => {
        //slug
        expect(manifestDoc.slug).toEqual(equivDoc.slug);
      });

      it('matches the heading', () => {
        //headings
        expect(manifestDoc.headings).toEqual(equivDoc.headings);
      });

      it('matches the paragraphs', () => {
        //paragraphs
        expect(manifestDoc.paragraphs).toEqual(equivDoc.paragraphs);
      });

      it('matches the code', () => {
        //code
        expect(manifestDoc.code).toEqual(equivDoc.code);
      });
      //preview
      it('matches preview', () => {
        expect(manifestDoc.preview).toEqual(equivDoc.preview);
      });

      //tags
      it('matches tags', () => {
        expect(manifestDoc.tags).toEqual(equivDoc.tags);
      });

      //facets
      it('matches facets', () => {
        expect(manifestDoc.facets).toEqual(equivDoc.facets);
      });
    }
  },
);

//TODO: test Document creation
describe.each([
  {
    manifestName: 'node',
  },
  { manifestName: 'kotlin' },
])(
  'given a decoded document generate all of the correct properties',
  async ({ manifestName }) => {
    //declare decoded documents here

    it('should return the proper metadata', () => {});

    it('should return the proper paragraphs', () => {});
    it('should return the proper headings and titles', () => {});
    it('should return the proper slug', () => {});
    it('should return the proper preview', () => {});
    it('should return the proper facets', () => {});
    it('should correctly return whether the document is indexable', () => {});
  },
);
//TODO: given a single decoded entry, use Document function on it
