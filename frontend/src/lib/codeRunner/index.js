const TIME_LIMIT_MS = { javascript: 4000, python: 8000 };

// Owns one worker (so Pyodide stays loaded between runs) and replaces it on timeout.
export class CodeRunner {
  constructor() {
    this.worker = null;
  }

  spawn() {
    this.worker = new Worker(new URL("./worker.js", import.meta.url), { type: "classic" });
    return this.worker;
  }

  /**
   * Runs `code` against `tests`. Resolves to { results?, compileError?, logs, timedOut? }.
   * `onStatus` receives progress strings (e.g. while Pyodide downloads).
   */
  run({ language, code, fnName, tests, compare }, { onStatus } = {}) {
    const worker = this.worker ?? this.spawn();
    return new Promise((resolve) => {
      let timer = null;
      const finish = (value) => {
        clearTimeout(timer);
        worker.onmessage = null;
        worker.onerror = null;
        resolve(value);
      };

      worker.onmessage = ({ data }) => {
        if (data.type === "status") onStatus?.(data.message);
        if (data.type === "ready") {
          onStatus?.("Running tests…");
          // The time limit starts after the runtime is loaded.
          timer = setTimeout(() => {
            worker.terminate();
            this.worker = null;
            finish({
              timedOut: true,
              logs: [],
              results: tests.map(() => ({ passed: false, error: "Time limit exceeded — check for an infinite loop." })),
            });
          }, TIME_LIMIT_MS[language]);
        }
        if (data.type === "done") finish(data);
      };
      worker.onerror = (e) => {
        worker.terminate();
        this.worker = null;
        finish({ compileError: e.message || "The code runner crashed.", logs: [] });
      };

      worker.postMessage({ language, code, fnName, tests: tests.map(({ args, expected }) => ({ args, expected })), compare });
    });
  }

  dispose() {
    this.worker?.terminate();
    this.worker = null;
  }
}
