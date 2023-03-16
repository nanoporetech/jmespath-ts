# Changelog

All notable changes to `@metrichor/jmespath` will be documented in this file.

## [1.0.1] - 1.0.1

Clean up scripts and unused dependencies

## Breaking

- Minimum node version upgraded to >=16

### Fixed

- Fix: CI build script
- Fix: Update CI publish script to use Node 18

### Changed

- Improvement: Refactor AST to improve types [@shortercode](https://github.com/shortercode)
- Package dependency updates
- Upgrade to typescript@4.9.5
- Upgrade to rollup@3
- Upgrade to deprecated coveralls package in favour of a new community version
- Cleaned up old linting comments


## [1.0.0] - 1.0.0

Update package dependencies to address vulnerabilities

## Breaking

- Minimum node version upgraded to >=14
- NPM package exports have changed.
  - Using named exports only
  - Exporting ems and cjs only (dropped UMD export)
  - No minified files

### Added

- [JEP-16] Arithmetic Expressions [@springcomp](https://github.com/springcomp)
- [JEP-19] Pipe evaluation [@springcomp](https://github.com/springcomp)
- `CHANGELOG.md`: Going to start tracking changes now that the JMESPath community is contributing

### Fixed

- Fix: Catch invalid slice expressions at compile time [@mkantor](https://github.com/mkantor)
- Fix: Fix unsupported '\\' raw-string escape sequence [@springcomp](https://github.com/springcomp)

### Changed

- Improvement: Refactor AST to improve types [@shortercode](https://github.com/shortercode)
- Package dependency updates
- Upgrade to typescript@4.9.5
- Upgrade to rollup@3
- Upgrade to deprecated coveralls package in favour of a new community version
- Cleaned up old linting comments
