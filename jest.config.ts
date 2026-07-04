import type { Config } from "jest";

const sharedConfig = {
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { module: "CommonJS" } }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // Point to the pre-built CJS dist of MSW to avoid ts-jest trying to
    // compile MSW's TypeScript source files.
    "^msw/node$": "<rootDir>/node_modules/msw/lib/node/index.js",
    "^msw$": "<rootDir>/node_modules/msw/lib/core/index.js",
  },
};

const config: Config = {
  projects: [
    {
      // Node environment: API routes, utilities, Redux slices, etc.
      displayName: "node",
      testEnvironment: "node",
      ...sharedConfig,
      testMatch: [
        "**/__tests__/**/*.test.ts",
        "!**/__tests__/**/*.component.test.tsx",
      ],
      setupFilesAfterEnv: ["<rootDir>/src/lib/test/setup.ts"],
    },
    {
      // jsdom environment: React component tests
      displayName: "jsdom",
      testEnvironment: "jest-environment-jsdom",
      ...sharedConfig,
      testMatch: ["**/__tests__/**/*.component.test.tsx"],
      setupFilesAfterEnv: ["<rootDir>/src/lib/test/setup.ts"],
    },
  ],
};

export default config;
