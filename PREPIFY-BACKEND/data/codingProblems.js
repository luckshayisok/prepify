// Seeded DSA problems. Tests run in the candidate's browser (see frontend/src/lib/codeRunner),
// so hidden tests are hidden from the UI, not from a determined user — XP from coding is capped.
//
// compare: "exact" (deep equality) | "sorted" (sort the top-level result array before comparing)

const t = (args, expected, hidden = false) => ({ args, expected, hidden });

export const PROBLEMS = [
  {
    slug: "two-sum",
    title: "Two Sum",
    difficulty: "easy",
    tags: ["Array", "Hash Map"],
    description:
      "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`.\n\nExactly one valid answer exists, and you may not use the same element twice. Return the two indices in any order.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] = 9" },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
    ],
    constraints: ["2 ≤ nums.length ≤ 10⁴", "-10⁹ ≤ nums[i], target ≤ 10⁹", "Exactly one valid answer exists"],
    fn: { javascript: "twoSum", python: "two_sum" },
    params: ["nums", "target"],
    compare: "sorted",
    tests: [
      t([[2, 7, 11, 15], 9], [0, 1]),
      t([[3, 2, 4], 6], [1, 2]),
      t([[3, 3], 6], [0, 1]),
      t([[1, 5, 9, 13], 22], [2, 3], true),
      t([[-3, 4, 3, 90], 0], [0, 2], true),
      t([[0, 4, 3, 0], 0], [0, 3], true),
    ],
  },
  {
    slug: "valid-anagram",
    title: "Valid Anagram",
    difficulty: "easy",
    tags: ["String", "Hash Map"],
    description: "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.",
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: "true" },
      { input: 's = "rat", t = "car"', output: "false" },
    ],
    constraints: ["0 ≤ s.length, t.length ≤ 5·10⁴", "Lowercase English letters only"],
    fn: { javascript: "isAnagram", python: "is_anagram" },
    params: ["s", "t"],
    compare: "exact",
    tests: [
      t(["anagram", "nagaram"], true),
      t(["rat", "car"], false),
      t(["listen", "silent"], true),
      t(["a", "ab"], false, true),
      t(["", ""], true, true),
      t(["aacc", "ccac"], false, true),
    ],
  },
  {
    slug: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "easy",
    tags: ["Stack", "String"],
    description:
      "Given a string `s` containing just the characters `()[]{}`, determine if the input string is valid.\n\nA string is valid if every open bracket is closed by the same type of bracket, in the correct order.",
    examples: [
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" },
    ],
    constraints: ["1 ≤ s.length ≤ 10⁴"],
    fn: { javascript: "isValid", python: "is_valid" },
    params: ["s"],
    compare: "exact",
    tests: [
      t(["()"], true),
      t(["()[]{}"], true),
      t(["(]"], false),
      t(["([)]"], false, true),
      t(["{[]}"], true, true),
      t(["(("], false, true),
      t(["){"], false, true),
    ],
  },
  {
    slug: "binary-search",
    title: "Binary Search",
    difficulty: "easy",
    tags: ["Array", "Binary Search"],
    description:
      "Given a sorted array of distinct integers `nums` and a `target`, return the index of `target`, or `-1` if it is not present.\n\nYour solution must run in O(log n) time.",
    examples: [
      { input: "nums = [-1,0,3,5,9,12], target = 9", output: "4" },
      { input: "nums = [-1,0,3,5,9,12], target = 2", output: "-1" },
    ],
    constraints: ["1 ≤ nums.length ≤ 10⁴", "nums is sorted ascending with unique values"],
    fn: { javascript: "search", python: "search" },
    params: ["nums", "target"],
    compare: "exact",
    tests: [
      t([[-1, 0, 3, 5, 9, 12], 9], 4),
      t([[-1, 0, 3, 5, 9, 12], 2], -1),
      t([[5], 5], 0, true),
      t([[5], -5], -1, true),
      t([[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 10], 9, true),
      t([[1, 3], 1], 0, true),
    ],
  },
  {
    slug: "climbing-stairs",
    title: "Climbing Stairs",
    difficulty: "easy",
    tags: ["Dynamic Programming"],
    description: "You are climbing a staircase with `n` steps. Each time you can climb 1 or 2 steps. In how many distinct ways can you reach the top?",
    examples: [
      { input: "n = 2", output: "2", explanation: "1+1 or 2" },
      { input: "n = 3", output: "3", explanation: "1+1+1, 1+2 or 2+1" },
    ],
    constraints: ["1 ≤ n ≤ 45"],
    fn: { javascript: "climbStairs", python: "climb_stairs" },
    params: ["n"],
    compare: "exact",
    tests: [t([2], 2), t([3], 3), t([1], 1, true), t([5], 8, true), t([10], 89, true), t([45], 1836311903, true)],
  },
  {
    slug: "longest-common-prefix",
    title: "Longest Common Prefix",
    difficulty: "easy",
    tags: ["String"],
    description: "Return the longest common prefix shared by all strings in `strs`. If there is none, return an empty string.",
    examples: [
      { input: 'strs = ["flower","flow","flight"]', output: '"fl"' },
      { input: 'strs = ["dog","racecar","car"]', output: '""' },
    ],
    constraints: ["1 ≤ strs.length ≤ 200", "0 ≤ strs[i].length ≤ 200"],
    fn: { javascript: "longestCommonPrefix", python: "longest_common_prefix" },
    params: ["strs"],
    compare: "exact",
    tests: [
      t([["flower", "flow", "flight"]], "fl"),
      t([["dog", "racecar", "car"]], ""),
      t([["a"]], "a", true),
      t([["", ""]], "", true),
      t([["interview", "internet", "interval"]], "inter", true),
      t([["ab", "a"]], "a", true),
    ],
  },
  {
    slug: "maximum-subarray",
    title: "Maximum Subarray",
    difficulty: "medium",
    tags: ["Array", "Dynamic Programming"],
    description: "Given an integer array `nums`, find the contiguous subarray with the largest sum and return that sum.",
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "[4,-1,2,1] has the largest sum" },
      { input: "nums = [5,4,-1,7,8]", output: "23" },
    ],
    constraints: ["1 ≤ nums.length ≤ 10⁵", "-10⁴ ≤ nums[i] ≤ 10⁴"],
    fn: { javascript: "maxSubArray", python: "max_sub_array" },
    params: ["nums"],
    compare: "exact",
    tests: [
      t([[-2, 1, -3, 4, -1, 2, 1, -5, 4]], 6),
      t([[1]], 1),
      t([[5, 4, -1, 7, 8]], 23),
      t([[-1]], -1, true),
      t([[-3, -2, -5]], -2, true),
      t([[1, 2, 3, -10, 5, 6]], 11, true),
    ],
  },
  {
    slug: "product-except-self",
    title: "Product of Array Except Self",
    difficulty: "medium",
    tags: ["Array", "Prefix Sum"],
    description:
      "Given an integer array `nums`, return an array `answer` where `answer[i]` is the product of all elements of `nums` except `nums[i]`.\n\nSolve it in O(n) time without using division.",
    examples: [
      { input: "nums = [1,2,3,4]", output: "[24,12,8,6]" },
      { input: "nums = [-1,1,0,-3,3]", output: "[0,0,9,0,0]" },
    ],
    constraints: ["2 ≤ nums.length ≤ 10⁵", "-30 ≤ nums[i] ≤ 30"],
    fn: { javascript: "productExceptSelf", python: "product_except_self" },
    params: ["nums"],
    compare: "exact",
    tests: [
      t([[1, 2, 3, 4]], [24, 12, 8, 6]),
      t([[-1, 1, 0, -3, 3]], [0, 0, 9, 0, 0]),
      t([[2, 3]], [3, 2], true),
      t([[0, 0]], [0, 0], true),
      t([[1, 1, 1, 1]], [1, 1, 1, 1], true),
      t([[2, -1, 3]], [-3, 6, -2], true),
    ],
  },
  {
    slug: "longest-substring",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "medium",
    tags: ["String", "Sliding Window"],
    description: "Given a string `s`, find the length of the longest substring that contains no repeated characters.",
    examples: [
      { input: 's = "abcabcbb"', output: "3", explanation: '"abc"' },
      { input: 's = "pwwkew"', output: "3", explanation: '"wke"' },
    ],
    constraints: ["0 ≤ s.length ≤ 5·10⁴"],
    fn: { javascript: "lengthOfLongestSubstring", python: "length_of_longest_substring" },
    params: ["s"],
    compare: "exact",
    tests: [
      t(["abcabcbb"], 3),
      t(["bbbbb"], 1),
      t(["pwwkew"], 3),
      t([""], 0, true),
      t([" "], 1, true),
      t(["dvdf"], 3, true),
      t(["abba"], 2, true),
    ],
  },
  {
    slug: "merge-intervals",
    title: "Merge Intervals",
    difficulty: "medium",
    tags: ["Array", "Sorting"],
    description:
      "Given an array of `intervals` where `intervals[i] = [start, end]`, merge all overlapping intervals and return the non-overlapping intervals sorted by start.",
    examples: [
      { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]" },
      { input: "intervals = [[1,4],[4,5]]", output: "[[1,5]]", explanation: "Touching intervals overlap" },
    ],
    constraints: ["1 ≤ intervals.length ≤ 10⁴", "0 ≤ start ≤ end ≤ 10⁴"],
    fn: { javascript: "merge", python: "merge" },
    params: ["intervals"],
    compare: "exact",
    tests: [
      t([[[1, 3], [2, 6], [8, 10], [15, 18]]], [[1, 6], [8, 10], [15, 18]]),
      t([[[1, 4], [4, 5]]], [[1, 5]]),
      t([[[1, 4], [0, 4]]], [[0, 4]], true),
      t([[[1, 4], [2, 3]]], [[1, 4]], true),
      t([[[5, 6], [1, 2]]], [[1, 2], [5, 6]], true),
      t([[[1, 10]]], [[1, 10]], true),
    ],
  },
  {
    slug: "trapping-rain-water",
    title: "Trapping Rain Water",
    difficulty: "hard",
    tags: ["Two Pointers", "Stack"],
    description: "Given `n` non-negative integers representing an elevation map where each bar has width 1, compute how much water it can trap after raining.",
    examples: [
      { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6" },
      { input: "height = [4,2,0,3,2,5]", output: "9" },
    ],
    constraints: ["1 ≤ height.length ≤ 2·10⁴", "0 ≤ height[i] ≤ 10⁵"],
    fn: { javascript: "trap", python: "trap" },
    params: ["height"],
    compare: "exact",
    tests: [
      t([[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], 6),
      t([[4, 2, 0, 3, 2, 5]], 9),
      t([[1]], 0, true),
      t([[3, 0, 3]], 3, true),
      t([[5, 4, 3, 2, 1]], 0, true),
      t([[2, 0, 2, 0, 2]], 4, true),
    ],
  },
];

export function starterCode(problem, language) {
  const params = problem.params.join(", ");
  if (language === "python") {
    return `def ${problem.fn.python}(${params}):\n    # Write your solution here\n    pass\n`;
  }
  return `function ${problem.fn.javascript}(${params}) {\n  // Write your solution here\n}\n`;
}

export const findProblem = (slug) => PROBLEMS.find((p) => p.slug === slug);
