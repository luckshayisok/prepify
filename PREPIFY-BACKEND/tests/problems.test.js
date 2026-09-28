// Checks the seeded problem bank against known-good reference solutions, so a typo in an
// expected output can't make a problem unsolvable.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PROBLEMS, starterCode } from "../data/codingProblems.js";

const reference = {
  "two-sum": (nums, target) => {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
      if (seen.has(target - nums[i])) return [seen.get(target - nums[i]), i];
      seen.set(nums[i], i);
    }
  },
  "valid-anagram": (s, t) => s.length === t.length && [...s].sort().join("") === [...t].sort().join(""),
  "valid-parentheses": (s) => {
    const stack = [];
    const pairs = { ")": "(", "]": "[", "}": "{" };
    for (const c of s) {
      if (pairs[c]) {
        if (stack.pop() !== pairs[c]) return false;
      } else stack.push(c);
    }
    return stack.length === 0;
  },
  "binary-search": (nums, target) => nums.indexOf(target),
  "climbing-stairs": (n) => {
    let [a, b] = [1, 1];
    for (let i = 1; i < n; i++) [a, b] = [b, a + b];
    return b;
  },
  "longest-common-prefix": (strs) => {
    let p = strs[0];
    for (const s of strs) while (!s.startsWith(p)) p = p.slice(0, -1);
    return p;
  },
  "maximum-subarray": (nums) => {
    let best = nums[0];
    let cur = 0;
    for (const n of nums) {
      cur = Math.max(n, cur + n);
      best = Math.max(best, cur);
    }
    return best;
  },
  "product-except-self": (nums) => nums.map((_, i) => nums.reduce((p, n, j) => (j === i ? p : p * n), 1)),
  "longest-substring": (s) => {
    let best = 0;
    let start = 0;
    const last = new Map();
    [...s].forEach((c, i) => {
      if (last.has(c) && last.get(c) >= start) start = last.get(c) + 1;
      last.set(c, i);
      best = Math.max(best, i - start + 1);
    });
    return best;
  },
  "merge-intervals": (intervals) => {
    const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
    const out = [];
    for (const [s, e] of sorted) {
      if (out.length && s <= out.at(-1)[1]) out.at(-1)[1] = Math.max(out.at(-1)[1], e);
      else out.push([s, e]);
    }
    return out;
  },
  "trapping-rain-water": (h) => {
    let water = 0;
    for (let i = 0; i < h.length; i++) {
      const left = Math.max(...h.slice(0, i + 1));
      const right = Math.max(...h.slice(i));
      water += Math.min(left, right) - h[i];
    }
    return water;
  },
};

const normalize = (value, compare) =>
  JSON.stringify(compare === "sorted" && Array.isArray(value) ? [...value].sort((a, b) => a - b) : value);

for (const problem of PROBLEMS) {
  test(`${problem.slug}: reference solution passes every test`, () => {
    const solve = reference[problem.slug];
    assert.ok(solve, "missing reference solution");
    for (const { args, expected } of problem.tests) {
      const actual = solve(...structuredClone(args));
      assert.equal(normalize(actual, problem.compare), normalize(expected, problem.compare), JSON.stringify(args));
    }
  });
}

test("every problem is well-formed", () => {
  const slugs = new Set();
  for (const p of PROBLEMS) {
    assert.ok(!slugs.has(p.slug), `duplicate slug ${p.slug}`);
    slugs.add(p.slug);
    assert.ok(["easy", "medium", "hard"].includes(p.difficulty));
    assert.ok(p.tests.some((x) => !x.hidden) && p.tests.some((x) => x.hidden), `${p.slug} needs visible and hidden tests`);
    for (const x of p.tests) assert.equal(x.args.length, p.params.length, `${p.slug} arg count`);
    assert.match(starterCode(p, "javascript"), new RegExp(`function ${p.fn.javascript}\\(`));
    assert.match(starterCode(p, "python"), new RegExp(`def ${p.fn.python}\\(`));
  }
  assert.ok(PROBLEMS.length >= 10);
});
