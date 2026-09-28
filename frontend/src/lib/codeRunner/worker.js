// Runs candidate code against test cases, isolated in a Web Worker so it can't touch the page
// and can be terminated if it loops forever. Python runs on Pyodide (CPython compiled to WASM).

const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.29.5/full/";
let pyodide = null;

const MAX_LOG_LINES = 200;

function normalize(value, compare) {
  if (compare === "sorted" && Array.isArray(value)) {
    value = [...value].sort((a, b) => (typeof a === "number" && typeof b === "number" ? a - b : JSON.stringify(a).localeCompare(JSON.stringify(b))));
  }
  return JSON.stringify(value === undefined ? null : value);
}

const preview = (value) => {
  const s = JSON.stringify(value === undefined ? null : value);
  return s && s.length > 300 ? `${s.slice(0, 300)}…` : s;
};

function runJavaScript({ code, fnName, tests, compare }, logs) {
  const log = (...args) => {
    if (logs.length < MAX_LOG_LINES) logs.push(args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
  };
  const sandboxConsole = { log, info: log, warn: log, error: log, debug: log };

  let fn;
  try {
    fn = new Function("console", `"use strict";\n${code}\n;return typeof ${fnName} === "function" ? ${fnName} : undefined;`)(sandboxConsole);
  } catch (err) {
    return { compileError: `${err.name}: ${err.message}` };
  }
  if (!fn) return { compileError: `Define a function named ${fnName}.` };

  return {
    results: tests.map(({ args, expected }) => {
      const start = performance.now();
      try {
        const actual = fn(...structuredClone(args));
        const runtimeMs = Math.round((performance.now() - start) * 100) / 100;
        return { passed: normalize(actual, compare) === normalize(expected, compare), actual: preview(actual), runtimeMs };
      } catch (err) {
        return { passed: false, error: `${err.name}: ${err.message}`, runtimeMs: 0 };
      }
    }),
  };
}

async function ensurePython() {
  if (pyodide) return pyodide;
  self.postMessage({ type: "status", message: "Loading Python runtime (first run only)…" });
  importScripts(`${PYODIDE_URL}pyodide.js`);
  pyodide = await self.loadPyodide({ indexURL: PYODIDE_URL });
  return pyodide;
}

function runPython(py, { code, fnName, tests, compare }, logs) {
  py.setStdout({ batched: (line) => logs.length < MAX_LOG_LINES && logs.push(line) });
  py.setStderr({ batched: (line) => logs.length < MAX_LOG_LINES && logs.push(line) });

  const ns = py.globals.get("dict")();
  try {
    py.runPython(code, { globals: ns });
  } catch (err) {
    return { compileError: String(err.message).split("\n").slice(-3).join("\n") };
  }
  if (!ns.has(fnName)) return { compileError: `Define a function named ${fnName}.` };

  const results = tests.map(({ args, expected }) => {
    ns.set("__args_json", JSON.stringify(args));
    const start = performance.now();
    try {
      const json = py.runPython(`import json as __json\n__json.dumps(${fnName}(*__json.loads(__args_json)))`, { globals: ns });
      const runtimeMs = Math.round((performance.now() - start) * 100) / 100;
      const actual = JSON.parse(json);
      return { passed: normalize(actual, compare) === normalize(expected, compare), actual: preview(actual), runtimeMs };
    } catch (err) {
      const lines = String(err.message).trim().split("\n");
      return { passed: false, error: lines.at(-1), runtimeMs: 0 };
    }
  });
  ns.destroy();
  return { results };
}

self.onmessage = async ({ data }) => {
  const logs = [];
  try {
    const py = data.language === "python" ? await ensurePython() : null;
    self.postMessage({ type: "ready" });
    const outcome = py ? runPython(py, data, logs) : runJavaScript(data, logs);
    self.postMessage({ type: "done", ...outcome, logs });
  } catch (err) {
    self.postMessage({ type: "done", compileError: `Runner error: ${err.message}`, logs });
  }
};
