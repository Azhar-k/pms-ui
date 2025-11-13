import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Fix for React Router v7 Request/AbortSignal compatibility in Node.js
// Patch Request constructor to handle AbortSignal validation issues with undici
// In tests, we don't need abort functionality, so we remove the signal
if (typeof globalThis.Request !== "undefined") {
  const OriginalRequest = globalThis.Request;
  
  globalThis.Request = class Request extends OriginalRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      // Remove signal to avoid undici validation errors in test environment
      // Tests don't need abort functionality
      const { signal, ...safeInit } = init || {};
      super(input, safeInit);
    }
  } as typeof Request;
}

// Cleanup after each test
afterEach(() => {
  cleanup();
});

