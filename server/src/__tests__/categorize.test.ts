import { describe, it, expect } from 'vitest';
import { autoCategory } from '../categorize.js';
import { autoImportance } from '../importance.js';

describe('autoCategory', () => {
  it.each([
    ['Decided to use Postgres', 'decision'],
    ['We always use camelCase, it is our convention', 'pattern'],
    ['I prefer typescript over javascript', 'preference'],
    ['Fix crash in user service, null ref bug', 'debug'],
    ['Working on the auth project this sprint', 'context'],
    ['The capital of France is Paris', 'knowledge'],
  ])('categorises %j → %s', (content, expected) => {
    expect(autoCategory(content)).toBe(expected);
  });
});

describe('autoImportance', () => {
  it('returns a number in [0, 1]', () => {
    const v = autoImportance('hello', 'knowledge');
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });

  it('scores security/architecture content higher than a plain fact', () => {
    const plain = autoImportance('the cat sat on the mat', 'knowledge');
    const critical = autoImportance(
      'Critical security decision: we must always rotate auth keys monthly as part of the system architecture',
      'decision',
    );
    expect(critical).toBeGreaterThan(plain);
  });

  it('bumps score when content contains a code block', () => {
    const base = autoImportance('set the value to 4', 'knowledge');
    const coded = autoImportance('set the value to 4\n```js\nx = 4\n```', 'knowledge');
    expect(coded).toBeGreaterThan(base);
  });
});
