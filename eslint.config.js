import js from "@eslint/js";

export default [
  {
    ignores: ["dist/**", "node_modules/**"]
  },
  js.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        location: "readonly",
        history: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        fetch: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        CustomEvent: "readonly",
        Event: "readonly",
        MessageEvent: "readonly",
        MutationObserver: "readonly",
        IntersectionObserver: "readonly",
        HTMLElement: "readonly",
        Node: "readonly",
        Image: "readonly",
        AbortController: "readonly",
        structuredClone: "readonly",
        getComputedStyle: "readonly",
        confirm: "readonly",
        alert: "readonly",
        prompt: "readonly",
        crypto: "readonly",
        KeyboardEvent: "readonly",
        MouseEvent: "readonly",
        DOMParser: "readonly",
        atob: "readonly",
        btoa: "readonly",
        GM_getValue: "readonly",
        GM_setValue: "readonly",
        GM_deleteValue: "readonly",
        GM_listValues: "readonly",
        GM_xmlhttpRequest: "readonly",
        GM_addStyle: "readonly",
        GM_openInTab: "readonly",
        GM_info: "readonly",
        unsafeWindow: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
      "no-useless-assignment": "warn",
      "no-useless-escape": "warn",
      "no-empty": ["error", { allowEmptyCatch: true }]
    }
  },
  {
    files: ["scripts/**/*.js", "scripts/**/*.mjs", "tests/**/*.js", "eslint.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        URL: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        window: "readonly",
        document: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
      "no-useless-assignment": "warn",
      "no-useless-escape": "warn",
      "no-empty": ["error", { allowEmptyCatch: true }]
    }
  }
];
