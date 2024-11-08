import { describe, expect, test } from 'vitest';
import { createMarkdown } from '../src/index';

describe('Test displaying URLs for changed files in source directory ', () => {
  test('It displays files only changed in source', () => {
    const exampleModifiedFiles = [
      'source/legacy.txt',
      'source/trial.txt',
      'new.html',
    ];
    const netlifyURL = 'testing.com';
    const output = [
      '[source/legacy.txt](testing.com/legacy)',
      '[source/trial.txt](testing.com/trial)',
    ];

    expect(createMarkdown(exampleModifiedFiles, netlifyURL)).toStrictEqual(
      output,
    );
  });

  test('Test displaying URLs for changed files in source directory except for images', () => {
    const exampleModifiedFiles = [
      'source/legacy.txt',
      'source/trial.txt',
      'source/images/picture.png',
    ];
    const netlifyURL = 'testing.com';
    const output = [
      '[source/legacy.txt](testing.com/legacy)',
      '[source/trial.txt](testing.com/trial)',
    ];

    expect(createMarkdown(exampleModifiedFiles, netlifyURL)).toStrictEqual(
      output,
    );
  });
});
