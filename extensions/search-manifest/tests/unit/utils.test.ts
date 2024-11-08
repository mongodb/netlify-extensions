import { expect, it } from 'vitest';
import { joinUrl } from '../../src/utils';

//test joinUrl util
it('correctly joins base URLs with slugs', () => {
  expect(joinUrl({ base: 'https://example.com//', path: '//foo/' })).toEqual(
    'https://example.com/foo/',
  );
  expect(joinUrl({ base: 'https://example.com', path: 'foo' })).toEqual(
    'https://example.com/foo',
  );
});

//TODO: test assertTrailingSlash, generateHash
