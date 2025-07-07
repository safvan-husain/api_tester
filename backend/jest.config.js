module.exports = {
  preset: 'ts-jest',
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: "src/.*\\.spec\\.ts$",
  // transform is usually handled by preset, but can be specified if needed
  // transform: {
  //   "^.+\\.(t|j)s$": "ts-jest",
  // },
  collectCoverageFrom: [
    "src/**/*.service.ts",
  ],
  coverageDirectory: "./coverage",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@modules/(.*)$": "<rootDir>/src/modules/$1",
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@common/(.*)$": "<rootDir>/src/common/$1",
  },
};
