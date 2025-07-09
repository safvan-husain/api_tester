module.exports = {
  preset: 'ts-jest',
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: "app/.*\\.spec\\.ts$",
  // transform is usually handled by preset, but can be specified if needed
  // transform: {
  //   "^.+\\.(t|j)s$": "ts-jest",
  // },
  collectCoverageFrom: [
    "app/**/*.service.ts",
  ],
  coverageDirectory: "./coverage",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@modules/(.*)$": "<rootDir>/app/modules/$1",
    "^@config/(.*)$": "<rootDir>/app/config/$1",
    "^@common/(.*)$": "<rootDir>/app/common/$1",
  },
};
