// TODO: snapshot tests
import { describe, expect, test } from 'vitest';

function sum(a: number, b: number) {
  return a + b;
}
test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3);
});

//write output of generatemanifest and then compose upserts to files, check if they're the same
