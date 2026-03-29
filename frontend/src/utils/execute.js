/**
 * utils/execute.js — Serverless Code Execution Engine
 * Uses the free Piston API (https://github.com/engineer-man/piston)
 */

const PISTON_API_URL = "https://emkc.org/api/v2/piston/execute";

// Map our editor languages to Piston API aliases
const LANGUAGE_MAP = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  cpp: "cpp",
  c: "c",
  java: "java",
  go: "go",
  rust: "rust",
};

export async function executeCode(language, sourceCode) {
  const alias = LANGUAGE_MAP[language];
  
  if (!alias) {
    return {
      run: {
        stdout: "",
        stderr: `Execution not supported for language: ${language}`,
        code: 1,
      }
    };
  }

  try {
    const response = await fetch(PISTON_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language: alias,
        version: "*",
        files: [
          {
            content: sourceCode,
          },
        ],
        stdin: "",
        args: [],
        compile_timeout: 10000,
        run_timeout: 3000,
        compile_memory_limit: -1,
        run_memory_limit: -1,
      }),
    });

    if (!response.ok) {
      throw new Error("HTTP Error " + response.status);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Execution error:", error);
    return {
      run: {
        stdout: "",
        stderr: "Failed to connect to execution engine.\n" + error.message,
        code: 1,
      }
    };
  }
}
