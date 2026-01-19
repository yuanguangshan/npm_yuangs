# Project Documentation

- **Generated at:** 2026-01-18 16:14:20
- **Root Dir:** `.`
- **File Count:** 71
- **Total Size:** 353.68 KB

## 📂 扫描目录
- [.gitignore](#📄-gitignore) (13 lines, 0.15 KB)
- [.yuangs.test.json](#📄-yuangstestjson) (1 lines, 0.12 KB)
- [example.json](#📄-examplejson) (5 lines, 0.06 KB)
- [package-lock.json](#📄-package-lockjson) (4846 lines, 171.10 KB)
- [package.json](#📄-packagejson) (65 lines, 1.41 KB)
- [poeapi_go.code-workspace](#📄-poeapi_gocode-workspace) (9 lines, 0.08 KB)
- [src/agent/AgentPipeline.ts](#📄-srcagentagentpipelinets) (95 lines, 3.05 KB)
- [src/agent/actions.ts](#📄-srcagentactionsts) (53 lines, 1.58 KB)
- [src/agent/context.ts](#📄-srcagentcontextts) (22 lines, 0.65 KB)
- [src/agent/index.ts](#📄-srcagentindexts) (2 lines, 0.07 KB)
- [src/agent/intent.ts](#📄-srcagentintentts) (31 lines, 0.94 KB)
- [src/agent/interpret.ts](#📄-srcagentinterpretts) (47 lines, 1.29 KB)
- [src/agent/llm.ts](#📄-srcagentllmts) (88 lines, 2.61 KB)
- [src/agent/plan.ts](#📄-srcagentplants) (14 lines, 0.30 KB)
- [src/agent/planExecutor.ts](#📄-srcagentplanexecutorts) (90 lines, 2.70 KB)
- [src/agent/prompt.ts](#📄-srcagentpromptts) (80 lines, 2.08 KB)
- [src/agent/record.ts](#📄-srcagentrecordts) (36 lines, 0.73 KB)
- [src/agent/replay.ts](#📄-srcagentreplayts) (27 lines, 0.88 KB)
- [src/agent/selectModel.ts](#📄-srcagentselectmodelts) (23 lines, 0.50 KB)
- [src/agent/skills.ts](#📄-srcagentskillsts) (135 lines, 3.95 KB)
- [src/agent/types.ts](#📄-srcagenttypests) (56 lines, 1.26 KB)
- [src/ai/client.ts](#📄-srcaiclientts) (118 lines, 4.14 KB)
- [src/ai/prompt.ts](#📄-srcaipromptts) (82 lines, 2.22 KB)
- [src/ai/types.ts](#📄-srcaitypests) (1 lines, 0.09 KB)
- [src/cli.ts](#📄-srcclits) (398 lines, 15.27 KB)
- [src/commands/capabilityCommands.ts](#📄-srccommandscapabilitycommandsts) (141 lines, 4.84 KB)
- [src/commands/contextBuffer.ts](#📄-srccommandscontextbufferts) (83 lines, 1.84 KB)
- [src/commands/contextStorage.ts](#📄-srccommandscontextstoragets) (24 lines, 0.69 KB)
- [src/commands/gitContext.ts](#📄-srccommandsgitcontextts) (32 lines, 0.77 KB)
- [src/commands/handleAIChat.ts](#📄-srccommandshandleaichatts) (667 lines, 24.44 KB)
- [src/commands/handleAICommand.ts](#📄-srccommandshandleaicommandts) (216 lines, 8.07 KB)
- [src/commands/handleConfig.ts](#📄-srccommandshandleconfigts) (72 lines, 2.28 KB)
- [src/commands/shellCompletions.ts](#📄-srccommandsshellcompletionsts) (504 lines, 13.64 KB)
- [src/core/apps.ts](#📄-srccoreappsts) (49 lines, 1.63 KB)
- [src/core/autofix.ts](#📄-srccoreautofixts) (22 lines, 0.61 KB)
- [src/core/capabilities.ts](#📄-srccorecapabilitiests) (69 lines, 1.90 KB)
- [src/core/capabilityInference.ts](#📄-srccorecapabilityinferencets) (25 lines, 0.93 KB)
- [src/core/capabilitySystem.ts](#📄-srccorecapabilitysystemts) (114 lines, 3.17 KB)
- [src/core/configMerge.ts](#📄-srccoreconfigmergets) (122 lines, 3.09 KB)
- [src/core/executionRecord.ts](#📄-srccoreexecutionrecordts) (89 lines, 2.29 KB)
- [src/core/executionStore.ts](#📄-srccoreexecutionstorets) (100 lines, 2.44 KB)
- [src/core/executor.ts](#📄-srccoreexecutorts) (37 lines, 0.97 KB)
- [src/core/fileReader.ts](#📄-srccorefilereaderts) (72 lines, 2.03 KB)
- [src/core/macros.ts](#📄-srccoremacrosts) (83 lines, 2.36 KB)
- [src/core/modelMatcher.ts](#📄-srccoremodelmatcherts) (102 lines, 2.65 KB)
- [src/core/os.ts](#📄-srccoreosts) (39 lines, 1.00 KB)
- [src/core/replayEngine.ts](#📄-srccorereplayenginets) (132 lines, 3.88 KB)
- [src/core/risk.ts](#📄-srccoreriskts) (18 lines, 0.48 KB)
- [src/core/validation.ts](#📄-srccorevalidationts) (154 lines, 4.52 KB)
- [src/index.ts](#📄-srcindexts) (3 lines, 0.14 KB)
- [src/types.d.ts](#📄-srctypesdts) (6 lines, 0.17 KB)
- [src/utils/confirm.ts](#📄-srcutilsconfirmts) (17 lines, 0.44 KB)
- [src/utils/history.ts](#📄-srcutilshistoryts) (28 lines, 0.89 KB)
- [test/fileReader.test.js](#📄-testfilereadertestjs) (157 lines, 5.94 KB)
- [test/macros.test.js](#📄-testmacrostestjs) (92 lines, 3.48 KB)
- [test/quick_test.js](#📄-testquick_testjs) (28 lines, 0.79 KB)
- [test/risk-validation.test.js](#📄-testrisk-validationtestjs) (59 lines, 2.43 KB)
- [test/test_agent_pipeline.js](#📄-testtest_agent_pipelinejs) (98 lines, 2.54 KB)
- [test/test_display_anomaly.js](#📄-testtest_display_anomalyjs) (134 lines, 4.68 KB)
- [test/test_display_logic.js](#📄-testtest_display_logicjs) (76 lines, 3.06 KB)
- [test/test_escape_sequences.js](#📄-testtest_escape_sequencesjs) (46 lines, 1.42 KB)
- [test/test_interactive_completion.js](#📄-testtest_interactive_completionjs) (129 lines, 4.47 KB)
- [test/test_logic.js](#📄-testtest_logicjs) (25 lines, 0.92 KB)
- [test/test_no_duplicates.js](#📄-testtest_no_duplicatesjs) (34 lines, 0.96 KB)
- [test/test_tab_completion.js](#📄-testtest_tab_completionjs) (118 lines, 3.32 KB)
- [test/test_tab_completion_debug.js](#📄-testtest_tab_completion_debugjs) (122 lines, 3.58 KB)
- [tsconfig.json](#📄-tsconfigjson) (23 lines, 0.50 KB)
- [verify.sh](#📄-verifysh) (114 lines, 2.79 KB)
- [yuangs.config.example.json](#📄-yuangsconfigexamplejson) (11 lines, 0.39 KB)
- [yuangs.config.example.yaml](#📄-yuangsconfigexampleyaml) (23 lines, 0.78 KB)
- [yuangs.config.json](#📄-yuangsconfigjson) (104 lines, 2.25 KB)

---

## 📄 .gitignore

````text
# dependencies
node_modules/
**/*.map

# editor
.vscode/

# local tools / caches
.weaver/
.sisyphus/

# AI / temp workflow drafts
# .github/workflows/*.ai/

````

## 📄 .yuangs.test.json

````json
{"models":[{"name":"custom-model","provider":"custom","atomicCapabilities":["text_generation","reasoning","code_generation"]}]}

````

## 📄 example.json

````json
{
  "name": "example",
  "version": 1,
  "enabled": true
}

````

## 📄 package-lock.json

````json
{
  "name": "yuangs",
  "version": "2.11.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "yuangs",
      "version": "2.11.0",
      "license": "ISC",
      "dependencies": {
        "axios": "^1.13.2",
        "chalk": "^4.1.2",
        "commander": "^13.1.0",
        "js-yaml": "^4.1.0",
        "json5": "^2.2.3",
        "marked": "^15.0.12",
        "marked-terminal": "^7.3.0",
        "ora": "^6.3.1",
        "zod": "^4.3.5"
      },
      "bin": {
        "yuangs": "dist/cli.js"
      },
      "devDependencies": {
        "@types/js-yaml": "^4.0.9",
        "@types/json5": "^0.0.30",
        "@types/marked": "^5.0.2",
        "@types/marked-terminal": "^6.1.1",
        "@types/node": "^20.11.30",
        "@types/ora": "^3.1.0",
        "jest": "^29.7.0",
        "ts-node": "^10.9.2",
        "typescript": "^5.9.3"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@babel/code-frame": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/code-frame/-/code-frame-7.27.1.tgz",
      "integrity": "sha512-cjQ7ZlQ0Mv3b47hABuTevyTuYN4i+loJKGeV9flcCgIK37cCXRh+L1bd3iBHlynerhQ7BhCkn2BPbQUL+rGqFg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-validator-identifier": "^7.27.1",
        "js-tokens": "^4.0.0",
        "picocolors": "^1.1.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/compat-data": {
      "version": "7.28.5",
      "resolved": "https://registry.npmjs.org/@babel/compat-data/-/compat-data-7.28.5.tgz",
      "integrity": "sha512-6uFXyCayocRbqhZOB+6XcuZbkMNimwfVGFji8CTZnCzOHVGvDqzvitu1re2AU5LROliz7eQPhB8CpAMvnx9EjA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/core": {
      "version": "7.28.5",
      "resolved": "https://registry.npmjs.org/@babel/core/-/core-7.28.5.tgz",
      "integrity": "sha512-e7jT4DxYvIDLk1ZHmU/m/mB19rex9sv0c2ftBtjSBv+kVM/902eh0fINUzD7UwLLNR+jU585GxUJ8/EBfAM5fw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.27.1",
        "@babel/generator": "^7.28.5",
        "@babel/helper-compilation-targets": "^7.27.2",
        "@babel/helper-module-transforms": "^7.28.3",
        "@babel/helpers": "^7.28.4",
        "@babel/parser": "^7.28.5",
        "@babel/template": "^7.27.2",
        "@babel/traverse": "^7.28.5",
        "@babel/types": "^7.28.5",
        "@jridgewell/remapping": "^2.3.5",
        "convert-source-map": "^2.0.0",
        "debug": "^4.1.0",
        "gensync": "^1.0.0-beta.2",
        "json5": "^2.2.3",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/babel"
      }
    },
    "node_modules/@babel/generator": {
      "version": "7.28.5",
      "resolved": "https://registry.npmjs.org/@babel/generator/-/generator-7.28.5.tgz",
      "integrity": "sha512-3EwLFhZ38J4VyIP6WNtt2kUdW9dokXA9Cr4IVIFHuCpZ3H8/YFOl5JjZHisrn1fATPBmKKqXzDFvh9fUwHz6CQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/parser": "^7.28.5",
        "@babel/types": "^7.28.5",
        "@jridgewell/gen-mapping": "^0.3.12",
        "@jridgewell/trace-mapping": "^0.3.28",
        "jsesc": "^3.0.2"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-compilation-targets": {
      "version": "7.27.2",
      "resolved": "https://registry.npmjs.org/@babel/helper-compilation-targets/-/helper-compilation-targets-7.27.2.tgz",
      "integrity": "sha512-2+1thGUUWWjLTYTHZWK1n8Yga0ijBz1XAhUXcKy81rd5g6yh7hGqMp45v7cadSbEHc9G3OTv45SyneRN3ps4DQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/compat-data": "^7.27.2",
        "@babel/helper-validator-option": "^7.27.1",
        "browserslist": "^4.24.0",
        "lru-cache": "^5.1.1",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-globals": {
      "version": "7.28.0",
      "resolved": "https://registry.npmjs.org/@babel/helper-globals/-/helper-globals-7.28.0.tgz",
      "integrity": "sha512-+W6cISkXFa1jXsDEdYA8HeevQT/FULhxzR99pxphltZcVaugps53THCeiWA8SguxxpSp3gKPiuYfSWopkLQ4hw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-module-imports": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/helper-module-imports/-/helper-module-imports-7.27.1.tgz",
      "integrity": "sha512-0gSFWUPNXNopqtIPQvlD5WgXYI5GY2kP2cCvoT8kczjbfcfuIljTbcWrulD1CIPIX2gt1wghbDy08yE1p+/r3w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/traverse": "^7.27.1",
        "@babel/types": "^7.27.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-module-transforms": {
      "version": "7.28.3",
      "resolved": "https://registry.npmjs.org/@babel/helper-module-transforms/-/helper-module-transforms-7.28.3.tgz",
      "integrity": "sha512-gytXUbs8k2sXS9PnQptz5o0QnpLL51SwASIORY6XaBKF88nsOT0Zw9szLqlSGQDP/4TljBAD5y98p2U1fqkdsw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-module-imports": "^7.27.1",
        "@babel/helper-validator-identifier": "^7.27.1",
        "@babel/traverse": "^7.28.3"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/helper-plugin-utils": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/helper-plugin-utils/-/helper-plugin-utils-7.27.1.tgz",
      "integrity": "sha512-1gn1Up5YXka3YYAHGKpbideQ5Yjf1tDa9qYcgysz+cNCXukyLl6DjPXhD3VRwSb8c0J9tA4b2+rHEZtc6R0tlw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-string-parser": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/helper-string-parser/-/helper-string-parser-7.27.1.tgz",
      "integrity": "sha512-qMlSxKbpRlAridDExk92nSobyDdpPijUq2DW6oDnUqd0iOGxmQjyqhMIihI9+zv4LPyZdRje2cavWPbCbWm3eA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-validator-identifier": {
      "version": "7.28.5",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-7.28.5.tgz",
      "integrity": "sha512-qSs4ifwzKJSV39ucNjsvc6WVHs6b7S03sOh2OcHF9UHfVPqWWALUsNUVzhSBiItjRZoLHx7nIarVjqKVusUZ1Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-validator-option": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-option/-/helper-validator-option-7.27.1.tgz",
      "integrity": "sha512-YvjJow9FxbhFFKDSuFnVCe2WxXk1zWc22fFePVNEaWJEu8IrZVlda6N0uHwzZrUM1il7NC9Mlp4MaJYbYd9JSg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helpers": {
      "version": "7.28.4",
      "resolved": "https://registry.npmjs.org/@babel/helpers/-/helpers-7.28.4.tgz",
      "integrity": "sha512-HFN59MmQXGHVyYadKLVumYsA9dBFun/ldYxipEjzA4196jpLZd8UjEEBLkbEkvfYreDqJhZxYAWFPtrfhNpj4w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/template": "^7.27.2",
        "@babel/types": "^7.28.4"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/parser": {
      "version": "7.28.5",
      "resolved": "https://registry.npmjs.org/@babel/parser/-/parser-7.28.5.tgz",
      "integrity": "sha512-KKBU1VGYR7ORr3At5HAtUQ+TV3SzRCXmA/8OdDZiLDBIZxVyzXuztPjfLd3BV1PRAQGCMWWSHYhL0F8d5uHBDQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.28.5"
      },
      "bin": {
        "parser": "bin/babel-parser.js"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@babel/plugin-syntax-async-generators": {
      "version": "7.8.4",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-async-generators/-/plugin-syntax-async-generators-7.8.4.tgz",
      "integrity": "sha512-tycmZxkGfZaxhMRbXlPXuVFpdWlXpir2W4AMhSJgRKzk/eDlIXOhb2LHWoLpDF7TEHylV5zNhykX6KAgHJmTNw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.8.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-bigint": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-bigint/-/plugin-syntax-bigint-7.8.3.tgz",
      "integrity": "sha512-wnTnFlG+YxQm3vDxpGE57Pj0srRU4sHE/mDkt1qv2YJJSeUAec2ma4WLUnUPeKjyrfntVwe/N6dCXpU+zL3Npg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.8.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-class-properties": {
      "version": "7.12.13",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-class-properties/-/plugin-syntax-class-properties-7.12.13.tgz",
      "integrity": "sha512-fm4idjKla0YahUNgFNLCB0qySdsoPiZP3iQE3rky0mBUtMZ23yDJ9SJdg6dXTSDnulOVqiF3Hgr9nbXvXTQZYA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.12.13"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-class-static-block": {
      "version": "7.14.5",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-class-static-block/-/plugin-syntax-class-static-block-7.14.5.tgz",
      "integrity": "sha512-b+YyPmr6ldyNnM6sqYeMWE+bgJcJpO6yS4QD7ymxgH34GBPNDM/THBh8iunyvKIZztiwLH4CJZ0RxTk9emgpjw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.14.5"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-import-attributes": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-import-attributes/-/plugin-syntax-import-attributes-7.27.1.tgz",
      "integrity": "sha512-oFT0FrKHgF53f4vOsZGi2Hh3I35PfSmVs4IBFLFj4dnafP+hIWDLg3VyKmUHfLoLHlyxY4C7DGtmHuJgn+IGww==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.27.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-import-meta": {
      "version": "7.10.4",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-import-meta/-/plugin-syntax-import-meta-7.10.4.tgz",
      "integrity": "sha512-Yqfm+XDx0+Prh3VSeEQCPU81yC+JWZ2pDPFSS4ZdpfZhp4MkFMaDC1UqseovEKwSUpnIL7+vK+Clp7bfh0iD7g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.10.4"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-json-strings": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-json-strings/-/plugin-syntax-json-strings-7.8.3.tgz",
      "integrity": "sha512-lY6kdGpWHvjoe2vk4WrAapEuBR69EMxZl+RoGRhrFGNYVK8mOPAW8VfbT/ZgrFbXlDNiiaxQnAtgVCZ6jv30EA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.8.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-jsx": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-jsx/-/plugin-syntax-jsx-7.27.1.tgz",
      "integrity": "sha512-y8YTNIeKoyhGd9O0Jiyzyyqk8gdjnumGTQPsz0xOZOQ2RmkVJeZ1vmmfIvFEKqucBG6axJGBZDE/7iI5suUI/w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.27.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-logical-assignment-operators": {
      "version": "7.10.4",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-logical-assignment-operators/-/plugin-syntax-logical-assignment-operators-7.10.4.tgz",
      "integrity": "sha512-d8waShlpFDinQ5MtvGU9xDAOzKH47+FFoney2baFIoMr952hKOLp1HR7VszoZvOsV/4+RRszNY7D17ba0te0ig==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.10.4"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-nullish-coalescing-operator": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-nullish-coalescing-operator/-/plugin-syntax-nullish-coalescing-operator-7.8.3.tgz",
      "integrity": "sha512-aSff4zPII1u2QD7y+F8oDsz19ew4IGEJg9SVW+bqwpwtfFleiQDMdzA/R+UlWDzfnHFCxxleFT0PMIrR36XLNQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.8.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-numeric-separator": {
      "version": "7.10.4",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-numeric-separator/-/plugin-syntax-numeric-separator-7.10.4.tgz",
      "integrity": "sha512-9H6YdfkcK/uOnY/K7/aA2xpzaAgkQn37yzWUMRK7OaPOqOpGS1+n0H5hxT9AUw9EsSjPW8SVyMJwYRtWs3X3ug==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.10.4"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-object-rest-spread": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-object-rest-spread/-/plugin-syntax-object-rest-spread-7.8.3.tgz",
      "integrity": "sha512-XoqMijGZb9y3y2XskN+P1wUGiVwWZ5JmoDRwx5+3GmEplNyVM2s2Dg8ILFQm8rWM48orGy5YpI5Bl8U1y7ydlA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.8.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-optional-catch-binding": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-optional-catch-binding/-/plugin-syntax-optional-catch-binding-7.8.3.tgz",
      "integrity": "sha512-6VPD0Pc1lpTqw0aKoeRTMiB+kWhAoT24PA+ksWSBrFtl5SIRVpZlwN3NNPQjehA2E/91FV3RjLWoVTglWcSV3Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.8.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-optional-chaining": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-optional-chaining/-/plugin-syntax-optional-chaining-7.8.3.tgz",
      "integrity": "sha512-KoK9ErH1MBlCPxV0VANkXW2/dw4vlbGDrFgz8bmUsBGYkFRcbRwMh6cIJubdPrkxRwuGdtCk0v/wPTKbQgBjkg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.8.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-private-property-in-object": {
      "version": "7.14.5",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-private-property-in-object/-/plugin-syntax-private-property-in-object-7.14.5.tgz",
      "integrity": "sha512-0wVnp9dxJ72ZUJDV27ZfbSj6iHLoytYZmh3rFcxNnvsJF3ktkzLDZPy/mA17HGsaQT3/DQsWYX1f1QGWkCoVUg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.14.5"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-top-level-await": {
      "version": "7.14.5",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-top-level-await/-/plugin-syntax-top-level-await-7.14.5.tgz",
      "integrity": "sha512-hx++upLv5U1rgYfwe1xBQUhRmU41NEvpUvrp8jkrSCdvGSnM5/qdRMtylJ6PG5OFkBaHkbTAKTnd3/YyESRHFw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.14.5"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-typescript": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-typescript/-/plugin-syntax-typescript-7.27.1.tgz",
      "integrity": "sha512-xfYCBMxveHrRMnAWl1ZlPXOZjzkN82THFvLhQhFXFt81Z5HnN+EtUkZhv/zcKpmT3fzmWZB0ywiBrbC3vogbwQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.27.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/template": {
      "version": "7.27.2",
      "resolved": "https://registry.npmjs.org/@babel/template/-/template-7.27.2.tgz",
      "integrity": "sha512-LPDZ85aEJyYSd18/DkjNh4/y1ntkE5KwUHWTiqgRxruuZL2F1yuHligVHLvcHY2vMHXttKFpJn6LwfI7cw7ODw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.27.1",
        "@babel/parser": "^7.27.2",
        "@babel/types": "^7.27.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/traverse": {
      "version": "7.28.5",
      "resolved": "https://registry.npmjs.org/@babel/traverse/-/traverse-7.28.5.tgz",
      "integrity": "sha512-TCCj4t55U90khlYkVV/0TfkJkAkUg3jZFA3Neb7unZT8CPok7iiRfaX0F+WnqWqt7OxhOn0uBKXCw4lbL8W0aQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.27.1",
        "@babel/generator": "^7.28.5",
        "@babel/helper-globals": "^7.28.0",
        "@babel/parser": "^7.28.5",
        "@babel/template": "^7.27.2",
        "@babel/types": "^7.28.5",
        "debug": "^4.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/types": {
      "version": "7.28.5",
      "resolved": "https://registry.npmjs.org/@babel/types/-/types-7.28.5.tgz",
      "integrity": "sha512-qQ5m48eI/MFLQ5PxQj4PFaprjyCTLI37ElWMmNs0K8Lk3dVeOdNpB3ks8jc7yM5CDmVC73eMVk/trk3fgmrUpA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-string-parser": "^7.27.1",
        "@babel/helper-validator-identifier": "^7.28.5"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@bcoe/v8-coverage": {
      "version": "0.2.3",
      "resolved": "https://registry.npmjs.org/@bcoe/v8-coverage/-/v8-coverage-0.2.3.tgz",
      "integrity": "sha512-0hYQ8SB4Db5zvZB4axdMHGwEaQjkZzFjQiN9LVYvIFB2nSUHW9tYpxWriPrWDASIxiaXax83REcLxuSdnGPZtw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@colors/colors": {
      "version": "1.5.0",
      "resolved": "https://registry.npmjs.org/@colors/colors/-/colors-1.5.0.tgz",
      "integrity": "sha512-ooWCrlZP11i8GImSjTHYHLkvFDP48nS4+204nGb1RiX/WXYHmJA2III9/e2DWVabCESdW7hBAEzHRqUn9OUVvQ==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=0.1.90"
      }
    },
    "node_modules/@cspotcode/source-map-support": {
      "version": "0.8.1",
      "resolved": "https://registry.npmjs.org/@cspotcode/source-map-support/-/source-map-support-0.8.1.tgz",
      "integrity": "sha512-IchNf6dN4tHoMFIn/7OE8LWZ19Y6q/67Bmf6vnGREv8RSbBVb9LPJxEcnwrcwX6ixSvaiGoomAUvu4YSxXrVgw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/trace-mapping": "0.3.9"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@cspotcode/source-map-support/node_modules/@jridgewell/trace-mapping": {
      "version": "0.3.9",
      "resolved": "https://registry.npmjs.org/@jridgewell/trace-mapping/-/trace-mapping-0.3.9.tgz",
      "integrity": "sha512-3Belt6tdc8bPgAtbcmdtNJlirVoTmEb5e2gC94PnkwEW9jI6CAHUeoG85tjWP5WquqfavoMtMwiG4P926ZKKuQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/resolve-uri": "^3.0.3",
        "@jridgewell/sourcemap-codec": "^1.4.10"
      }
    },
    "node_modules/@istanbuljs/load-nyc-config": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@istanbuljs/load-nyc-config/-/load-nyc-config-1.1.0.tgz",
      "integrity": "sha512-VjeHSlIzpv/NyD3N0YuHfXOPDIixcA1q2ZV98wsMqcYlPmv2n3Yb2lYP9XMElnaFVXg5A7YLTeLu6V84uQDjmQ==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "camelcase": "^5.3.1",
        "find-up": "^4.1.0",
        "get-package-type": "^0.1.0",
        "js-yaml": "^3.13.1",
        "resolve-from": "^5.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/@istanbuljs/load-nyc-config/node_modules/argparse": {
      "version": "1.0.10",
      "resolved": "https://registry.npmjs.org/argparse/-/argparse-1.0.10.tgz",
      "integrity": "sha512-o5Roy6tNG4SL/FOkCAN6RzjiakZS25RLYFrcMttJqbdd8BWrnA+fGz57iN5Pb06pvBGvl5gQ0B48dJlslXvoTg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "sprintf-js": "~1.0.2"
      }
    },
    "node_modules/@istanbuljs/load-nyc-config/node_modules/js-yaml": {
      "version": "3.14.2",
      "resolved": "https://registry.npmjs.org/js-yaml/-/js-yaml-3.14.2.tgz",
      "integrity": "sha512-PMSmkqxr106Xa156c2M265Z+FTrPl+oxd/rgOQy2tijQeK5TxQ43psO1ZCwhVOSdnn+RzkzlRz/eY4BgJBYVpg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "argparse": "^1.0.7",
        "esprima": "^4.0.0"
      },
      "bin": {
        "js-yaml": "bin/js-yaml.js"
      }
    },
    "node_modules/@istanbuljs/schema": {
      "version": "0.1.3",
      "resolved": "https://registry.npmjs.org/@istanbuljs/schema/-/schema-0.1.3.tgz",
      "integrity": "sha512-ZXRY4jNvVgSVQ8DL3LTcakaAtXwTVUxE81hslsyD2AtoXW/wVob10HkOJ1X/pAlcI7D+2YoZKg5do8G/w6RYgA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/@jest/console": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/@jest/console/-/console-29.7.0.tgz",
      "integrity": "sha512-5Ni4CU7XHQi32IJ398EEP4RrB8eV09sXP2ROqD4bksHrnTree52PsxvX8tpL8LvTZ3pFzXyPbNQReSN41CAhOg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jest/types": "^29.6.3",
        "@types/node": "*",
        "chalk": "^4.0.0",
        "jest-message-util": "^29.7.0",
        "jest-util": "^29.7.0",
        "slash": "^3.0.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/@jest/core": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/@jest/core/-/core-29.7.0.tgz",
      "integrity": "sha512-n7aeXWKMnGtDA48y8TLWJPJmLmmZ642Ceo78cYWEpiD7FzDgmNDV/GCVRorPABdXLJZ/9wzzgZAlHjXjxDHGsg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jest/console": "^29.7.0",
        "@jest/reporters": "^29.7.0",
        "@jest/test-result": "^29.7.0",
        "@jest/transform": "^29.7.0",
        "@jest/types": "^29.6.3",
        "@types/node": "*",
        "ansi-escapes": "^4.2.1",
        "chalk": "^4.0.0",
        "ci-info": "^3.2.0",
        "exit": "^0.1.2",
        "graceful-fs": "^4.2.9",
        "jest-changed-files": "^29.7.0",
        "jest-config": "^29.7.0",
        "jest-haste-map": "^29.7.0",
        "jest-message-util": "^29.7.0",
        "jest-regex-util": "^29.6.3",
        "jest-resolve": "^29.7.0",
        "jest-resolve-dependencies": "^29.7.0",
        "jest-runner": "^29.7.0",
        "jest-runtime": "^29.7.0",
        "jest-snapshot": "^29.7.0",
        "jest-util": "^29.7.0",
        "jest-validate": "^29.7.0",
        "jest-watcher": "^29.7.0",
        "micromatch": "^4.0.4",
        "pretty-format": "^29.7.0",
        "slash": "^3.0.0",
        "strip-ansi": "^6.0.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      },
      "peerDependencies": {
        "node-notifier": "^8.0.1 || ^9.0.0 || ^10.0.0"
      },
      "peerDependenciesMeta": {
        "node-notifier": {
          "optional": true
        }
      }
    },
    "node_modules/@jest/environment": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/@jest/environment/-/environment-29.7.0.tgz",
      "integrity": "sha512-aQIfHDq33ExsN4jP1NWGXhxgQ/wixs60gDiKO+XVMd8Mn0NWPWgc34ZQDTb2jKaUWQ7MuwoitXAsN2XVXNMpAw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jest/fake-timers": "^29.7.0",
        "@jest/types": "^29.6.3",
        "@types/node": "*",
        "jest-mock": "^29.7.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/@jest/expect": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/@jest/expect/-/expect-29.7.0.tgz",
      "integrity": "sha512-8uMeAMycttpva3P1lBHB8VciS9V0XAr3GymPpipdyQXbBcuhkLQOSe8E/p92RyAdToS6ZD1tFkX+CkhoECE0dQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "expect": "^29.7.0",
        "jest-snapshot": "^29.7.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/@jest/expect-utils": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/@jest/expect-utils/-/expect-utils-29.7.0.tgz",
      "integrity": "sha512-GlsNBWiFQFCVi9QVSx7f5AgMeLxe9YCCs5PuP2O2LdjDAA8Jh9eX7lA1Jq/xdXw3Wb3hyvlFNfZIfcRetSzYcA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "jest-get-type": "^29.6.3"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/@jest/fake-timers": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/@jest/fake-timers/-/fake-timers-29.7.0.tgz",
      "integrity": "sha512-q4DH1Ha4TTFPdxLsqDXK1d3+ioSL7yL5oCMJZgDYm6i+6CygW5E5xVr/D1HdsGxjt1ZWSfUAs9OxSB/BNelWrQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jest/types": "^29.6.3",
        "@sinonjs/fake-timers": "^10.0.2",
        "@types/node": "*",
        "jest-message-util": "^29.7.0",
        "jest-mock": "^29.7.0",
        "jest-util": "^29.7.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/@jest/globals": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/@jest/globals/-/globals-29.7.0.tgz",
      "integrity": "sha512-mpiz3dutLbkW2MNFubUGUEVLkTGiqW6yLVTA+JbP6fI6J5iL9Y0Nlg8k95pcF8ctKwCS7WVxteBs29hhfAotzQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jest/environment": "^29.7.0",
        "@jest/expect": "^29.7.0",
        "@jest/types": "^29.6.3",
        "jest-mock": "^29.7.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/@jest/reporters": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/@jest/reporters/-/reporters-29.7.0.tgz",
      "integrity": "sha512-DApq0KJbJOEzAFYjHADNNxAE3KbhxQB1y5Kplb5Waqw6zVbuWatSnMjE5gs8FUgEPmNsnZA3NCWl9NG0ia04Pg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@bcoe/v8-coverage": "^0.2.3",
        "@jest/console": "^29.7.0",
        "@jest/test-result": "^29.7.0",
        "@jest/transform": "^29.7.0",
        "@jest/types": "^29.6.3",
        "@jridgewell/trace-mapping": "^0.3.18",
        "@types/node": "*",
        "chalk": "^4.0.0",
        "collect-v8-coverage": "^1.0.0",
        "exit": "^0.1.2",
        "glob": "^7.1.3",
        "graceful-fs": "^4.2.9",
        "istanbul-lib-coverage": "^3.0.0",
        "istanbul-lib-instrument": "^6.0.0",
        "istanbul-lib-report": "^3.0.0",
        "istanbul-lib-source-maps": "^4.0.0",
        "istanbul-reports": "^3.1.3",
        "jest-message-util": "^29.7.0",
        "jest-util": "^29.7.0",
        "jest-worker": "^29.7.0",
        "slash": "^3.0.0",
        "string-length": "^4.0.1",
        "strip-ansi": "^6.0.0",
        "v8-to-istanbul": "^9.0.1"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      },
      "peerDependencies": {
        "node-notifier": "^8.0.1 || ^9.0.0 || ^10.0.0"
      },
      "peerDependenciesMeta": {
        "node-notifier": {
          "optional": true
        }
      }
    },
    "node_modules/@jest/schemas": {
      "version": "29.6.3",
      "resolved": "https://registry.npmjs.org/@jest/schemas/-/schemas-29.6.3.tgz",
      "integrity": "sha512-mo5j5X+jIZmJQveBKeS/clAueipV7KgiX1vMgCxam1RNYiqE1w62n0/tJJnHtjW8ZHcQco5gY85jA3mi0L+nSA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@sinclair/typebox": "^0.27.8"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/@jest/source-map": {
      "version": "29.6.3",
      "resolved": "https://registry.npmjs.org/@jest/source-map/-/source-map-29.6.3.tgz",
      "integrity": "sha512-MHjT95QuipcPrpLM+8JMSzFx6eHp5Bm+4XeFDJlwsvVBjmKNiIAvasGK2fxz2WbGRlnvqehFbh07MMa7n3YJnw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/trace-mapping": "^0.3.18",
        "callsites": "^3.0.0",
        "graceful-fs": "^4.2.9"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/@jest/test-result": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/@jest/test-result/-/test-result-29.7.0.tgz",
      "integrity": "sha512-Fdx+tv6x1zlkJPcWXmMDAG2HBnaR9XPSd5aDWQVsfrZmLVT3lU1cwyxLgRmXR9yrq4NBoEm9BMsfgFzTQAbJYA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jest/console": "^29.7.0",
        "@jest/types": "^29.6.3",
        "@types/istanbul-lib-coverage": "^2.0.0",
        "collect-v8-coverage": "^1.0.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/@jest/test-sequencer": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/@jest/test-sequencer/-/test-sequencer-29.7.0.tgz",
      "integrity": "sha512-GQwJ5WZVrKnOJuiYiAF52UNUJXgTZx1NHjFSEB0qEMmSZKAkdMoIzw/Cj6x6NF4AvV23AUqDpFzQkN/eYCYTxw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jest/test-result": "^29.7.0",
        "graceful-fs": "^4.2.9",
        "jest-haste-map": "^29.7.0",
        "slash": "^3.0.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/@jest/transform": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/@jest/transform/-/transform-29.7.0.tgz",
      "integrity": "sha512-ok/BTPFzFKVMwO5eOHRrvnBVHdRy9IrsrW1GpMaQ9MCnilNLXQKmAX8s1YXDFaai9xJpac2ySzV0YeRRECr2Vw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/core": "^7.11.6",
        "@jest/types": "^29.6.3",
        "@jridgewell/trace-mapping": "^0.3.18",
        "babel-plugin-istanbul": "^6.1.1",
        "chalk": "^4.0.0",
        "convert-source-map": "^2.0.0",
        "fast-json-stable-stringify": "^2.1.0",
        "graceful-fs": "^4.2.9",
        "jest-haste-map": "^29.7.0",
        "jest-regex-util": "^29.6.3",
        "jest-util": "^29.7.0",
        "micromatch": "^4.0.4",
        "pirates": "^4.0.4",
        "slash": "^3.0.0",
        "write-file-atomic": "^4.0.2"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/@jest/types": {
      "version": "29.6.3",
      "resolved": "https://registry.npmjs.org/@jest/types/-/types-29.6.3.tgz",
      "integrity": "sha512-u3UPsIilWKOM3F9CXtrG8LEJmNxwoCQC/XVj4IKYXvvpx7QIi/Kg1LI5uDmDpKlac62NUtX7eLjRh+jVZcLOzw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jest/schemas": "^29.6.3",
        "@types/istanbul-lib-coverage": "^2.0.0",
        "@types/istanbul-reports": "^3.0.0",
        "@types/node": "*",
        "@types/yargs": "^17.0.8",
        "chalk": "^4.0.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/@jridgewell/gen-mapping": {
      "version": "0.3.13",
      "resolved": "https://registry.npmjs.org/@jridgewell/gen-mapping/-/gen-mapping-0.3.13.tgz",
      "integrity": "sha512-2kkt/7niJ6MgEPxF0bYdQ6etZaA+fQvDcLKckhy1yIQOzaoKjBBjSj63/aLVjYE3qhRt5dvM+uUyfCg6UKCBbA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/sourcemap-codec": "^1.5.0",
        "@jridgewell/trace-mapping": "^0.3.24"
      }
    },
    "node_modules/@jridgewell/remapping": {
      "version": "2.3.5",
      "resolved": "https://registry.npmjs.org/@jridgewell/remapping/-/remapping-2.3.5.tgz",
      "integrity": "sha512-LI9u/+laYG4Ds1TDKSJW2YPrIlcVYOwi2fUC6xB43lueCjgxV4lffOCZCtYFiH6TNOX+tQKXx97T4IKHbhyHEQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/gen-mapping": "^0.3.5",
        "@jridgewell/trace-mapping": "^0.3.24"
      }
    },
    "node_modules/@jridgewell/resolve-uri": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/@jridgewell/resolve-uri/-/resolve-uri-3.1.2.tgz",
      "integrity": "sha512-bRISgCIjP20/tbWSPWMEi54QVPRZExkuD9lJL+UIxUKtwVJA8wW1Trb1jMs1RFXo1CBTNZ/5hpC9QvmKWdopKw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@jridgewell/sourcemap-codec": {
      "version": "1.5.5",
      "resolved": "https://registry.npmjs.org/@jridgewell/sourcemap-codec/-/sourcemap-codec-1.5.5.tgz",
      "integrity": "sha512-cYQ9310grqxueWbl+WuIUIaiUaDcj7WOq5fVhEljNVgRfOUhY9fy2zTvfoqWsnebh8Sl70VScFbICvJnLKB0Og==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@jridgewell/trace-mapping": {
      "version": "0.3.31",
      "resolved": "https://registry.npmjs.org/@jridgewell/trace-mapping/-/trace-mapping-0.3.31.tgz",
      "integrity": "sha512-zzNR+SdQSDJzc8joaeP8QQoCQr8NuYx2dIIytl1QeBEZHJ9uW6hebsrYgbz8hJwUQao3TWCMtmfV8Nu1twOLAw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/resolve-uri": "^3.1.0",
        "@jridgewell/sourcemap-codec": "^1.4.14"
      }
    },
    "node_modules/@sinclair/typebox": {
      "version": "0.27.8",
      "resolved": "https://registry.npmjs.org/@sinclair/typebox/-/typebox-0.27.8.tgz",
      "integrity": "sha512-+Fj43pSMwJs4KRrH/938Uf+uAELIgVBmQzg/q1YG10djyfA3TnrU8N8XzqCh/okZdszqBQTZf96idMfE5lnwTA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@sindresorhus/is": {
      "version": "4.6.0",
      "resolved": "https://registry.npmjs.org/@sindresorhus/is/-/is-4.6.0.tgz",
      "integrity": "sha512-t09vSN3MdfsyCHoFcTRCH/iUtG7OJ0CsjzB8cjAmKc/va/kIgeDI/TxsigdncE/4be734m0cvIYwNaV4i2XqAw==",
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sindresorhus/is?sponsor=1"
      }
    },
    "node_modules/@sinonjs/commons": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/@sinonjs/commons/-/commons-3.0.1.tgz",
      "integrity": "sha512-K3mCHKQ9sVh8o1C9cxkwxaOmXoAMlDxC1mYyHrjqOWEcBjYr76t96zL2zlj5dUGZ3HSw240X1qgH3Mjf1yJWpQ==",
      "dev": true,
      "license": "BSD-3-Clause",
      "dependencies": {
        "type-detect": "4.0.8"
      }
    },
    "node_modules/@sinonjs/fake-timers": {
      "version": "10.3.0",
      "resolved": "https://registry.npmjs.org/@sinonjs/fake-timers/-/fake-timers-10.3.0.tgz",
      "integrity": "sha512-V4BG07kuYSUkTCSBHG8G8TNhM+F19jXFWnQtzj+we8DrkpSBCee9Z3Ms8yiGer/dlmhe35/Xdgyo3/0rQKg7YA==",
      "dev": true,
      "license": "BSD-3-Clause",
      "dependencies": {
        "@sinonjs/commons": "^3.0.0"
      }
    },
    "node_modules/@tsconfig/node10": {
      "version": "1.0.12",
      "resolved": "https://registry.npmjs.org/@tsconfig/node10/-/node10-1.0.12.tgz",
      "integrity": "sha512-UCYBaeFvM11aU2y3YPZ//O5Rhj+xKyzy7mvcIoAjASbigy8mHMryP5cK7dgjlz2hWxh1g5pLw084E0a/wlUSFQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@tsconfig/node12": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/@tsconfig/node12/-/node12-1.0.11.tgz",
      "integrity": "sha512-cqefuRsh12pWyGsIoBKJA9luFu3mRxCA+ORZvA4ktLSzIuCUtWVxGIuXigEwO5/ywWFMZ2QEGKWvkZG1zDMTag==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@tsconfig/node14": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/@tsconfig/node14/-/node14-1.0.3.tgz",
      "integrity": "sha512-ysT8mhdixWK6Hw3i1V2AeRqZ5WfXg1G43mqoYlM2nc6388Fq5jcXyr5mRsqViLx/GJYdoL0bfXD8nmF+Zn/Iow==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@tsconfig/node16": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/@tsconfig/node16/-/node16-1.0.4.tgz",
      "integrity": "sha512-vxhUy4J8lyeyinH7Azl1pdd43GJhZH/tP2weN8TntQblOY+A0XbT8DJk1/oCPuOOyg/Ja757rG0CgHcWC8OfMA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/babel__core": {
      "version": "7.20.5",
      "resolved": "https://registry.npmjs.org/@types/babel__core/-/babel__core-7.20.5.tgz",
      "integrity": "sha512-qoQprZvz5wQFJwMDqeseRXWv3rqMvhgpbXFfVyWhbx9X47POIA6i/+dXefEmZKoAgOaTdaIgNSMqMIU61yRyzA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/parser": "^7.20.7",
        "@babel/types": "^7.20.7",
        "@types/babel__generator": "*",
        "@types/babel__template": "*",
        "@types/babel__traverse": "*"
      }
    },
    "node_modules/@types/babel__generator": {
      "version": "7.27.0",
      "resolved": "https://registry.npmjs.org/@types/babel__generator/-/babel__generator-7.27.0.tgz",
      "integrity": "sha512-ufFd2Xi92OAVPYsy+P4n7/U7e68fex0+Ee8gSG9KX7eo084CWiQ4sdxktvdl0bOPupXtVJPY19zk6EwWqUQ8lg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.0.0"
      }
    },
    "node_modules/@types/babel__template": {
      "version": "7.4.4",
      "resolved": "https://registry.npmjs.org/@types/babel__template/-/babel__template-7.4.4.tgz",
      "integrity": "sha512-h/NUaSyG5EyxBIp8YRxo4RMe2/qQgvyowRwVMzhYhBCONbW8PUsg4lkFMrhgZhUe5z3L3MiLDuvyJ/CaPa2A8A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/parser": "^7.1.0",
        "@babel/types": "^7.0.0"
      }
    },
    "node_modules/@types/babel__traverse": {
      "version": "7.28.0",
      "resolved": "https://registry.npmjs.org/@types/babel__traverse/-/babel__traverse-7.28.0.tgz",
      "integrity": "sha512-8PvcXf70gTDZBgt9ptxJ8elBeBjcLOAcOtoO/mPJjtji1+CdGbHgm77om1GrsPxsiE+uXIpNSK64UYaIwQXd4Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.28.2"
      }
    },
    "node_modules/@types/cardinal": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/@types/cardinal/-/cardinal-2.1.1.tgz",
      "integrity": "sha512-/xCVwg8lWvahHsV2wXZt4i64H1sdL+sN1Uoq7fAc8/FA6uYHjuIveDwPwvGUYp4VZiv85dVl6J/Bum3NDAOm8g==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/graceful-fs": {
      "version": "4.1.9",
      "resolved": "https://registry.npmjs.org/@types/graceful-fs/-/graceful-fs-4.1.9.tgz",
      "integrity": "sha512-olP3sd1qOEe5dXTSaFvQG+02VdRXcdytWLAZsAq1PecU8uqQAhkrnbli7DagjtXKW/Bl7YJbUsa8MPcuc8LHEQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/node": "*"
      }
    },
    "node_modules/@types/istanbul-lib-coverage": {
      "version": "2.0.6",
      "resolved": "https://registry.npmjs.org/@types/istanbul-lib-coverage/-/istanbul-lib-coverage-2.0.6.tgz",
      "integrity": "sha512-2QF/t/auWm0lsy8XtKVPG19v3sSOQlJe/YHZgfjb/KBBHOGSV+J2q/S671rcq9uTBrLAXmZpqJiaQbMT+zNU1w==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/istanbul-lib-report": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/@types/istanbul-lib-report/-/istanbul-lib-report-3.0.3.tgz",
      "integrity": "sha512-NQn7AHQnk/RSLOxrBbGyJM/aVQ+pjj5HCgasFxc0K/KhoATfQ/47AyUl15I2yBUpihjmas+a+VJBOqecrFH+uA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/istanbul-lib-coverage": "*"
      }
    },
    "node_modules/@types/istanbul-reports": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/@types/istanbul-reports/-/istanbul-reports-3.0.4.tgz",
      "integrity": "sha512-pk2B1NWalF9toCRu6gjBzR69syFjP4Od8WRAX+0mmf9lAjCRicLOWc+ZrxZHx/0XRjotgkF9t6iaMJ+aXcOdZQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/istanbul-lib-report": "*"
      }
    },
    "node_modules/@types/js-yaml": {
      "version": "4.0.9",
      "resolved": "https://registry.npmjs.org/@types/js-yaml/-/js-yaml-4.0.9.tgz",
      "integrity": "sha512-k4MGaQl5TGo/iipqb2UDG2UwjXziSWkh0uysQelTlJpX1qGlpUZYm8PnO4DxG1qBomtJUdYJ6qR6xdIah10JLg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/json5": {
      "version": "0.0.30",
      "resolved": "https://registry.npmjs.org/@types/json5/-/json5-0.0.30.tgz",
      "integrity": "sha512-sqm9g7mHlPY/43fcSNrCYfOeX9zkTTK+euO5E6+CVijSMm5tTjkVdwdqRkY3ljjIAf8679vps5jKUoJBCLsMDA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/marked": {
      "version": "5.0.2",
      "resolved": "https://registry.npmjs.org/@types/marked/-/marked-5.0.2.tgz",
      "integrity": "sha512-OucS4KMHhFzhz27KxmWg7J+kIYqyqoW5kdIEI319hqARQQUTqhao3M/F+uFnDXD0Rg72iDDZxZNxq5gvctmLlg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/marked-terminal": {
      "version": "6.1.1",
      "resolved": "https://registry.npmjs.org/@types/marked-terminal/-/marked-terminal-6.1.1.tgz",
      "integrity": "sha512-DfoUqkmFDCED7eBY9vFUhJ9fW8oZcMAK5EwRDQ9drjTbpQa+DnBTQQCwWhTFVf4WsZ6yYcJTI8D91wxTWXRZZQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/cardinal": "^2.1",
        "@types/node": "*",
        "chalk": "^5.3.0",
        "marked": ">=6.0.0 <12"
      }
    },
    "node_modules/@types/marked-terminal/node_modules/chalk": {
      "version": "5.6.2",
      "resolved": "https://registry.npmjs.org/chalk/-/chalk-5.6.2.tgz",
      "integrity": "sha512-7NzBL0rN6fMUW+f7A6Io4h40qQlG+xGmtMxfbnH/K7TAtt8JQWVQK+6g0UXKMeVJoyV5EkkNsErQ8pVD3bLHbA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^12.17.0 || ^14.13 || >=16.0.0"
      },
      "funding": {
        "url": "https://github.com/chalk/chalk?sponsor=1"
      }
    },
    "node_modules/@types/marked-terminal/node_modules/marked": {
      "version": "11.2.0",
      "resolved": "https://registry.npmjs.org/marked/-/marked-11.2.0.tgz",
      "integrity": "sha512-HR0m3bvu0jAPYiIvLUUQtdg1g6D247//lvcekpHO1WMvbwDlwSkZAX9Lw4F4YHE1T0HaaNve0tuAWuV1UJ6vtw==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "marked": "bin/marked.js"
      },
      "engines": {
        "node": ">= 18"
      }
    },
    "node_modules/@types/node": {
      "version": "20.19.30",
      "resolved": "https://registry.npmjs.org/@types/node/-/node-20.19.30.tgz",
      "integrity": "sha512-WJtwWJu7UdlvzEAUm484QNg5eAoq5QR08KDNx7g45Usrs2NtOPiX8ugDqmKdXkyL03rBqU5dYNYVQetEpBHq2g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "undici-types": "~6.21.0"
      }
    },
    "node_modules/@types/ora": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/@types/ora/-/ora-3.1.0.tgz",
      "integrity": "sha512-4e15N42qhHRlxyP5SpX9fK3q4tXvEkdmGdof2DZ0mqPu7glrNT8cs9bbI73NhwEGApq1TSXhs2aFmn19VCTwCQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/node": "*"
      }
    },
    "node_modules/@types/stack-utils": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/@types/stack-utils/-/stack-utils-2.0.3.tgz",
      "integrity": "sha512-9aEbYZ3TbYMznPdcdr3SmIrLXwC/AKZXQeCf9Pgao5CKb8CyHuEX5jzWPTkvregvhRJHcpRO6BFoGW9ycaOkYw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/yargs": {
      "version": "17.0.35",
      "resolved": "https://registry.npmjs.org/@types/yargs/-/yargs-17.0.35.tgz",
      "integrity": "sha512-qUHkeCyQFxMXg79wQfTtfndEC+N9ZZg76HJftDJp+qH2tV7Gj4OJi7l+PiWwJ+pWtW8GwSmqsDj/oymhrTWXjg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/yargs-parser": "*"
      }
    },
    "node_modules/@types/yargs-parser": {
      "version": "21.0.3",
      "resolved": "https://registry.npmjs.org/@types/yargs-parser/-/yargs-parser-21.0.3.tgz",
      "integrity": "sha512-I4q9QU9MQv4oEOz4tAHJtNz1cwuLxn2F3xcc2iV5WdqLPpUnj30aUuxt1mAxYTG+oe8CZMV/+6rU4S4gRDzqtQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/acorn": {
      "version": "8.15.0",
      "resolved": "https://registry.npmjs.org/acorn/-/acorn-8.15.0.tgz",
      "integrity": "sha512-NZyJarBfL7nWwIq+FDL6Zp/yHEhePMNnnJ0y3qfieCrmNvYct8uvtiV41UvlSe6apAfk0fY1FbWx+NwfmpvtTg==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "acorn": "bin/acorn"
      },
      "engines": {
        "node": ">=0.4.0"
      }
    },
    "node_modules/acorn-walk": {
      "version": "8.3.4",
      "resolved": "https://registry.npmjs.org/acorn-walk/-/acorn-walk-8.3.4.tgz",
      "integrity": "sha512-ueEepnujpqee2o5aIYnvHU6C0A42MNdsIDeqy5BydrkuC5R1ZuUFnm27EeFJGoEHJQgn3uleRvmTXaJgfXbt4g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "acorn": "^8.11.0"
      },
      "engines": {
        "node": ">=0.4.0"
      }
    },
    "node_modules/ansi-escapes": {
      "version": "4.3.2",
      "resolved": "https://registry.npmjs.org/ansi-escapes/-/ansi-escapes-4.3.2.tgz",
      "integrity": "sha512-gKXj5ALrKWQLsYG9jlTRmR/xKluxHV+Z9QEwNIgCfM1/uwPMCuzVVnh5mwTd+OuBZcwSIMbqssNWRm1lE51QaQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "type-fest": "^0.21.3"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/ansi-regex": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-5.0.1.tgz",
      "integrity": "sha512-quJQXlTSUGL2LH9SUXo8VwsY4soanhgo6LNSm84E1LBcE8s3O0wpdiRzyR9z/ZZJMlMWv37qOOb9pdJlMUEKFQ==",
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/ansi-styles": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-4.3.0.tgz",
      "integrity": "sha512-zbB9rCJAT1rbjiVDb2hqKFHNYLxgtk8NURxZ3IZwD3F6NtxbXZQCnnSi1Lkx+IDohdPlFp222wVALIheZJQSEg==",
      "license": "MIT",
      "dependencies": {
        "color-convert": "^2.0.1"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/any-promise": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/any-promise/-/any-promise-1.3.0.tgz",
      "integrity": "sha512-7UvmKalWRt1wgjL1RrGxoSJW/0QZFIegpeGvZG9kjp8vrRu55XTHbwnqq2GpXm9uLbcuhxm3IqX9OB4MZR1b2A==",
      "license": "MIT"
    },
    "node_modules/anymatch": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/anymatch/-/anymatch-3.1.3.tgz",
      "integrity": "sha512-KMReFUr0B4t+D+OBkjR3KYqvocp2XaSzO55UcB6mgQMd3KbcE+mWTyvVV7D/zsdEbNnV6acZUutkiHQXvTr1Rw==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "normalize-path": "^3.0.0",
        "picomatch": "^2.0.4"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/arg": {
      "version": "4.1.3",
      "resolved": "https://registry.npmjs.org/arg/-/arg-4.1.3.tgz",
      "integrity": "sha512-58S9QDqG0Xx27YwPSt9fJxivjYl432YCwfDMfZ+71RAqUrZef7LrKQZ3LHLOwCS4FLNBplP533Zx895SeOCHvA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/argparse": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/argparse/-/argparse-2.0.1.tgz",
      "integrity": "sha512-8+9WqebbFzpX9OR+Wa6O29asIogeRMzcGtAINdpMHHyAg10f05aSFVBbcEqGf/PXw1EjAZ+q2/bEBg3DvurK3Q==",
      "license": "Python-2.0"
    },
    "node_modules/asynckit": {
      "version": "0.4.0",
      "resolved": "https://registry.npmjs.org/asynckit/-/asynckit-0.4.0.tgz",
      "integrity": "sha512-Oei9OH4tRh0YqU3GxhX79dM/mwVgvbZJaSNaRk+bshkj0S5cfHcgYakreBjrHwatXKbz+IoIdYLxrKim2MjW0Q==",
      "license": "MIT"
    },
    "node_modules/axios": {
      "version": "1.13.2",
      "resolved": "https://registry.npmjs.org/axios/-/axios-1.13.2.tgz",
      "integrity": "sha512-VPk9ebNqPcy5lRGuSlKx752IlDatOjT9paPlm8A7yOuW2Fbvp4X3JznJtT4f0GzGLLiWE9W8onz51SqLYwzGaA==",
      "license": "MIT",
      "dependencies": {
        "follow-redirects": "^1.15.6",
        "form-data": "^4.0.4",
        "proxy-from-env": "^1.1.0"
      }
    },
    "node_modules/babel-jest": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/babel-jest/-/babel-jest-29.7.0.tgz",
      "integrity": "sha512-BrvGY3xZSwEcCzKvKsCi2GgHqDqsYkOP4/by5xCgIwGXQxIEh+8ew3gmrE1y7XRR6LHZIj6yLYnUi/mm2KXKBg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jest/transform": "^29.7.0",
        "@types/babel__core": "^7.1.14",
        "babel-plugin-istanbul": "^6.1.1",
        "babel-preset-jest": "^29.6.3",
        "chalk": "^4.0.0",
        "graceful-fs": "^4.2.9",
        "slash": "^3.0.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.8.0"
      }
    },
    "node_modules/babel-plugin-istanbul": {
      "version": "6.1.1",
      "resolved": "https://registry.npmjs.org/babel-plugin-istanbul/-/babel-plugin-istanbul-6.1.1.tgz",
      "integrity": "sha512-Y1IQok9821cC9onCx5otgFfRm7Lm+I+wwxOx738M/WLPZ9Q42m4IG5W0FNX8WLL2gYMZo3JkuXIH2DOpWM+qwA==",
      "dev": true,
      "license": "BSD-3-Clause",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.0.0",
        "@istanbuljs/load-nyc-config": "^1.0.0",
        "@istanbuljs/schema": "^0.1.2",
        "istanbul-lib-instrument": "^5.0.4",
        "test-exclude": "^6.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/babel-plugin-istanbul/node_modules/istanbul-lib-instrument": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/istanbul-lib-instrument/-/istanbul-lib-instrument-5.2.1.tgz",
      "integrity": "sha512-pzqtp31nLv/XFOzXGuvhCb8qhjmTVo5vjVk19XE4CRlSWz0KoeJ3bw9XsA7nOp9YBf4qHjwBxkDzKcME/J29Yg==",
      "dev": true,
      "license": "BSD-3-Clause",
      "dependencies": {
        "@babel/core": "^7.12.3",
        "@babel/parser": "^7.14.7",
        "@istanbuljs/schema": "^0.1.2",
        "istanbul-lib-coverage": "^3.2.0",
        "semver": "^6.3.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/babel-plugin-jest-hoist": {
      "version": "29.6.3",
      "resolved": "https://registry.npmjs.org/babel-plugin-jest-hoist/-/babel-plugin-jest-hoist-29.6.3.tgz",
      "integrity": "sha512-ESAc/RJvGTFEzRwOTT4+lNDk/GNHMkKbNzsvT0qKRfDyyYTskxB5rnU2njIDYVxXCBHHEI1c0YwHob3WaYujOg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/template": "^7.3.3",
        "@babel/types": "^7.3.3",
        "@types/babel__core": "^7.1.14",
        "@types/babel__traverse": "^7.0.6"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/babel-preset-current-node-syntax": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/babel-preset-current-node-syntax/-/babel-preset-current-node-syntax-1.2.0.tgz",
      "integrity": "sha512-E/VlAEzRrsLEb2+dv8yp3bo4scof3l9nR4lrld+Iy5NyVqgVYUJnDAmunkhPMisRI32Qc4iRiz425d8vM++2fg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/plugin-syntax-async-generators": "^7.8.4",
        "@babel/plugin-syntax-bigint": "^7.8.3",
        "@babel/plugin-syntax-class-properties": "^7.12.13",
        "@babel/plugin-syntax-class-static-block": "^7.14.5",
        "@babel/plugin-syntax-import-attributes": "^7.24.7",
        "@babel/plugin-syntax-import-meta": "^7.10.4",
        "@babel/plugin-syntax-json-strings": "^7.8.3",
        "@babel/plugin-syntax-logical-assignment-operators": "^7.10.4",
        "@babel/plugin-syntax-nullish-coalescing-operator": "^7.8.3",
        "@babel/plugin-syntax-numeric-separator": "^7.10.4",
        "@babel/plugin-syntax-object-rest-spread": "^7.8.3",
        "@babel/plugin-syntax-optional-catch-binding": "^7.8.3",
        "@babel/plugin-syntax-optional-chaining": "^7.8.3",
        "@babel/plugin-syntax-private-property-in-object": "^7.14.5",
        "@babel/plugin-syntax-top-level-await": "^7.14.5"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0 || ^8.0.0-0"
      }
    },
    "node_modules/babel-preset-jest": {
      "version": "29.6.3",
      "resolved": "https://registry.npmjs.org/babel-preset-jest/-/babel-preset-jest-29.6.3.tgz",
      "integrity": "sha512-0B3bhxR6snWXJZtR/RliHTDPRgn1sNHOR0yVtq/IiQFyuOVjFS+wuio/R4gSNkyYmKmJB4wGZv2NZanmKmTnNA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "babel-plugin-jest-hoist": "^29.6.3",
        "babel-preset-current-node-syntax": "^1.0.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/balanced-match": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/balanced-match/-/balanced-match-1.0.2.tgz",
      "integrity": "sha512-3oSeUO0TMV67hN1AmbXsK4yaqU7tjiHlbxRDZOpH0KW9+CeX4bRAaX0Anxt0tx2MrpRpWwQaPwIlISEJhYU5Pw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/base64-js": {
      "version": "1.5.1",
      "resolved": "https://registry.npmjs.org/base64-js/-/base64-js-1.5.1.tgz",
      "integrity": "sha512-AKpaYlHn8t4SVbOHCy+b5+KKgvR4vrsD8vbvrbiQJps7fKDTkjkDry6ji0rUJjC0kzbNePLwzxq8iypo41qeWA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/baseline-browser-mapping": {
      "version": "2.8.32",
      "resolved": "https://registry.npmjs.org/baseline-browser-mapping/-/baseline-browser-mapping-2.8.32.tgz",
      "integrity": "sha512-OPz5aBThlyLFgxyhdwf/s2+8ab3OvT7AdTNvKHBwpXomIYeXqpUUuT8LrdtxZSsWJ4R4CU1un4XGh5Ez3nlTpw==",
      "dev": true,
      "license": "Apache-2.0",
      "bin": {
        "baseline-browser-mapping": "dist/cli.js"
      }
    },
    "node_modules/bl": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/bl/-/bl-5.1.0.tgz",
      "integrity": "sha512-tv1ZJHLfTDnXE6tMHv73YgSJaWR2AFuPwMntBe7XL/GBFHnT0CLnsHMogfk5+GzCDC5ZWarSCYaIGATZt9dNsQ==",
      "license": "MIT",
      "dependencies": {
        "buffer": "^6.0.3",
        "inherits": "^2.0.4",
        "readable-stream": "^3.4.0"
      }
    },
    "node_modules/brace-expansion": {
      "version": "1.1.12",
      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.12.tgz",
      "integrity": "sha512-9T9UjW3r0UW5c1Q7GTwllptXwhvYmEzFhzMfZ9H7FQWt+uZePjZPjBP/W1ZEyZ1twGWom5/56TF4lPcqjnDHcg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "balanced-match": "^1.0.0",
        "concat-map": "0.0.1"
      }
    },
    "node_modules/braces": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/braces/-/braces-3.0.3.tgz",
      "integrity": "sha512-yQbXgO/OSZVD2IsiLlro+7Hf6Q18EJrKSEsdoMzKePKXct3gvD8oLcOQdIzGupr5Fj+EDe8gO/lxc1BzfMpxvA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fill-range": "^7.1.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/browserslist": {
      "version": "4.28.0",
      "resolved": "https://registry.npmjs.org/browserslist/-/browserslist-4.28.0.tgz",
      "integrity": "sha512-tbydkR/CxfMwelN0vwdP/pLkDwyAASZ+VfWm4EOwlB6SWhx1sYnWLqo8N5j0rAzPfzfRaxt0mM/4wPU/Su84RQ==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/browserslist"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "baseline-browser-mapping": "^2.8.25",
        "caniuse-lite": "^1.0.30001754",
        "electron-to-chromium": "^1.5.249",
        "node-releases": "^2.0.27",
        "update-browserslist-db": "^1.1.4"
      },
      "bin": {
        "browserslist": "cli.js"
      },
      "engines": {
        "node": "^6 || ^7 || ^8 || ^9 || ^10 || ^11 || ^12 || >=13.7"
      }
    },
    "node_modules/bser": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/bser/-/bser-2.1.1.tgz",
      "integrity": "sha512-gQxTNE/GAfIIrmHLUE3oJyp5FO6HRBfhjnw4/wMmA63ZGDJnWBmgY/lyQBpnDUkGmAhbSe39tx2d/iTOAfglwQ==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "node-int64": "^0.4.0"
      }
    },
    "node_modules/buffer": {
      "version": "6.0.3",
      "resolved": "https://registry.npmjs.org/buffer/-/buffer-6.0.3.tgz",
      "integrity": "sha512-FTiCpNxtwiZZHEZbcbTIcZjERVICn9yq/pDFkTl95/AxzD1naBctN7YO68riM/gLSDY7sdrMby8hofADYuuqOA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "base64-js": "^1.3.1",
        "ieee754": "^1.2.1"
      }
    },
    "node_modules/buffer-from": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/buffer-from/-/buffer-from-1.1.2.tgz",
      "integrity": "sha512-E+XQCRwSbaaiChtv6k6Dwgc+bx+Bs6vuKJHHl5kox/BaKbhiXzqQOwK4cO22yElGp2OCmjwVhT3HmxgyPGnJfQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/call-bind-apply-helpers": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/call-bind-apply-helpers/-/call-bind-apply-helpers-1.0.2.tgz",
      "integrity": "sha512-Sp1ablJ0ivDkSzjcaJdxEunN5/XvksFJ2sMBFfq6x0ryhQV/2b/KwFe21cMpmHtPOSij8K99/wSfoEuTObmuMQ==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/callsites": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/callsites/-/callsites-3.1.0.tgz",
      "integrity": "sha512-P8BjAsXvZS+VIDUI11hHCQEv74YT67YUi5JJFNWIqL235sBmjX4+qx9Muvls5ivyNENctx46xQLQ3aTuE7ssaQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/camelcase": {
      "version": "5.3.1",
      "resolved": "https://registry.npmjs.org/camelcase/-/camelcase-5.3.1.tgz",
      "integrity": "sha512-L28STB170nwWS63UjtlEOE3dldQApaJXZkOI1uMFfzf3rRuPegHaHesyee+YxQ+W6SvRDQV6UrdOdRiR153wJg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/caniuse-lite": {
      "version": "1.0.30001757",
      "resolved": "https://registry.npmjs.org/caniuse-lite/-/caniuse-lite-1.0.30001757.tgz",
      "integrity": "sha512-r0nnL/I28Zi/yjk1el6ilj27tKcdjLsNqAOZr0yVjWPrSQyHgKI2INaEWw21bAQSv2LXRt1XuCS/GomNpWOxsQ==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/caniuse-lite"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "CC-BY-4.0"
    },
    "node_modules/chalk": {
      "version": "4.1.2",
      "resolved": "https://registry.npmjs.org/chalk/-/chalk-4.1.2.tgz",
      "integrity": "sha512-oKnbhFyRIXpUuez8iBMmyEa4nbj4IOQyuhc/wy9kY7/WVPcwIO9VA668Pu8RkO7+0G76SLROeyw9CpQ061i4mA==",
      "license": "MIT",
      "dependencies": {
        "ansi-styles": "^4.1.0",
        "supports-color": "^7.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/chalk?sponsor=1"
      }
    },
    "node_modules/char-regex": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/char-regex/-/char-regex-1.0.2.tgz",
      "integrity": "sha512-kWWXztvZ5SBQV+eRgKFeh8q5sLuZY2+8WUIzlxWVTg+oGwY14qylx1KbKzHd8P6ZYkAg0xyIDU9JMHhyJMZ1jw==",
      "license": "MIT",
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/ci-info": {
      "version": "3.9.0",
      "resolved": "https://registry.npmjs.org/ci-info/-/ci-info-3.9.0.tgz",
      "integrity": "sha512-NIxF55hv4nSqQswkAeiOi1r83xy8JldOFDTWiug55KBu9Jnblncd2U6ViHmYgHf01TPZS77NJBhBMKdWj9HQMQ==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/sibiraj-s"
        }
      ],
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/cjs-module-lexer": {
      "version": "1.4.3",
      "resolved": "https://registry.npmjs.org/cjs-module-lexer/-/cjs-module-lexer-1.4.3.tgz",
      "integrity": "sha512-9z8TZaGM1pfswYeXrUpzPrkx8UnWYdhJclsiYMm6x/w5+nN+8Tf/LnAgfLGQCm59qAOxU8WwHEq2vNwF6i4j+Q==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/cli-cursor": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/cli-cursor/-/cli-cursor-4.0.0.tgz",
      "integrity": "sha512-VGtlMu3x/4DOtIUwEkRezxUZ2lBacNJCHash0N0WeZDBS+7Ux1dm3XWAgWYxLJFMMdOeXMHXorshEFhbMSGelg==",
      "license": "MIT",
      "dependencies": {
        "restore-cursor": "^4.0.0"
      },
      "engines": {
        "node": "^12.20.0 || ^14.13.1 || >=16.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/cli-highlight": {
      "version": "2.1.11",
      "resolved": "https://registry.npmjs.org/cli-highlight/-/cli-highlight-2.1.11.tgz",
      "integrity": "sha512-9KDcoEVwyUXrjcJNvHD0NFc/hiwe/WPVYIleQh2O1N2Zro5gWJZ/K+3DGn8w8P/F6FxOgzyC5bxDyHIgCSPhGg==",
      "license": "ISC",
      "dependencies": {
        "chalk": "^4.0.0",
        "highlight.js": "^10.7.1",
        "mz": "^2.4.0",
        "parse5": "^5.1.1",
        "parse5-htmlparser2-tree-adapter": "^6.0.0",
        "yargs": "^16.0.0"
      },
      "bin": {
        "highlight": "bin/highlight"
      },
      "engines": {
        "node": ">=8.0.0",
        "npm": ">=5.0.0"
      }
    },
    "node_modules/cli-highlight/node_modules/cliui": {
      "version": "7.0.4",
      "resolved": "https://registry.npmjs.org/cliui/-/cliui-7.0.4.tgz",
      "integrity": "sha512-OcRE68cOsVMXp1Yvonl/fzkQOyjLSu/8bhPDfQt0e0/Eb283TKP20Fs2MqoPsr9SwA595rRCA+QMzYc9nBP+JQ==",
      "license": "ISC",
      "dependencies": {
        "string-width": "^4.2.0",
        "strip-ansi": "^6.0.0",
        "wrap-ansi": "^7.0.0"
      }
    },
    "node_modules/cli-highlight/node_modules/yargs": {
      "version": "16.2.0",
      "resolved": "https://registry.npmjs.org/yargs/-/yargs-16.2.0.tgz",
      "integrity": "sha512-D1mvvtDG0L5ft/jGWkLpG1+m0eQxOfaBvTNELraWj22wSVUMWxZUvYgJYcKh6jGGIkJFhH4IZPQhR4TKpc8mBw==",
      "license": "MIT",
      "dependencies": {
        "cliui": "^7.0.2",
        "escalade": "^3.1.1",
        "get-caller-file": "^2.0.5",
        "require-directory": "^2.1.1",
        "string-width": "^4.2.0",
        "y18n": "^5.0.5",
        "yargs-parser": "^20.2.2"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/cli-highlight/node_modules/yargs-parser": {
      "version": "20.2.9",
      "resolved": "https://registry.npmjs.org/yargs-parser/-/yargs-parser-20.2.9.tgz",
      "integrity": "sha512-y11nGElTIV+CT3Zv9t7VKl+Q3hTQoT9a1Qzezhhl6Rp21gJ/IVTW7Z3y9EWXhuUBC2Shnf+DX0antecpAwSP8w==",
      "license": "ISC",
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/cli-spinners": {
      "version": "2.9.2",
      "resolved": "https://registry.npmjs.org/cli-spinners/-/cli-spinners-2.9.2.tgz",
      "integrity": "sha512-ywqV+5MmyL4E7ybXgKys4DugZbX0FC6LnwrhjuykIjnK9k8OQacQ7axGKnjDXWNhns0xot3bZI5h55H8yo9cJg==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/cli-table3": {
      "version": "0.6.5",
      "resolved": "https://registry.npmjs.org/cli-table3/-/cli-table3-0.6.5.tgz",
      "integrity": "sha512-+W/5efTR7y5HRD7gACw9yQjqMVvEMLBHmboM/kPWam+H+Hmyrgjh6YncVKK122YZkXrLudzTuAukUw9FnMf7IQ==",
      "license": "MIT",
      "dependencies": {
        "string-width": "^4.2.0"
      },
      "engines": {
        "node": "10.* || >= 12.*"
      },
      "optionalDependencies": {
        "@colors/colors": "1.5.0"
      }
    },
    "node_modules/cliui": {
      "version": "8.0.1",
      "resolved": "https://registry.npmjs.org/cliui/-/cliui-8.0.1.tgz",
      "integrity": "sha512-BSeNnyus75C4//NQ9gQt1/csTXyo/8Sb+afLAkzAptFuMsod9HFokGNudZpi/oQV73hnVK+sR+5PVRMd+Dr7YQ==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "string-width": "^4.2.0",
        "strip-ansi": "^6.0.1",
        "wrap-ansi": "^7.0.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/clone": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/clone/-/clone-1.0.4.tgz",
      "integrity": "sha512-JQHZ2QMW6l3aH/j6xCqQThY/9OH4D/9ls34cgkUBiEeocRTU04tHfKPBsUK1PqZCUQM7GiA0IIXJSuXHI64Kbg==",
      "license": "MIT",
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/co": {
      "version": "4.6.0",
      "resolved": "https://registry.npmjs.org/co/-/co-4.6.0.tgz",
      "integrity": "sha512-QVb0dM5HvG+uaxitm8wONl7jltx8dqhfU33DcqtOZcLSVIKSDDLDi7+0LbAKiyI8hD9u42m2YxXSkMGWThaecQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "iojs": ">= 1.0.0",
        "node": ">= 0.12.0"
      }
    },
    "node_modules/collect-v8-coverage": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/collect-v8-coverage/-/collect-v8-coverage-1.0.3.tgz",
      "integrity": "sha512-1L5aqIkwPfiodaMgQunkF1zRhNqifHBmtbbbxcr6yVxxBnliw4TDOW6NxpO8DJLgJ16OT+Y4ztZqP6p/FtXnAw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/color-convert": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/color-convert/-/color-convert-2.0.1.tgz",
      "integrity": "sha512-RRECPsj7iu/xb5oKYcsFHSppFNnsj/52OVTRKb4zP5onXwVF3zVmmToNcOfGC+CRDpfK/U584fMg38ZHCaElKQ==",
      "license": "MIT",
      "dependencies": {
        "color-name": "~1.1.4"
      },
      "engines": {
        "node": ">=7.0.0"
      }
    },
    "node_modules/color-name": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/color-name/-/color-name-1.1.4.tgz",
      "integrity": "sha512-dOy+3AuW3a2wNbZHIuMZpTcgjGuLU/uBL/ubcZF9OXbDo8ff4O8yVp5Bf0efS8uEoYo5q4Fx7dY9OgQGXgAsQA==",
      "license": "MIT"
    },
    "node_modules/combined-stream": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/combined-stream/-/combined-stream-1.0.8.tgz",
      "integrity": "sha512-FQN4MRfuJeHf7cBbBMJFXhKSDq+2kAArBlmRBvcvFE5BB1HZKXtSFASDhdlz9zOYwxh8lDdnvmMOe/+5cdoEdg==",
      "license": "MIT",
      "dependencies": {
        "delayed-stream": "~1.0.0"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/commander": {
      "version": "13.1.0",
      "resolved": "https://registry.npmjs.org/commander/-/commander-13.1.0.tgz",
      "integrity": "sha512-/rFeCpNJQbhSZjGVwO9RFV3xPqbnERS8MmIQzCtD/zl6gpJuV/bMLuN92oG3F7d8oDEHHRrujSXNUr8fpjntKw==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/concat-map": {
      "version": "0.0.1",
      "resolved": "https://registry.npmjs.org/concat-map/-/concat-map-0.0.1.tgz",
      "integrity": "sha512-/Srv4dswyQNBfohGpz9o6Yb3Gz3SrUDqBH5rTuhGR7ahtlbYKnVxw2bCFMRljaA7EXHaXZ8wsHdodFvbkhKmqg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/convert-source-map": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/convert-source-map/-/convert-source-map-2.0.0.tgz",
      "integrity": "sha512-Kvp459HrV2FEJ1CAsi1Ku+MY3kasH19TFykTz2xWmMeq6bk2NU3XXvfJ+Q61m0xktWwt+1HSYf3JZsTms3aRJg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/create-jest": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/create-jest/-/create-jest-29.7.0.tgz",
      "integrity": "sha512-Adz2bdH0Vq3F53KEMJOoftQFutWCukm6J24wbPWRO4k1kMY7gS7ds/uoJkNuV8wDCtWWnuwGcJwpWcih+zEW1Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jest/types": "^29.6.3",
        "chalk": "^4.0.0",
        "exit": "^0.1.2",
        "graceful-fs": "^4.2.9",
        "jest-config": "^29.7.0",
        "jest-util": "^29.7.0",
        "prompts": "^2.0.1"
      },
      "bin": {
        "create-jest": "bin/create-jest.js"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/create-require": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/create-require/-/create-require-1.1.1.tgz",
      "integrity": "sha512-dcKFX3jn0MpIaXjisoRvexIJVEKzaq7z2rZKxf+MSr9TkdmHmsU4m2lcLojrj/FHl8mk5VxMmYA+ftRkP/3oKQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/cross-spawn": {
      "version": "7.0.6",
      "resolved": "https://registry.npmjs.org/cross-spawn/-/cross-spawn-7.0.6.tgz",
      "integrity": "sha512-uV2QOWP2nWzsy2aMp8aRibhi9dlzF5Hgh5SHaB9OiTGEyDTiJJyx0uy51QXdyWbtAHNua4XJzUKca3OzKUd3vA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "path-key": "^3.1.0",
        "shebang-command": "^2.0.0",
        "which": "^2.0.1"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/debug": {
      "version": "4.4.3",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.3.tgz",
      "integrity": "sha512-RGwwWnwQvkVfavKVt22FGLw+xYSdzARwm0ru6DhTVA3umU5hZc28V3kO4stgYryrTlLpuvgI9GiijltAjNbcqA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.3"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/dedent": {
      "version": "1.7.0",
      "resolved": "https://registry.npmjs.org/dedent/-/dedent-1.7.0.tgz",
      "integrity": "sha512-HGFtf8yhuhGhqO07SV79tRp+br4MnbdjeVxotpn1QBl30pcLLCQjX5b2295ll0fv8RKDKsmWYrl05usHM9CewQ==",
      "dev": true,
      "license": "MIT",
      "peerDependencies": {
        "babel-plugin-macros": "^3.1.0"
      },
      "peerDependenciesMeta": {
        "babel-plugin-macros": {
          "optional": true
        }
      }
    },
    "node_modules/deepmerge": {
      "version": "4.3.1",
      "resolved": "https://registry.npmjs.org/deepmerge/-/deepmerge-4.3.1.tgz",
      "integrity": "sha512-3sUqbMEc77XqpdNO7FRyRog+eW3ph+GYCbj+rK+uYyRMuwsVy0rMiVtPn+QJlKFvWP/1PYpapqYn0Me2knFn+A==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/defaults": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/defaults/-/defaults-1.0.4.tgz",
      "integrity": "sha512-eFuaLoy/Rxalv2kr+lqMlUnrDWV+3j4pljOIJgLIhI058IQfWJ7vXhyEIHu+HtC738klGALYxOKDO0bQP3tg8A==",
      "license": "MIT",
      "dependencies": {
        "clone": "^1.0.2"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/delayed-stream": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/delayed-stream/-/delayed-stream-1.0.0.tgz",
      "integrity": "sha512-ZySD7Nf91aLB0RxL4KGrKHBXl7Eds1DAmEdcoVawXnLD7SDhpNgtuII2aAkg7a7QS41jxPSZ17p4VdGnMHk3MQ==",
      "license": "MIT",
      "engines": {
        "node": ">=0.4.0"
      }
    },
    "node_modules/detect-newline": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/detect-newline/-/detect-newline-3.1.0.tgz",
      "integrity": "sha512-TLz+x/vEXm/Y7P7wn1EJFNLxYpUD4TgMosxY6fAVJUnJMbupHBOncxyWUG9OpTaH9EBD7uFI5LfEgmMOc54DsA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/diff": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/diff/-/diff-4.0.2.tgz",
      "integrity": "sha512-58lmxKSA4BNyLz+HHMUzlOEpg09FV+ev6ZMe3vJihgdxzgcwZ8VoEEPmALCZG9LmqfVoNMMKpttIYTVG6uDY7A==",
      "dev": true,
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=0.3.1"
      }
    },
    "node_modules/diff-sequences": {
      "version": "29.6.3",
      "resolved": "https://registry.npmjs.org/diff-sequences/-/diff-sequences-29.6.3.tgz",
      "integrity": "sha512-EjePK1srD3P08o2j4f0ExnylqRs5B9tJjcp9t1krH2qRi8CCdsYfwe9JgSLurFBWwq4uOlipzfk5fHNvwFKr8Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/dunder-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/dunder-proto/-/dunder-proto-1.0.1.tgz",
      "integrity": "sha512-KIN/nDJBQRcXw0MLVhZE9iQHmG68qAVIBg9CqmUYjmQIhgij9U5MFvrqkUL5FbtyyzZuOeOt0zdeRe4UY7ct+A==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.1",
        "es-errors": "^1.3.0",
        "gopd": "^1.2.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/electron-to-chromium": {
      "version": "1.5.262",
      "resolved": "https://registry.npmjs.org/electron-to-chromium/-/electron-to-chromium-1.5.262.tgz",
      "integrity": "sha512-NlAsMteRHek05jRUxUR0a5jpjYq9ykk6+kO0yRaMi5moe7u0fVIOeQ3Y30A8dIiWFBNUoQGi1ljb1i5VtS9WQQ==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/emittery": {
      "version": "0.13.1",
      "resolved": "https://registry.npmjs.org/emittery/-/emittery-0.13.1.tgz",
      "integrity": "sha512-DeWwawk6r5yR9jFgnDKYt4sLS0LmHJJi3ZOnb5/JdbYwj3nW+FxQnHIjhBKz8YLC7oRNPVM9NQ47I3CVx34eqQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sindresorhus/emittery?sponsor=1"
      }
    },
    "node_modules/emoji-regex": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-8.0.0.tgz",
      "integrity": "sha512-MSjYzcWNOA0ewAHpz0MxpYFvwg6yjy1NG3xteoqz644VCo/RPgnr1/GGt+ic3iJTzQ8Eu3TdM14SawnVUmGE6A==",
      "license": "MIT"
    },
    "node_modules/emojilib": {
      "version": "2.4.0",
      "resolved": "https://registry.npmjs.org/emojilib/-/emojilib-2.4.0.tgz",
      "integrity": "sha512-5U0rVMU5Y2n2+ykNLQqMoqklN9ICBT/KsvC1Gz6vqHbz2AXXGkG+Pm5rMWk/8Vjrr/mY9985Hi8DYzn1F09Nyw==",
      "license": "MIT"
    },
    "node_modules/environment": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/environment/-/environment-1.1.0.tgz",
      "integrity": "sha512-xUtoPkMggbz0MPyPiIWr1Kp4aeWJjDZ6SMvURhimjdZgsRuDplF5/s9hcgGhyXMhs+6vpnuoiZ2kFiu3FMnS8Q==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/error-ex": {
      "version": "1.3.4",
      "resolved": "https://registry.npmjs.org/error-ex/-/error-ex-1.3.4.tgz",
      "integrity": "sha512-sqQamAnR14VgCr1A618A3sGrygcpK+HEbenA/HiEAkkUwcZIIB/tgWqHFxWgOyDh4nB4JCRimh79dR5Ywc9MDQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-arrayish": "^0.2.1"
      }
    },
    "node_modules/es-define-property": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/es-define-property/-/es-define-property-1.0.1.tgz",
      "integrity": "sha512-e3nRfgfUZ4rNGL232gUgX06QNyyez04KdjFrF+LTRoOXmrOgFKDg4BCdsjW8EnT69eqdYGmRpJwiPVYNrCaW3g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-errors": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/es-errors/-/es-errors-1.3.0.tgz",
      "integrity": "sha512-Zf5H2Kxt2xjTvbJvP2ZWLEICxA6j+hAmMzIlypy4xcBg1vKVnx89Wy0GbS+kf5cwCVFFzdCFh2XSCFNULS6csw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-object-atoms": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/es-object-atoms/-/es-object-atoms-1.1.1.tgz",
      "integrity": "sha512-FGgH2h8zKNim9ljj7dankFPcICIK9Cp5bm+c2gQSYePhpaG5+esrLODihIorn+Pe6FGJzWhXQotPv73jTaldXA==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-set-tostringtag": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/es-set-tostringtag/-/es-set-tostringtag-2.1.0.tgz",
      "integrity": "sha512-j6vWzfrGVfyXxge+O0x5sh6cvxAog0a/4Rdd2K36zCMV5eJ+/+tOAngRO8cODMNWbVRdVlmGZQL2YS3yR8bIUA==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.6",
        "has-tostringtag": "^1.0.2",
        "hasown": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/escalade": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/escalade/-/escalade-3.2.0.tgz",
      "integrity": "sha512-WUj2qlxaQtO4g6Pq5c29GTcWGDyd8itL8zTlipgECz3JesAiiOKotd8JU6otB3PACgG6xkJUyVhboMS+bje/jA==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/escape-string-regexp": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-2.0.0.tgz",
      "integrity": "sha512-UpzcLCXolUWcNu5HtVMHYdXJjArjsF9C0aNnquZYY4uW/Vu0miy5YoWvbV345HauVvcAUnpRuhMMcqTcGOY2+w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/esprima": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/esprima/-/esprima-4.0.1.tgz",
      "integrity": "sha512-eGuFFw7Upda+g4p+QHvnW0RyTX/SVeJBDM/gCtMARO0cLuT2HcEKnTPvhjV6aGeqrCB/sbNop0Kszm0jsaWU4A==",
      "dev": true,
      "license": "BSD-2-Clause",
      "bin": {
        "esparse": "bin/esparse.js",
        "esvalidate": "bin/esvalidate.js"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/execa": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/execa/-/execa-5.1.1.tgz",
      "integrity": "sha512-8uSpZZocAZRBAPIEINJj3Lo9HyGitllczc27Eh5YYojjMFMn8yHMDMaUHE2Jqfq05D/wucwI4JGURyXt1vchyg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "cross-spawn": "^7.0.3",
        "get-stream": "^6.0.0",
        "human-signals": "^2.1.0",
        "is-stream": "^2.0.0",
        "merge-stream": "^2.0.0",
        "npm-run-path": "^4.0.1",
        "onetime": "^5.1.2",
        "signal-exit": "^3.0.3",
        "strip-final-newline": "^2.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sindresorhus/execa?sponsor=1"
      }
    },
    "node_modules/exit": {
      "version": "0.1.2",
      "resolved": "https://registry.npmjs.org/exit/-/exit-0.1.2.tgz",
      "integrity": "sha512-Zk/eNKV2zbjpKzrsQ+n1G6poVbErQxJ0LBOJXaKZ1EViLzH+hrLu9cdXI4zw9dBQJslwBEpbQ2P1oS7nDxs6jQ==",
      "dev": true,
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/expect": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/expect/-/expect-29.7.0.tgz",
      "integrity": "sha512-2Zks0hf1VLFYI1kbh0I5jP3KHHyCHpkfyHBzsSXRFgl/Bg9mWYfMW8oD+PdMPlEwy5HNsR9JutYy6pMeOh61nw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jest/expect-utils": "^29.7.0",
        "jest-get-type": "^29.6.3",
        "jest-matcher-utils": "^29.7.0",
        "jest-message-util": "^29.7.0",
        "jest-util": "^29.7.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/fast-json-stable-stringify": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/fast-json-stable-stringify/-/fast-json-stable-stringify-2.1.0.tgz",
      "integrity": "sha512-lhd/wF+Lk98HZoTCtlVraHtfh5XYijIjalXck7saUtuanSDyLMxnHhSXEDJqHxD7msR8D0uCmqlkwjCV8xvwHw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/fb-watchman": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/fb-watchman/-/fb-watchman-2.0.2.tgz",
      "integrity": "sha512-p5161BqbuCaSnB8jIbzQHOlpgsPmK5rJVDfDKO91Axs5NC1uu3HRQm6wt9cd9/+GtQQIO53JdGXXoyDpTAsgYA==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "bser": "2.1.1"
      }
    },
    "node_modules/fill-range": {
      "version": "7.1.1",
      "resolved": "https://registry.npmjs.org/fill-range/-/fill-range-7.1.1.tgz",
      "integrity": "sha512-YsGpe3WHLK8ZYi4tWDg2Jy3ebRz2rXowDxnld4bkQB00cc/1Zw9AWnC0i9ztDJitivtQvaI9KaLyKrc+hBW0yg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "to-regex-range": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/find-up": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/find-up/-/find-up-4.1.0.tgz",
      "integrity": "sha512-PpOwAdQ/YlXQ2vj8a3h8IipDuYRi3wceVQQGYWxNINccq40Anw7BlsEXCMbt1Zt+OLA6Fq9suIpIWD0OsnISlw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "locate-path": "^5.0.0",
        "path-exists": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/follow-redirects": {
      "version": "1.15.11",
      "resolved": "https://registry.npmjs.org/follow-redirects/-/follow-redirects-1.15.11.tgz",
      "integrity": "sha512-deG2P0JfjrTxl50XGCDyfI97ZGVCxIpfKYmfyrQ54n5FO/0gfIES8C/Psl6kWVDolizcaaxZJnTS0QSMxvnsBQ==",
      "funding": [
        {
          "type": "individual",
          "url": "https://github.com/sponsors/RubenVerborgh"
        }
      ],
      "license": "MIT",
      "engines": {
        "node": ">=4.0"
      },
      "peerDependenciesMeta": {
        "debug": {
          "optional": true
        }
      }
    },
    "node_modules/form-data": {
      "version": "4.0.5",
      "resolved": "https://registry.npmjs.org/form-data/-/form-data-4.0.5.tgz",
      "integrity": "sha512-8RipRLol37bNs2bhoV67fiTEvdTrbMUYcFTiy3+wuuOnUog2QBHCZWXDRijWQfAkhBj2Uf5UnVaiWwA5vdd82w==",
      "license": "MIT",
      "dependencies": {
        "asynckit": "^0.4.0",
        "combined-stream": "^1.0.8",
        "es-set-tostringtag": "^2.1.0",
        "hasown": "^2.0.2",
        "mime-types": "^2.1.12"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/fs.realpath": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/fs.realpath/-/fs.realpath-1.0.0.tgz",
      "integrity": "sha512-OO0pH2lK6a0hZnAdau5ItzHPI6pUlvI7jMVnxUQRtw4owF2wk8lOSabtGDCTP4Ggrg2MbGnWO9X8K1t4+fGMDw==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/fsevents": {
      "version": "2.3.3",
      "resolved": "https://registry.npmjs.org/fsevents/-/fsevents-2.3.3.tgz",
      "integrity": "sha512-5xoDfX+fL7faATnagmWPpbFtwh/R77WmMMqqHGS65C3vvB0YHrgF+B1YmZ3441tMj5n63k0212XNoJwzlhffQw==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^8.16.0 || ^10.6.0 || >=11.0.0"
      }
    },
    "node_modules/function-bind": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/function-bind/-/function-bind-1.1.2.tgz",
      "integrity": "sha512-7XHNxH7qX9xG5mIwxkhumTox/MIRNcOgDrxWsMt2pAr23WHp6MrRlN7FBSFpCpr+oVO0F744iUgR82nJMfG2SA==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/gensync": {
      "version": "1.0.0-beta.2",
      "resolved": "https://registry.npmjs.org/gensync/-/gensync-1.0.0-beta.2.tgz",
      "integrity": "sha512-3hN7NaskYvMDLQY55gnW3NQ+mesEAepTqlg+VEbj7zzqEMBVNhzcGYYeqFo/TlYz6eQiFcp1HcsCZO+nGgS8zg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/get-caller-file": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/get-caller-file/-/get-caller-file-2.0.5.tgz",
      "integrity": "sha512-DyFP3BM/3YHTQOCUL/w0OZHR0lpKeGrxotcHWcqNEdnltqFwXVfhEBQ94eIo34AfQpo0rGki4cyIiftY06h2Fg==",
      "license": "ISC",
      "engines": {
        "node": "6.* || 8.* || >= 10.*"
      }
    },
    "node_modules/get-intrinsic": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/get-intrinsic/-/get-intrinsic-1.3.0.tgz",
      "integrity": "sha512-9fSjSaos/fRIVIp+xSJlE6lfwhES7LNtKaCBIamHsjr2na1BiABJPo0mOjjz8GJDURarmCPGqaiVg5mfjb98CQ==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "es-define-property": "^1.0.1",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.1",
        "function-bind": "^1.1.2",
        "get-proto": "^1.0.1",
        "gopd": "^1.2.0",
        "has-symbols": "^1.1.0",
        "hasown": "^2.0.2",
        "math-intrinsics": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-package-type": {
      "version": "0.1.0",
      "resolved": "https://registry.npmjs.org/get-package-type/-/get-package-type-0.1.0.tgz",
      "integrity": "sha512-pjzuKtY64GYfWizNAJ0fr9VqttZkNiK2iS430LtIHzjBEr6bX8Am2zm4sW4Ro5wjWW5cAlRL1qAMTcXbjNAO2Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8.0.0"
      }
    },
    "node_modules/get-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/get-proto/-/get-proto-1.0.1.tgz",
      "integrity": "sha512-sTSfBjoXBp89JvIKIefqw7U2CCebsc74kiY6awiGogKtoSGbgjYE/G/+l9sF3MWFPNc9IcoOC4ODfKHfxFmp0g==",
      "license": "MIT",
      "dependencies": {
        "dunder-proto": "^1.0.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/get-stream": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/get-stream/-/get-stream-6.0.1.tgz",
      "integrity": "sha512-ts6Wi+2j3jQjqi70w5AlN8DFnkSwC+MqmxEzdEALB2qXZYV3X/b1CTfgPLGJNMeAWxdPfU8FO1ms3NUfaHCPYg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/glob": {
      "version": "7.2.3",
      "resolved": "https://registry.npmjs.org/glob/-/glob-7.2.3.tgz",
      "integrity": "sha512-nFR0zLpU2YCaRxwoCJvL6UvCH2JFyFVIvwTLsIf21AuHlMskA1hhTdk+LlYJtOlYt9v6dvszD2BGRqBL+iQK9Q==",
      "deprecated": "Glob versions prior to v9 are no longer supported",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "fs.realpath": "^1.0.0",
        "inflight": "^1.0.4",
        "inherits": "2",
        "minimatch": "^3.1.1",
        "once": "^1.3.0",
        "path-is-absolute": "^1.0.0"
      },
      "engines": {
        "node": "*"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/gopd": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/gopd/-/gopd-1.2.0.tgz",
      "integrity": "sha512-ZUKRh6/kUFoAiTAtTYPZJ3hw9wNxx+BIBOijnlG9PnrJsCcSjs1wyyD6vJpaYtgnzDrKYRSqf3OO6Rfa93xsRg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/graceful-fs": {
      "version": "4.2.11",
      "resolved": "https://registry.npmjs.org/graceful-fs/-/graceful-fs-4.2.11.tgz",
      "integrity": "sha512-RbJ5/jmFcNNCcDV5o9eTnBLJ/HszWV0P73bc+Ff4nS/rJj+YaS6IGyiOL0VoBYX+l1Wrl3k63h/KrH+nhJ0XvQ==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/has-flag": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/has-flag/-/has-flag-4.0.0.tgz",
      "integrity": "sha512-EykJT/Q1KjTWctppgIAgfSO0tKVuZUjhgMr17kqTumMl6Afv3EISleU7qZUzoXDFTAHTDC4NOoG/ZxU3EvlMPQ==",
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/has-symbols": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/has-symbols/-/has-symbols-1.1.0.tgz",
      "integrity": "sha512-1cDNdwJ2Jaohmb3sg4OmKaMBwuC48sYni5HUw2DvsC8LjGTLK9h+eb1X6RyuOHe4hT0ULCW68iomhjUoKUqlPQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-tostringtag": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/has-tostringtag/-/has-tostringtag-1.0.2.tgz",
      "integrity": "sha512-NqADB8VjPFLM2V0VvHUewwwsw0ZWBaIdgo+ieHtK3hasLz4qeCRjYcqfB6AQrBggRKppKF8L52/VqdVsO47Dlw==",
      "license": "MIT",
      "dependencies": {
        "has-symbols": "^1.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/hasown": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/hasown/-/hasown-2.0.2.tgz",
      "integrity": "sha512-0hJU9SCPvmMzIBdZFqNPXWa6dqh7WdH0cII9y+CyS8rG3nL48Bclra9HmKhVVUHyPWNH5Y7xDwAB7bfgSjkUMQ==",
      "license": "MIT",
      "dependencies": {
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/highlight.js": {
      "version": "10.7.3",
      "resolved": "https://registry.npmjs.org/highlight.js/-/highlight.js-10.7.3.tgz",
      "integrity": "sha512-tzcUFauisWKNHaRkN4Wjl/ZA07gENAjFl3J/c480dprkGTg5EQstgaNFqBfUqCq54kZRIEcreTsAgF/m2quD7A==",
      "license": "BSD-3-Clause",
      "engines": {
        "node": "*"
      }
    },
    "node_modules/html-escaper": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/html-escaper/-/html-escaper-2.0.2.tgz",
      "integrity": "sha512-H2iMtd0I4Mt5eYiapRdIDjp+XzelXQ0tFE4JS7YFwFevXXMmOp9myNrUvCg0D6ws8iqkRPBfKHgbwig1SmlLfg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/human-signals": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/human-signals/-/human-signals-2.1.0.tgz",
      "integrity": "sha512-B4FFZ6q/T2jhhksgkbEW3HBvWIfDW85snkQgawt07S7J5QXTk6BkNV+0yAeZrM5QpMAdYlocGoljn0sJ/WQkFw==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=10.17.0"
      }
    },
    "node_modules/ieee754": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/ieee754/-/ieee754-1.2.1.tgz",
      "integrity": "sha512-dcyqhDvX1C46lXZcVqCpK+FtMRQVdIMN6/Df5js2zouUsqG7I6sFxitIC+7KYK29KdXOLHdu9zL4sFnoVQnqaA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "BSD-3-Clause"
    },
    "node_modules/import-local": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/import-local/-/import-local-3.2.0.tgz",
      "integrity": "sha512-2SPlun1JUPWoM6t3F0dw0FkCF/jWY8kttcY4f599GLTSjh2OCuuhdTkJQsEcZzBqbXZGKMK2OqW1oZsjtf/gQA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "pkg-dir": "^4.2.0",
        "resolve-cwd": "^3.0.0"
      },
      "bin": {
        "import-local-fixture": "fixtures/cli.js"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/imurmurhash": {
      "version": "0.1.4",
      "resolved": "https://registry.npmjs.org/imurmurhash/-/imurmurhash-0.1.4.tgz",
      "integrity": "sha512-JmXMZ6wuvDmLiHEml9ykzqO6lwFbof0GG4IkcGaENdCRDDmMVnny7s5HsIgHCbaq0w2MyPhDqkhTUgS2LU2PHA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.8.19"
      }
    },
    "node_modules/inflight": {
      "version": "1.0.6",
      "resolved": "https://registry.npmjs.org/inflight/-/inflight-1.0.6.tgz",
      "integrity": "sha512-k92I/b08q4wvFscXCLvqfsHCrjrF7yiXsQuIVvVE7N82W3+aqpzuUdBbfhWcy/FZR3/4IgflMgKLOsvPDrGCJA==",
      "deprecated": "This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "once": "^1.3.0",
        "wrappy": "1"
      }
    },
    "node_modules/inherits": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/inherits/-/inherits-2.0.4.tgz",
      "integrity": "sha512-k/vGaX4/Yla3WzyMCvTQOXYeIHvqOKtnqBduzTHpzpQZzAskKMhZ2K+EnBiSM9zGSoIFeMpXKxa4dYeZIQqewQ==",
      "license": "ISC"
    },
    "node_modules/is-arrayish": {
      "version": "0.2.1",
      "resolved": "https://registry.npmjs.org/is-arrayish/-/is-arrayish-0.2.1.tgz",
      "integrity": "sha512-zz06S8t0ozoDXMG+ube26zeCTNXcKIPJZJi8hBrF4idCLms4CG9QtK7qBl1boi5ODzFpjswb5JPmHCbMpjaYzg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/is-core-module": {
      "version": "2.16.1",
      "resolved": "https://registry.npmjs.org/is-core-module/-/is-core-module-2.16.1.tgz",
      "integrity": "sha512-UfoeMA6fIJ8wTYFEUjelnaGI67v6+N7qXJEvQuIGa99l4xsCruSYOVSQ0uPANn4dAzm8lkYPaKLrrijLq7x23w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "hasown": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-fullwidth-code-point": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/is-fullwidth-code-point/-/is-fullwidth-code-point-3.0.0.tgz",
      "integrity": "sha512-zymm5+u+sCsSWyD9qNaejV3DFvhCKclKdizYaJUuHA83RLjb7nSuGnddCHGv0hk+KY7BMAlsWeK4Ueg6EV6XQg==",
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/is-generator-fn": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/is-generator-fn/-/is-generator-fn-2.1.0.tgz",
      "integrity": "sha512-cTIB4yPYL/Grw0EaSzASzg6bBy9gqCofvWN8okThAYIxKJZC+udlRAmGbM0XLeniEJSs8uEgHPGuHSe1XsOLSQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/is-interactive": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/is-interactive/-/is-interactive-2.0.0.tgz",
      "integrity": "sha512-qP1vozQRI+BMOPcjFzrjXuQvdak2pHNUMZoeG2eRbiSqyvbEf/wQtEOTOX1guk6E3t36RkaqiSt8A/6YElNxLQ==",
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/is-number": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/is-number/-/is-number-7.0.0.tgz",
      "integrity": "sha512-41Cifkg6e8TylSpdtTpeLVMqvSBEVzTttHvERD741+pnZ8ANv0004MRL43QKPDlK9cGvNp6NZWZUBlbGXYxxng==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.12.0"
      }
    },
    "node_modules/is-stream": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/is-stream/-/is-stream-2.0.1.tgz",
      "integrity": "sha512-hFoiJiTl63nn+kstHGBtewWSKnQLpyb155KHheA1l39uvtO9nWIop1p3udqPcUd/xbF1VLMO4n7OI6p7RbngDg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/is-unicode-supported": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/is-unicode-supported/-/is-unicode-supported-1.3.0.tgz",
      "integrity": "sha512-43r2mRvz+8JRIKnWJ+3j8JtjRKZ6GmjzfaE/qiBJnikNnYv/6bagRJ1kUhNk8R5EX/GkobD+r+sfxCPJsiKBLQ==",
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/isexe": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/isexe/-/isexe-2.0.0.tgz",
      "integrity": "sha512-RHxMLp9lnKHGHRng9QFhRCMbYAcVpn69smSGcq3f36xjgVVWThj4qqLbTLlq7Ssj8B+fIQ1EuCEGI2lKsyQeIw==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/istanbul-lib-coverage": {
      "version": "3.2.2",
      "resolved": "https://registry.npmjs.org/istanbul-lib-coverage/-/istanbul-lib-coverage-3.2.2.tgz",
      "integrity": "sha512-O8dpsF+r0WV/8MNRKfnmrtCWhuKjxrq2w+jpzBL5UZKTi2LeVWnWOmWRxFlesJONmc+wLAGvKQZEOanko0LFTg==",
      "dev": true,
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/istanbul-lib-instrument": {
      "version": "6.0.3",
      "resolved": "https://registry.npmjs.org/istanbul-lib-instrument/-/istanbul-lib-instrument-6.0.3.tgz",
      "integrity": "sha512-Vtgk7L/R2JHyyGW07spoFlB8/lpjiOLTjMdms6AFMraYt3BaJauod/NGrfnVG/y4Ix1JEuMRPDPEj2ua+zz1/Q==",
      "dev": true,
      "license": "BSD-3-Clause",
      "dependencies": {
        "@babel/core": "^7.23.9",
        "@babel/parser": "^7.23.9",
        "@istanbuljs/schema": "^0.1.3",
        "istanbul-lib-coverage": "^3.2.0",
        "semver": "^7.5.4"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/istanbul-lib-instrument/node_modules/semver": {
      "version": "7.7.3",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.7.3.tgz",
      "integrity": "sha512-SdsKMrI9TdgjdweUSR9MweHA4EJ8YxHn8DFaDisvhVlUOe4BF1tLD7GAj0lIqWVl+dPb/rExr0Btby5loQm20Q==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/istanbul-lib-report": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/istanbul-lib-report/-/istanbul-lib-report-3.0.1.tgz",
      "integrity": "sha512-GCfE1mtsHGOELCU8e/Z7YWzpmybrx/+dSTfLrvY8qRmaY6zXTKWn6WQIjaAFw069icm6GVMNkgu0NzI4iPZUNw==",
      "dev": true,
      "license": "BSD-3-Clause",
      "dependencies": {
        "istanbul-lib-coverage": "^3.0.0",
        "make-dir": "^4.0.0",
        "supports-color": "^7.1.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/istanbul-lib-source-maps": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/istanbul-lib-source-maps/-/istanbul-lib-source-maps-4.0.1.tgz",
      "integrity": "sha512-n3s8EwkdFIJCG3BPKBYvskgXGoy88ARzvegkitk60NxRdwltLOTaH7CUiMRXvwYorl0Q712iEjcWB+fK/MrWVw==",
      "dev": true,
      "license": "BSD-3-Clause",
      "dependencies": {
        "debug": "^4.1.1",
        "istanbul-lib-coverage": "^3.0.0",
        "source-map": "^0.6.1"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/istanbul-reports": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/istanbul-reports/-/istanbul-reports-3.2.0.tgz",
      "integrity": "sha512-HGYWWS/ehqTV3xN10i23tkPkpH46MLCIMFNCaaKNavAXTF1RkqxawEPtnjnGZ6XKSInBKkiOA5BKS+aZiY3AvA==",
      "dev": true,
      "license": "BSD-3-Clause",
      "dependencies": {
        "html-escaper": "^2.0.0",
        "istanbul-lib-report": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/jest": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest/-/jest-29.7.0.tgz",
      "integrity": "sha512-NIy3oAFp9shda19hy4HK0HRTWKtPJmGdnvywu01nOqNC2vZg+Z+fvJDxpMQA88eb2I9EcafcdjYgsDthnYTvGw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jest/core": "^29.7.0",
        "@jest/types": "^29.6.3",
        "import-local": "^3.0.2",
        "jest-cli": "^29.7.0"
      },
      "bin": {
        "jest": "bin/jest.js"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      },
      "peerDependencies": {
        "node-notifier": "^8.0.1 || ^9.0.0 || ^10.0.0"
      },
      "peerDependenciesMeta": {
        "node-notifier": {
          "optional": true
        }
      }
    },
    "node_modules/jest-changed-files": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-changed-files/-/jest-changed-files-29.7.0.tgz",
      "integrity": "sha512-fEArFiwf1BpQ+4bXSprcDc3/x4HSzL4al2tozwVpDFpsxALjLYdyiIK4e5Vz66GQJIbXJ82+35PtysofptNX2w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "execa": "^5.0.0",
        "jest-util": "^29.7.0",
        "p-limit": "^3.1.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-circus": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-circus/-/jest-circus-29.7.0.tgz",
      "integrity": "sha512-3E1nCMgipcTkCocFwM90XXQab9bS+GMsjdpmPrlelaxwD93Ad8iVEjX/vvHPdLPnFf+L40u+5+iutRdA1N9myw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jest/environment": "^29.7.0",
        "@jest/expect": "^29.7.0",
        "@jest/test-result": "^29.7.0",
        "@jest/types": "^29.6.3",
        "@types/node": "*",
        "chalk": "^4.0.0",
        "co": "^4.6.0",
        "dedent": "^1.0.0",
        "is-generator-fn": "^2.0.0",
        "jest-each": "^29.7.0",
        "jest-matcher-utils": "^29.7.0",
        "jest-message-util": "^29.7.0",
        "jest-runtime": "^29.7.0",
        "jest-snapshot": "^29.7.0",
        "jest-util": "^29.7.0",
        "p-limit": "^3.1.0",
        "pretty-format": "^29.7.0",
        "pure-rand": "^6.0.0",
        "slash": "^3.0.0",
        "stack-utils": "^2.0.3"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-cli": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-cli/-/jest-cli-29.7.0.tgz",
      "integrity": "sha512-OVVobw2IubN/GSYsxETi+gOe7Ka59EFMR/twOU3Jb2GnKKeMGJB5SGUUrEz3SFVmJASUdZUzy83sLNNQ2gZslg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jest/core": "^29.7.0",
        "@jest/test-result": "^29.7.0",
        "@jest/types": "^29.6.3",
        "chalk": "^4.0.0",
        "create-jest": "^29.7.0",
        "exit": "^0.1.2",
        "import-local": "^3.0.2",
        "jest-config": "^29.7.0",
        "jest-util": "^29.7.0",
        "jest-validate": "^29.7.0",
        "yargs": "^17.3.1"
      },
      "bin": {
        "jest": "bin/jest.js"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      },
      "peerDependencies": {
        "node-notifier": "^8.0.1 || ^9.0.0 || ^10.0.0"
      },
      "peerDependenciesMeta": {
        "node-notifier": {
          "optional": true
        }
      }
    },
    "node_modules/jest-config": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-config/-/jest-config-29.7.0.tgz",
      "integrity": "sha512-uXbpfeQ7R6TZBqI3/TxCU4q4ttk3u0PJeC+E0zbfSoSjq6bJ7buBPxzQPL0ifrkY4DNu4JUdk0ImlBUYi840eQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/core": "^7.11.6",
        "@jest/test-sequencer": "^29.7.0",
        "@jest/types": "^29.6.3",
        "babel-jest": "^29.7.0",
        "chalk": "^4.0.0",
        "ci-info": "^3.2.0",
        "deepmerge": "^4.2.2",
        "glob": "^7.1.3",
        "graceful-fs": "^4.2.9",
        "jest-circus": "^29.7.0",
        "jest-environment-node": "^29.7.0",
        "jest-get-type": "^29.6.3",
        "jest-regex-util": "^29.6.3",
        "jest-resolve": "^29.7.0",
        "jest-runner": "^29.7.0",
        "jest-util": "^29.7.0",
        "jest-validate": "^29.7.0",
        "micromatch": "^4.0.4",
        "parse-json": "^5.2.0",
        "pretty-format": "^29.7.0",
        "slash": "^3.0.0",
        "strip-json-comments": "^3.1.1"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      },
      "peerDependencies": {
        "@types/node": "*",
        "ts-node": ">=9.0.0"
      },
      "peerDependenciesMeta": {
        "@types/node": {
          "optional": true
        },
        "ts-node": {
          "optional": true
        }
      }
    },
    "node_modules/jest-diff": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-diff/-/jest-diff-29.7.0.tgz",
      "integrity": "sha512-LMIgiIrhigmPrs03JHpxUh2yISK3vLFPkAodPeo0+BuF7wA2FoQbkEg1u8gBYBThncu7e1oEDUfIXVuTqLRUjw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "chalk": "^4.0.0",
        "diff-sequences": "^29.6.3",
        "jest-get-type": "^29.6.3",
        "pretty-format": "^29.7.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-docblock": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-docblock/-/jest-docblock-29.7.0.tgz",
      "integrity": "sha512-q617Auw3A612guyaFgsbFeYpNP5t2aoUNLwBUbc/0kD1R4t9ixDbyFTHd1nok4epoVFpr7PmeWHrhvuV3XaJ4g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "detect-newline": "^3.0.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-each": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-each/-/jest-each-29.7.0.tgz",
      "integrity": "sha512-gns+Er14+ZrEoC5fhOfYCY1LOHHr0TI+rQUHZS8Ttw2l7gl+80eHc/gFf2Ktkw0+SIACDTeWvpFcv3B04VembQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jest/types": "^29.6.3",
        "chalk": "^4.0.0",
        "jest-get-type": "^29.6.3",
        "jest-util": "^29.7.0",
        "pretty-format": "^29.7.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-environment-node": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-environment-node/-/jest-environment-node-29.7.0.tgz",
      "integrity": "sha512-DOSwCRqXirTOyheM+4d5YZOrWcdu0LNZ87ewUoywbcb2XR4wKgqiG8vNeYwhjFMbEkfju7wx2GYH0P2gevGvFw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jest/environment": "^29.7.0",
        "@jest/fake-timers": "^29.7.0",
        "@jest/types": "^29.6.3",
        "@types/node": "*",
        "jest-mock": "^29.7.0",
        "jest-util": "^29.7.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-get-type": {
      "version": "29.6.3",
      "resolved": "https://registry.npmjs.org/jest-get-type/-/jest-get-type-29.6.3.tgz",
      "integrity": "sha512-zrteXnqYxfQh7l5FHyL38jL39di8H8rHoecLH3JNxH3BwOrBsNeabdap5e0I23lD4HHI8W5VFBZqG4Eaq5LNcw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-haste-map": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-haste-map/-/jest-haste-map-29.7.0.tgz",
      "integrity": "sha512-fP8u2pyfqx0K1rGn1R9pyE0/KTn+G7PxktWidOBTqFPLYX0b9ksaMFkhK5vrS3DVun09pckLdlx90QthlW7AmA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jest/types": "^29.6.3",
        "@types/graceful-fs": "^4.1.3",
        "@types/node": "*",
        "anymatch": "^3.0.3",
        "fb-watchman": "^2.0.0",
        "graceful-fs": "^4.2.9",
        "jest-regex-util": "^29.6.3",
        "jest-util": "^29.7.0",
        "jest-worker": "^29.7.0",
        "micromatch": "^4.0.4",
        "walker": "^1.0.8"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      },
      "optionalDependencies": {
        "fsevents": "^2.3.2"
      }
    },
    "node_modules/jest-leak-detector": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-leak-detector/-/jest-leak-detector-29.7.0.tgz",
      "integrity": "sha512-kYA8IJcSYtST2BY9I+SMC32nDpBT3J2NvWJx8+JCuCdl/CR1I4EKUJROiP8XtCcxqgTTBGJNdbB1A8XRKbTetw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "jest-get-type": "^29.6.3",
        "pretty-format": "^29.7.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-matcher-utils": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-matcher-utils/-/jest-matcher-utils-29.7.0.tgz",
      "integrity": "sha512-sBkD+Xi9DtcChsI3L3u0+N0opgPYnCRPtGcQYrgXmR+hmt/fYfWAL0xRXYU8eWOdfuLgBe0YCW3AFtnRLagq/g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "chalk": "^4.0.0",
        "jest-diff": "^29.7.0",
        "jest-get-type": "^29.6.3",
        "pretty-format": "^29.7.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-message-util": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-message-util/-/jest-message-util-29.7.0.tgz",
      "integrity": "sha512-GBEV4GRADeP+qtB2+6u61stea8mGcOT4mCtrYISZwfu9/ISHFJ/5zOMXYbpBE9RsS5+Gb63DW4FgmnKJ79Kf6w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.12.13",
        "@jest/types": "^29.6.3",
        "@types/stack-utils": "^2.0.0",
        "chalk": "^4.0.0",
        "graceful-fs": "^4.2.9",
        "micromatch": "^4.0.4",
        "pretty-format": "^29.7.0",
        "slash": "^3.0.0",
        "stack-utils": "^2.0.3"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-mock": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-mock/-/jest-mock-29.7.0.tgz",
      "integrity": "sha512-ITOMZn+UkYS4ZFh83xYAOzWStloNzJFO2s8DWrE4lhtGD+AorgnbkiKERe4wQVBydIGPx059g6riW5Btp6Llnw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jest/types": "^29.6.3",
        "@types/node": "*",
        "jest-util": "^29.7.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-pnp-resolver": {
      "version": "1.2.3",
      "resolved": "https://registry.npmjs.org/jest-pnp-resolver/-/jest-pnp-resolver-1.2.3.tgz",
      "integrity": "sha512-+3NpwQEnRoIBtx4fyhblQDPgJI0H1IEIkX7ShLUjPGA7TtUTvI1oiKi3SR4oBR0hQhQR80l4WAe5RrXBwWMA8w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      },
      "peerDependencies": {
        "jest-resolve": "*"
      },
      "peerDependenciesMeta": {
        "jest-resolve": {
          "optional": true
        }
      }
    },
    "node_modules/jest-regex-util": {
      "version": "29.6.3",
      "resolved": "https://registry.npmjs.org/jest-regex-util/-/jest-regex-util-29.6.3.tgz",
      "integrity": "sha512-KJJBsRCyyLNWCNBOvZyRDnAIfUiRJ8v+hOBQYGn8gDyF3UegwiP4gwRR3/SDa42g1YbVycTidUF3rKjyLFDWbg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-resolve": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-resolve/-/jest-resolve-29.7.0.tgz",
      "integrity": "sha512-IOVhZSrg+UvVAshDSDtHyFCCBUl/Q3AAJv8iZ6ZjnZ74xzvwuzLXid9IIIPgTnY62SJjfuupMKZsZQRsCvxEgA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "chalk": "^4.0.0",
        "graceful-fs": "^4.2.9",
        "jest-haste-map": "^29.7.0",
        "jest-pnp-resolver": "^1.2.2",
        "jest-util": "^29.7.0",
        "jest-validate": "^29.7.0",
        "resolve": "^1.20.0",
        "resolve.exports": "^2.0.0",
        "slash": "^3.0.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-resolve-dependencies": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-resolve-dependencies/-/jest-resolve-dependencies-29.7.0.tgz",
      "integrity": "sha512-un0zD/6qxJ+S0et7WxeI3H5XSe9lTBBR7bOHCHXkKR6luG5mwDDlIzVQ0V5cZCuoTgEdcdwzTghYkTWfubi+nA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "jest-regex-util": "^29.6.3",
        "jest-snapshot": "^29.7.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-runner": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-runner/-/jest-runner-29.7.0.tgz",
      "integrity": "sha512-fsc4N6cPCAahybGBfTRcq5wFR6fpLznMg47sY5aDpsoejOcVYFb07AHuSnR0liMcPTgBsA3ZJL6kFOjPdoNipQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jest/console": "^29.7.0",
        "@jest/environment": "^29.7.0",
        "@jest/test-result": "^29.7.0",
        "@jest/transform": "^29.7.0",
        "@jest/types": "^29.6.3",
        "@types/node": "*",
        "chalk": "^4.0.0",
        "emittery": "^0.13.1",
        "graceful-fs": "^4.2.9",
        "jest-docblock": "^29.7.0",
        "jest-environment-node": "^29.7.0",
        "jest-haste-map": "^29.7.0",
        "jest-leak-detector": "^29.7.0",
        "jest-message-util": "^29.7.0",
        "jest-resolve": "^29.7.0",
        "jest-runtime": "^29.7.0",
        "jest-util": "^29.7.0",
        "jest-watcher": "^29.7.0",
        "jest-worker": "^29.7.0",
        "p-limit": "^3.1.0",
        "source-map-support": "0.5.13"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-runtime": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-runtime/-/jest-runtime-29.7.0.tgz",
      "integrity": "sha512-gUnLjgwdGqW7B4LvOIkbKs9WGbn+QLqRQQ9juC6HndeDiezIwhDP+mhMwHWCEcfQ5RUXa6OPnFF8BJh5xegwwQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jest/environment": "^29.7.0",
        "@jest/fake-timers": "^29.7.0",
        "@jest/globals": "^29.7.0",
        "@jest/source-map": "^29.6.3",
        "@jest/test-result": "^29.7.0",
        "@jest/transform": "^29.7.0",
        "@jest/types": "^29.6.3",
        "@types/node": "*",
        "chalk": "^4.0.0",
        "cjs-module-lexer": "^1.0.0",
        "collect-v8-coverage": "^1.0.0",
        "glob": "^7.1.3",
        "graceful-fs": "^4.2.9",
        "jest-haste-map": "^29.7.0",
        "jest-message-util": "^29.7.0",
        "jest-mock": "^29.7.0",
        "jest-regex-util": "^29.6.3",
        "jest-resolve": "^29.7.0",
        "jest-snapshot": "^29.7.0",
        "jest-util": "^29.7.0",
        "slash": "^3.0.0",
        "strip-bom": "^4.0.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-snapshot": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-snapshot/-/jest-snapshot-29.7.0.tgz",
      "integrity": "sha512-Rm0BMWtxBcioHr1/OX5YCP8Uov4riHvKPknOGs804Zg9JGZgmIBkbtlxJC/7Z4msKYVbIJtfU+tKb8xlYNfdkw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/core": "^7.11.6",
        "@babel/generator": "^7.7.2",
        "@babel/plugin-syntax-jsx": "^7.7.2",
        "@babel/plugin-syntax-typescript": "^7.7.2",
        "@babel/types": "^7.3.3",
        "@jest/expect-utils": "^29.7.0",
        "@jest/transform": "^29.7.0",
        "@jest/types": "^29.6.3",
        "babel-preset-current-node-syntax": "^1.0.0",
        "chalk": "^4.0.0",
        "expect": "^29.7.0",
        "graceful-fs": "^4.2.9",
        "jest-diff": "^29.7.0",
        "jest-get-type": "^29.6.3",
        "jest-matcher-utils": "^29.7.0",
        "jest-message-util": "^29.7.0",
        "jest-util": "^29.7.0",
        "natural-compare": "^1.4.0",
        "pretty-format": "^29.7.0",
        "semver": "^7.5.3"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-snapshot/node_modules/semver": {
      "version": "7.7.3",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.7.3.tgz",
      "integrity": "sha512-SdsKMrI9TdgjdweUSR9MweHA4EJ8YxHn8DFaDisvhVlUOe4BF1tLD7GAj0lIqWVl+dPb/rExr0Btby5loQm20Q==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/jest-util": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-util/-/jest-util-29.7.0.tgz",
      "integrity": "sha512-z6EbKajIpqGKU56y5KBUgy1dt1ihhQJgWzUlZHArA/+X2ad7Cb5iF+AK1EWVL/Bo7Rz9uurpqw6SiBCefUbCGA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jest/types": "^29.6.3",
        "@types/node": "*",
        "chalk": "^4.0.0",
        "ci-info": "^3.2.0",
        "graceful-fs": "^4.2.9",
        "picomatch": "^2.2.3"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-validate": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-validate/-/jest-validate-29.7.0.tgz",
      "integrity": "sha512-ZB7wHqaRGVw/9hST/OuFUReG7M8vKeq0/J2egIGLdvjHCmYqGARhzXmtgi+gVeZ5uXFF219aOc3Ls2yLg27tkw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jest/types": "^29.6.3",
        "camelcase": "^6.2.0",
        "chalk": "^4.0.0",
        "jest-get-type": "^29.6.3",
        "leven": "^3.1.0",
        "pretty-format": "^29.7.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-validate/node_modules/camelcase": {
      "version": "6.3.0",
      "resolved": "https://registry.npmjs.org/camelcase/-/camelcase-6.3.0.tgz",
      "integrity": "sha512-Gmy6FhYlCY7uOElZUSbxo2UCDH8owEk996gkbrpsgGtrJLM3J7jGxl9Ic7Qwwj4ivOE5AWZWRMecDdF7hqGjFA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/jest-watcher": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-watcher/-/jest-watcher-29.7.0.tgz",
      "integrity": "sha512-49Fg7WXkU3Vl2h6LbLtMQ/HyB6rXSIX7SqvBLQmssRBGN9I0PNvPmAmCWSOY6SOvrjhI/F7/bGAv9RtnsPA03g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jest/test-result": "^29.7.0",
        "@jest/types": "^29.6.3",
        "@types/node": "*",
        "ansi-escapes": "^4.2.1",
        "chalk": "^4.0.0",
        "emittery": "^0.13.1",
        "jest-util": "^29.7.0",
        "string-length": "^4.0.1"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-worker": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest-worker/-/jest-worker-29.7.0.tgz",
      "integrity": "sha512-eIz2msL/EzL9UFTFFx7jBTkeZfku0yUAyZZZmJ93H2TYEiroIx2PQjEXcwYtYl8zXCxb+PAmA2hLIt/6ZEkPHw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/node": "*",
        "jest-util": "^29.7.0",
        "merge-stream": "^2.0.0",
        "supports-color": "^8.0.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/jest-worker/node_modules/supports-color": {
      "version": "8.1.1",
      "resolved": "https://registry.npmjs.org/supports-color/-/supports-color-8.1.1.tgz",
      "integrity": "sha512-MpUEN2OodtUzxvKQl72cUF7RQ5EiHsGvSsVG0ia9c5RbWGL2CI4C7EpPS8UTBIplnlzZiNuV56w+FuNxy3ty2Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-flag": "^4.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/supports-color?sponsor=1"
      }
    },
    "node_modules/js-tokens": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/js-tokens/-/js-tokens-4.0.0.tgz",
      "integrity": "sha512-RdJUflcE3cUzKiMqQgsCu06FPu9UdIJO0beYbPhHN4k6apgJtifcoCtT9bcxOpYBtpD2kCM6Sbzg4CausW/PKQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/js-yaml": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/js-yaml/-/js-yaml-4.1.1.tgz",
      "integrity": "sha512-qQKT4zQxXl8lLwBtHMWwaTcGfFOZviOJet3Oy/xmGk2gZH677CJM9EvtfdSkgWcATZhj/55JZ0rmy3myCT5lsA==",
      "license": "MIT",
      "dependencies": {
        "argparse": "^2.0.1"
      },
      "bin": {
        "js-yaml": "bin/js-yaml.js"
      }
    },
    "node_modules/jsesc": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/jsesc/-/jsesc-3.1.0.tgz",
      "integrity": "sha512-/sM3dO2FOzXjKQhJuo0Q173wf2KOo8t4I8vHy6lF9poUp7bKT0/NHE8fPX23PwfhnykfqnC2xRxOnVw5XuGIaA==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "jsesc": "bin/jsesc"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/json-parse-even-better-errors": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/json-parse-even-better-errors/-/json-parse-even-better-errors-2.3.1.tgz",
      "integrity": "sha512-xyFwyhro/JEof6Ghe2iz2NcXoj2sloNsWr/XsERDK/oiPCfaNhl5ONfp+jQdAZRQQ0IJWNzH9zIZF7li91kh2w==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/json5": {
      "version": "2.2.3",
      "resolved": "https://registry.npmjs.org/json5/-/json5-2.2.3.tgz",
      "integrity": "sha512-XmOWe7eyHYH14cLdVPoyg+GOH3rYX++KpzrylJwSW98t3Nk+U8XOl8FWKOgwtzdb8lXGf6zYwDUzeHMWfxasyg==",
      "license": "MIT",
      "bin": {
        "json5": "lib/cli.js"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/kleur": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/kleur/-/kleur-3.0.3.tgz",
      "integrity": "sha512-eTIzlVOSUR+JxdDFepEYcBMtZ9Qqdef+rnzWdRZuMbOywu5tO2w2N7rqjoANZ5k9vywhL6Br1VRjUIgTQx4E8w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/leven": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/leven/-/leven-3.1.0.tgz",
      "integrity": "sha512-qsda+H8jTaUaN/x5vzW2rzc+8Rw4TAQ/4KjB46IwK5VH+IlVeeeje/EoZRpiXvIqjFgK84QffqPztGI3VBLG1A==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/lines-and-columns": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/lines-and-columns/-/lines-and-columns-1.2.4.tgz",
      "integrity": "sha512-7ylylesZQ/PV29jhEDl3Ufjo6ZX7gCqJr5F7PKrqc93v7fzSymt1BpwEU8nAUXs8qzzvqhbjhK5QZg6Mt/HkBg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/locate-path": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/locate-path/-/locate-path-5.0.0.tgz",
      "integrity": "sha512-t7hw9pI+WvuwNJXwk5zVHpyhIqzg2qTlklJOf0mVxGSbe3Fp2VieZcduNYjaLDoy6p9uGpQEGWG87WpMKlNq8g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "p-locate": "^4.1.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/log-symbols": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/log-symbols/-/log-symbols-5.1.0.tgz",
      "integrity": "sha512-l0x2DvrW294C9uDCoQe1VSU4gf529FkSZ6leBl4TiqZH/e+0R7hSfHQBNut2mNygDgHwvYHfFLn6Oxb3VWj2rA==",
      "license": "MIT",
      "dependencies": {
        "chalk": "^5.0.0",
        "is-unicode-supported": "^1.1.0"
      },
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/log-symbols/node_modules/chalk": {
      "version": "5.6.2",
      "resolved": "https://registry.npmjs.org/chalk/-/chalk-5.6.2.tgz",
      "integrity": "sha512-7NzBL0rN6fMUW+f7A6Io4h40qQlG+xGmtMxfbnH/K7TAtt8JQWVQK+6g0UXKMeVJoyV5EkkNsErQ8pVD3bLHbA==",
      "license": "MIT",
      "engines": {
        "node": "^12.17.0 || ^14.13 || >=16.0.0"
      },
      "funding": {
        "url": "https://github.com/chalk/chalk?sponsor=1"
      }
    },
    "node_modules/lru-cache": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-5.1.1.tgz",
      "integrity": "sha512-KpNARQA3Iwv+jTA0utUVVbrh+Jlrr1Fv0e56GGzAFOXN7dk/FviaDW8LHmK52DlcH4WP2n6gI8vN1aesBFgo9w==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "yallist": "^3.0.2"
      }
    },
    "node_modules/make-dir": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/make-dir/-/make-dir-4.0.0.tgz",
      "integrity": "sha512-hXdUTZYIVOt1Ex//jAQi+wTZZpUpwBj/0QsOzqegb3rGMMeJiSEu5xLHnYfBrRV4RH2+OCSOO95Is/7x1WJ4bw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "semver": "^7.5.3"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/make-dir/node_modules/semver": {
      "version": "7.7.3",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.7.3.tgz",
      "integrity": "sha512-SdsKMrI9TdgjdweUSR9MweHA4EJ8YxHn8DFaDisvhVlUOe4BF1tLD7GAj0lIqWVl+dPb/rExr0Btby5loQm20Q==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/make-error": {
      "version": "1.3.6",
      "resolved": "https://registry.npmjs.org/make-error/-/make-error-1.3.6.tgz",
      "integrity": "sha512-s8UhlNe7vPKomQhC1qFelMokr/Sc3AgNbso3n74mVPA5LTZwkB9NlXf4XPamLxJE8h0gh73rM94xvwRT2CVInw==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/makeerror": {
      "version": "1.0.12",
      "resolved": "https://registry.npmjs.org/makeerror/-/makeerror-1.0.12.tgz",
      "integrity": "sha512-JmqCvUhmt43madlpFzG4BQzG2Z3m6tvQDNKdClZnO3VbIudJYmxsT0FNJMeiB2+JTSlTQTSbU8QdesVmwJcmLg==",
      "dev": true,
      "license": "BSD-3-Clause",
      "dependencies": {
        "tmpl": "1.0.5"
      }
    },
    "node_modules/marked": {
      "version": "15.0.12",
      "resolved": "https://registry.npmjs.org/marked/-/marked-15.0.12.tgz",
      "integrity": "sha512-8dD6FusOQSrpv9Z1rdNMdlSgQOIP880DHqnohobOmYLElGEqAL/JvxvuxZO16r4HtjTlfPRDC1hbvxC9dPN2nA==",
      "license": "MIT",
      "bin": {
        "marked": "bin/marked.js"
      },
      "engines": {
        "node": ">= 18"
      }
    },
    "node_modules/marked-terminal": {
      "version": "7.3.0",
      "resolved": "https://registry.npmjs.org/marked-terminal/-/marked-terminal-7.3.0.tgz",
      "integrity": "sha512-t4rBvPsHc57uE/2nJOLmMbZCQ4tgAccAED3ngXQqW6g+TxA488JzJ+FK3lQkzBQOI1mRV/r/Kq+1ZlJ4D0owQw==",
      "license": "MIT",
      "dependencies": {
        "ansi-escapes": "^7.0.0",
        "ansi-regex": "^6.1.0",
        "chalk": "^5.4.1",
        "cli-highlight": "^2.1.11",
        "cli-table3": "^0.6.5",
        "node-emoji": "^2.2.0",
        "supports-hyperlinks": "^3.1.0"
      },
      "engines": {
        "node": ">=16.0.0"
      },
      "peerDependencies": {
        "marked": ">=1 <16"
      }
    },
    "node_modules/marked-terminal/node_modules/ansi-escapes": {
      "version": "7.2.0",
      "resolved": "https://registry.npmjs.org/ansi-escapes/-/ansi-escapes-7.2.0.tgz",
      "integrity": "sha512-g6LhBsl+GBPRWGWsBtutpzBYuIIdBkLEvad5C/va/74Db018+5TZiyA26cZJAr3Rft5lprVqOIPxf5Vid6tqAw==",
      "license": "MIT",
      "dependencies": {
        "environment": "^1.0.0"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/marked-terminal/node_modules/ansi-regex": {
      "version": "6.2.2",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-6.2.2.tgz",
      "integrity": "sha512-Bq3SmSpyFHaWjPk8If9yc6svM8c56dB5BAtW4Qbw5jHTwwXXcTLoRMkpDJp6VL0XzlWaCHTXrkFURMYmD0sLqg==",
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-regex?sponsor=1"
      }
    },
    "node_modules/marked-terminal/node_modules/chalk": {
      "version": "5.6.2",
      "resolved": "https://registry.npmjs.org/chalk/-/chalk-5.6.2.tgz",
      "integrity": "sha512-7NzBL0rN6fMUW+f7A6Io4h40qQlG+xGmtMxfbnH/K7TAtt8JQWVQK+6g0UXKMeVJoyV5EkkNsErQ8pVD3bLHbA==",
      "license": "MIT",
      "engines": {
        "node": "^12.17.0 || ^14.13 || >=16.0.0"
      },
      "funding": {
        "url": "https://github.com/chalk/chalk?sponsor=1"
      }
    },
    "node_modules/math-intrinsics": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/math-intrinsics/-/math-intrinsics-1.1.0.tgz",
      "integrity": "sha512-/IXtbwEk5HTPyEwyKX6hGkYXxM9nbj64B+ilVJnC/R6B0pH5G4V3b0pVbL7DBj4tkhBAppbQUlf6F6Xl9LHu1g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/merge-stream": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/merge-stream/-/merge-stream-2.0.0.tgz",
      "integrity": "sha512-abv/qOcuPfk3URPfDzmZU1LKmuw8kT+0nIHvKrKgFrwifol/doWcdA4ZqsWQ8ENrFKkd67Mfpo/LovbIUsbt3w==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/micromatch": {
      "version": "4.0.8",
      "resolved": "https://registry.npmjs.org/micromatch/-/micromatch-4.0.8.tgz",
      "integrity": "sha512-PXwfBhYu0hBCPw8Dn0E+WDYb7af3dSLVWKi3HGv84IdF4TyFoC0ysxFd0Goxw7nSv4T/PzEJQxsYsEiFCKo2BA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "braces": "^3.0.3",
        "picomatch": "^2.3.1"
      },
      "engines": {
        "node": ">=8.6"
      }
    },
    "node_modules/mime-db": {
      "version": "1.52.0",
      "resolved": "https://registry.npmjs.org/mime-db/-/mime-db-1.52.0.tgz",
      "integrity": "sha512-sPU4uV7dYlvtWJxwwxHD0PuihVNiE7TyAbQ5SWxDCB9mUYvOgroQOwYQQOKPJ8CIbE+1ETVlOoK1UC2nU3gYvg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/mime-types": {
      "version": "2.1.35",
      "resolved": "https://registry.npmjs.org/mime-types/-/mime-types-2.1.35.tgz",
      "integrity": "sha512-ZDY+bPm5zTTF+YpCrAU9nK0UgICYPT0QtT1NZWFv4s++TNkcgVaT0g6+4R2uI4MjQjzysHB1zxuWL50hzaeXiw==",
      "license": "MIT",
      "dependencies": {
        "mime-db": "1.52.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/mimic-fn": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/mimic-fn/-/mimic-fn-2.1.0.tgz",
      "integrity": "sha512-OqbOk5oEQeAZ8WXWydlu9HJjz9WVdEIvamMCcXmuqUYjTknH/sqsWvhQ3vgwKFRR1HpjvNBKQ37nbJgYzGqGcg==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/minimatch": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-3.1.2.tgz",
      "integrity": "sha512-J7p63hRiAjw1NDEww1W7i37+ByIrOWO5XQQAzZ3VOcL0PNybwpfmV/N05zFAzwQ9USyEcX6t3UO+K5aqBQOIHw==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "brace-expansion": "^1.1.7"
      },
      "engines": {
        "node": "*"
      }
    },
    "node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/mz": {
      "version": "2.7.0",
      "resolved": "https://registry.npmjs.org/mz/-/mz-2.7.0.tgz",
      "integrity": "sha512-z81GNO7nnYMEhrGh9LeymoE4+Yr0Wn5McHIZMK5cfQCl+NDX08sCZgUc9/6MHni9IWuFLm1Z3HTCXu2z9fN62Q==",
      "license": "MIT",
      "dependencies": {
        "any-promise": "^1.0.0",
        "object-assign": "^4.0.1",
        "thenify-all": "^1.0.0"
      }
    },
    "node_modules/natural-compare": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/natural-compare/-/natural-compare-1.4.0.tgz",
      "integrity": "sha512-OWND8ei3VtNC9h7V60qff3SVobHr996CTwgxubgyQYEpg290h9J0buyECNNJexkFm5sOajh5G116RYA1c8ZMSw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/node-emoji": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/node-emoji/-/node-emoji-2.2.0.tgz",
      "integrity": "sha512-Z3lTE9pLaJF47NyMhd4ww1yFTAP8YhYI8SleJiHzM46Fgpm5cnNzSl9XfzFNqbaz+VlJrIj3fXQ4DeN1Rjm6cw==",
      "license": "MIT",
      "dependencies": {
        "@sindresorhus/is": "^4.6.0",
        "char-regex": "^1.0.2",
        "emojilib": "^2.4.0",
        "skin-tone": "^2.0.0"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/node-int64": {
      "version": "0.4.0",
      "resolved": "https://registry.npmjs.org/node-int64/-/node-int64-0.4.0.tgz",
      "integrity": "sha512-O5lz91xSOeoXP6DulyHfllpq+Eg00MWitZIbtPfoSEvqIHdl5gfcY6hYzDWnj0qD5tz52PI08u9qUvSVeUBeHw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/node-releases": {
      "version": "2.0.27",
      "resolved": "https://registry.npmjs.org/node-releases/-/node-releases-2.0.27.tgz",
      "integrity": "sha512-nmh3lCkYZ3grZvqcCH+fjmQ7X+H0OeZgP40OierEaAptX4XofMh5kwNbWh7lBduUzCcV/8kZ+NDLCwm2iorIlA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/normalize-path": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/normalize-path/-/normalize-path-3.0.0.tgz",
      "integrity": "sha512-6eZs5Ls3WtCisHWp9S2GUy8dqkpGi4BVSz3GaqiE6ezub0512ESztXUwUB6C6IKbQkY2Pnb/mD4WYojCRwcwLA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/npm-run-path": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/npm-run-path/-/npm-run-path-4.0.1.tgz",
      "integrity": "sha512-S48WzZW777zhNIrn7gxOlISNAqi9ZC/uQFnRdbeIHhZhCA6UqpkOT8T1G7BvfdgP4Er8gF4sUbaS0i7QvIfCWw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "path-key": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/object-assign": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/object-assign/-/object-assign-4.1.1.tgz",
      "integrity": "sha512-rJgTQnkUnH1sFw8yT6VSU3zD3sWmu6sZhIseY8VX+GRu3P6F7Fu+JNDoXfklElbLJSnc3FUQHVe4cU5hj+BcUg==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/once": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/once/-/once-1.4.0.tgz",
      "integrity": "sha512-lNaJgI+2Q5URQBkccEKHTQOPaXdUxnZZElQTZY0MFUAuaEqe1E+Nyvgdz/aIyNi6Z9MzO5dv1H8n58/GELp3+w==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "wrappy": "1"
      }
    },
    "node_modules/onetime": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/onetime/-/onetime-5.1.2.tgz",
      "integrity": "sha512-kbpaSSGJTWdAY5KPVeMOKXSrPtr8C8C7wodJbcsd51jRnmD+GZu8Y0VoU6Dm5Z4vWr0Ig/1NKuWRKf7j5aaYSg==",
      "license": "MIT",
      "dependencies": {
        "mimic-fn": "^2.1.0"
      },
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/ora": {
      "version": "6.3.1",
      "resolved": "https://registry.npmjs.org/ora/-/ora-6.3.1.tgz",
      "integrity": "sha512-ERAyNnZOfqM+Ao3RAvIXkYh5joP220yf59gVe2X/cI6SiCxIdi4c9HZKZD8R6q/RDXEje1THBju6iExiSsgJaQ==",
      "license": "MIT",
      "dependencies": {
        "chalk": "^5.0.0",
        "cli-cursor": "^4.0.0",
        "cli-spinners": "^2.6.1",
        "is-interactive": "^2.0.0",
        "is-unicode-supported": "^1.1.0",
        "log-symbols": "^5.1.0",
        "stdin-discarder": "^0.1.0",
        "strip-ansi": "^7.0.1",
        "wcwidth": "^1.0.1"
      },
      "engines": {
        "node": "^12.20.0 || ^14.13.1 || >=16.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/ora/node_modules/ansi-regex": {
      "version": "6.2.2",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-6.2.2.tgz",
      "integrity": "sha512-Bq3SmSpyFHaWjPk8If9yc6svM8c56dB5BAtW4Qbw5jHTwwXXcTLoRMkpDJp6VL0XzlWaCHTXrkFURMYmD0sLqg==",
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-regex?sponsor=1"
      }
    },
    "node_modules/ora/node_modules/chalk": {
      "version": "5.6.2",
      "resolved": "https://registry.npmjs.org/chalk/-/chalk-5.6.2.tgz",
      "integrity": "sha512-7NzBL0rN6fMUW+f7A6Io4h40qQlG+xGmtMxfbnH/K7TAtt8JQWVQK+6g0UXKMeVJoyV5EkkNsErQ8pVD3bLHbA==",
      "license": "MIT",
      "engines": {
        "node": "^12.17.0 || ^14.13 || >=16.0.0"
      },
      "funding": {
        "url": "https://github.com/chalk/chalk?sponsor=1"
      }
    },
    "node_modules/ora/node_modules/strip-ansi": {
      "version": "7.1.2",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-7.1.2.tgz",
      "integrity": "sha512-gmBGslpoQJtgnMAvOVqGZpEz9dyoKTCzy2nfz/n8aIFhN/jCE/rCmcxabB6jOOHV+0WNnylOxaxBQPSvcWklhA==",
      "license": "MIT",
      "dependencies": {
        "ansi-regex": "^6.0.1"
      },
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/strip-ansi?sponsor=1"
      }
    },
    "node_modules/p-limit": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/p-limit/-/p-limit-3.1.0.tgz",
      "integrity": "sha512-TYOanM3wGwNGsZN2cVTYPArw454xnXj5qmWF1bEoAc4+cU/ol7GVh7odevjp1FNHduHc3KZMcFduxU5Xc6uJRQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "yocto-queue": "^0.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/p-locate": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/p-locate/-/p-locate-4.1.0.tgz",
      "integrity": "sha512-R79ZZ/0wAxKGu3oYMlz8jy/kbhsNrS7SKZ7PxEHBgJ5+F2mtFW2fK2cOtBh1cHYkQsbzFV7I+EoRKe6Yt0oK7A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "p-limit": "^2.2.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/p-locate/node_modules/p-limit": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/p-limit/-/p-limit-2.3.0.tgz",
      "integrity": "sha512-//88mFWSJx8lxCzwdAABTJL2MyWB12+eIY7MDL2SqLmAkeKU9qxRvWuSyTjm3FUmpBEMuFfckAIqEaVGUDxb6w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "p-try": "^2.0.0"
      },
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/p-try": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/p-try/-/p-try-2.2.0.tgz",
      "integrity": "sha512-R4nPAVTAU0B9D35/Gk3uJf/7XYbQcyohSKdvAxIRSNghFl4e71hVoGnBNQz9cWaXxO2I10KTC+3jMdvvoKw6dQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/parse-json": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/parse-json/-/parse-json-5.2.0.tgz",
      "integrity": "sha512-ayCKvm/phCGxOkYRSCM82iDwct8/EonSEgCSxWxD7ve6jHggsFl4fZVQBPRNgQoKiuV/odhFrGzQXZwbifC8Rg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.0.0",
        "error-ex": "^1.3.1",
        "json-parse-even-better-errors": "^2.3.0",
        "lines-and-columns": "^1.1.6"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/parse5": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/parse5/-/parse5-5.1.1.tgz",
      "integrity": "sha512-ugq4DFI0Ptb+WWjAdOK16+u/nHfiIrcE+sh8kZMaM0WllQKLI9rOUq6c2b7cwPkXdzfQESqvoqK6ug7U/Yyzug==",
      "license": "MIT"
    },
    "node_modules/parse5-htmlparser2-tree-adapter": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/parse5-htmlparser2-tree-adapter/-/parse5-htmlparser2-tree-adapter-6.0.1.tgz",
      "integrity": "sha512-qPuWvbLgvDGilKc5BoicRovlT4MtYT6JfJyBOMDsKoiT+GiuP5qyrPCnR9HcPECIJJmZh5jRndyNThnhhb/vlA==",
      "license": "MIT",
      "dependencies": {
        "parse5": "^6.0.1"
      }
    },
    "node_modules/parse5-htmlparser2-tree-adapter/node_modules/parse5": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/parse5/-/parse5-6.0.1.tgz",
      "integrity": "sha512-Ofn/CTFzRGTTxwpNEs9PP93gXShHcTq255nzRYSKe8AkVpZY7e1fpmTfOyoIvjP5HG7Z2ZM7VS9PPhQGW2pOpw==",
      "license": "MIT"
    },
    "node_modules/path-exists": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/path-exists/-/path-exists-4.0.0.tgz",
      "integrity": "sha512-ak9Qy5Q7jYb2Wwcey5Fpvg2KoAc/ZIhLSLOSBmRmygPsGwkVVt0fZa0qrtMz+m6tJTAHfZQ8FnmB4MG4LWy7/w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/path-is-absolute": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/path-is-absolute/-/path-is-absolute-1.0.1.tgz",
      "integrity": "sha512-AVbw3UJ2e9bq64vSaS9Am0fje1Pa8pbGqTTsmXfaIiMpnr5DlDhfJOuLj9Sf95ZPVDAUerDfEk88MPmPe7UCQg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/path-key": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/path-key/-/path-key-3.1.1.tgz",
      "integrity": "sha512-ojmeN0qd+y0jszEtoY48r0Peq5dwMEkIlCOu6Q5f41lfkswXuKtYrhgoTpLnyIcHm24Uhqx+5Tqm2InSwLhE6Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/path-parse": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/path-parse/-/path-parse-1.0.7.tgz",
      "integrity": "sha512-LDJzPVEEEPR+y48z93A0Ed0yXb8pAByGWo/k5YYdYgpY2/2EsOsksJrq7lOHxryrVOn1ejG6oAp8ahvOIQD8sw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/picocolors": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/picocolors/-/picocolors-1.1.1.tgz",
      "integrity": "sha512-xceH2snhtb5M9liqDsmEw56le376mTZkEX/jEb/RxNFyegNul7eNslCXP9FDj/Lcu0X8KEyMceP2ntpaHrDEVA==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/picomatch": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-2.3.1.tgz",
      "integrity": "sha512-JU3teHTNjmE2VCGFzuY8EXzCDVwEqB2a8fsIvwaStHhAWJEeVd1o1QD80CU6+ZdEXXSLbSsuLwJjkCBWqRQUVA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/pirates": {
      "version": "4.0.7",
      "resolved": "https://registry.npmjs.org/pirates/-/pirates-4.0.7.tgz",
      "integrity": "sha512-TfySrs/5nm8fQJDcBDuUng3VOUKsd7S+zqvbOTiGXHfxX4wK31ard+hoNuvkicM/2YFzlpDgABOevKSsB4G/FA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/pkg-dir": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/pkg-dir/-/pkg-dir-4.2.0.tgz",
      "integrity": "sha512-HRDzbaKjC+AOWVXxAU/x54COGeIv9eb+6CkDSQoNTt4XyWoIJvuPsXizxu/Fr23EiekbtZwmh1IcIG/l/a10GQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "find-up": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/pretty-format": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/pretty-format/-/pretty-format-29.7.0.tgz",
      "integrity": "sha512-Pdlw/oPxN+aXdmM9R00JVC9WVFoCLTKJvDVLgmJ+qAffBMxsV85l/Lu7sNx4zSzPyoL2euImuEwHhOXdEgNFZQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jest/schemas": "^29.6.3",
        "ansi-styles": "^5.0.0",
        "react-is": "^18.0.0"
      },
      "engines": {
        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
      }
    },
    "node_modules/pretty-format/node_modules/ansi-styles": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-5.2.0.tgz",
      "integrity": "sha512-Cxwpt2SfTzTtXcfOlzGEee8O+c+MmUgGrNiBcXnuWxuFJHe6a5Hz7qwhwe5OgaSYI0IJvkLqWX1ASG+cJOkEiA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/prompts": {
      "version": "2.4.2",
      "resolved": "https://registry.npmjs.org/prompts/-/prompts-2.4.2.tgz",
      "integrity": "sha512-NxNv/kLguCA7p3jE8oL2aEBsrJWgAakBpgmgK6lpPWV+WuOmY6r2/zbAVnP+T8bQlA0nzHXSJSJW0Hq7ylaD2Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "kleur": "^3.0.3",
        "sisteransi": "^1.0.5"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/proxy-from-env": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/proxy-from-env/-/proxy-from-env-1.1.0.tgz",
      "integrity": "sha512-D+zkORCbA9f1tdWRK0RaCR3GPv50cMxcrz4X8k5LTSUD1Dkw47mKJEZQNunItRTkWwgtaUSo1RVFRIG9ZXiFYg==",
      "license": "MIT"
    },
    "node_modules/pure-rand": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/pure-rand/-/pure-rand-6.1.0.tgz",
      "integrity": "sha512-bVWawvoZoBYpp6yIoQtQXHZjmz35RSVHnUOTefl8Vcjr8snTPY1wnpSPMWekcFwbxI6gtmT7rSYPFvz71ldiOA==",
      "dev": true,
      "funding": [
        {
          "type": "individual",
          "url": "https://github.com/sponsors/dubzzz"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fast-check"
        }
      ],
      "license": "MIT"
    },
    "node_modules/react-is": {
      "version": "18.3.1",
      "resolved": "https://registry.npmjs.org/react-is/-/react-is-18.3.1.tgz",
      "integrity": "sha512-/LLMVyas0ljjAtoYiPqYiL8VWXzUUdThrmU5+n20DZv+a+ClRoevUzw5JxU+Ieh5/c87ytoTBV9G1FiKfNJdmg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/readable-stream": {
      "version": "3.6.2",
      "resolved": "https://registry.npmjs.org/readable-stream/-/readable-stream-3.6.2.tgz",
      "integrity": "sha512-9u/sniCrY3D5WdsERHzHE4G2YCXqoG5FTHUiCC4SIbr6XcLZBY05ya9EKjYek9O5xOAwjGq+1JdGBAS7Q9ScoA==",
      "license": "MIT",
      "dependencies": {
        "inherits": "^2.0.3",
        "string_decoder": "^1.1.1",
        "util-deprecate": "^1.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/require-directory": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/require-directory/-/require-directory-2.1.1.tgz",
      "integrity": "sha512-fGxEI7+wsG9xrvdjsrlmL22OMTTiHRwAMroiEeMgq8gzoLC/PQr7RsRDSTLUg/bZAZtF+TVIkHc6/4RIKrui+Q==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/resolve": {
      "version": "1.22.11",
      "resolved": "https://registry.npmjs.org/resolve/-/resolve-1.22.11.tgz",
      "integrity": "sha512-RfqAvLnMl313r7c9oclB1HhUEAezcpLjz95wFH4LVuhk9JF/r22qmVP9AMmOU4vMX7Q8pN8jwNg/CSpdFnMjTQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-core-module": "^2.16.1",
        "path-parse": "^1.0.7",
        "supports-preserve-symlinks-flag": "^1.0.0"
      },
      "bin": {
        "resolve": "bin/resolve"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/resolve-cwd": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/resolve-cwd/-/resolve-cwd-3.0.0.tgz",
      "integrity": "sha512-OrZaX2Mb+rJCpH/6CpSqt9xFVpN++x01XnN2ie9g6P5/3xelLAkXWVADpdz1IHD/KFfEXyE6V0U01OQ3UO2rEg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "resolve-from": "^5.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/resolve-from": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/resolve-from/-/resolve-from-5.0.0.tgz",
      "integrity": "sha512-qYg9KP24dD5qka9J47d0aVky0N+b4fTU89LN9iDnjB5waksiC49rvMB0PrUJQGoTmH50XPiqOvAjDfaijGxYZw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/resolve.exports": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/resolve.exports/-/resolve.exports-2.0.3.tgz",
      "integrity": "sha512-OcXjMsGdhL4XnbShKpAcSqPMzQoYkYyhbEaeSko47MjRP9NfEQMhZkXL1DoFlt9LWQn4YttrdnV6X2OiyzBi+A==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/restore-cursor": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/restore-cursor/-/restore-cursor-4.0.0.tgz",
      "integrity": "sha512-I9fPXU9geO9bHOt9pHHOhOkYerIMsmVaWB0rA2AI9ERh/+x/i7MV5HKBNrg+ljO5eoPVgCcnFuRjJ9uH6I/3eg==",
      "license": "MIT",
      "dependencies": {
        "onetime": "^5.1.0",
        "signal-exit": "^3.0.2"
      },
      "engines": {
        "node": "^12.20.0 || ^14.13.1 || >=16.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/safe-buffer": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.2.1.tgz",
      "integrity": "sha512-rp3So07KcdmmKbGvgaNxQSJr7bGVSVk5S9Eq1F+ppbRo70+YeaDxkw5Dd8NPN+GD6bjnYm2VuPuCXmpuYvmCXQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/semver": {
      "version": "6.3.1",
      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.1.tgz",
      "integrity": "sha512-BR7VvDCVHO+q2xBEWskxS6DJE1qRnb7DxzUrogb71CWoSficBxYsiAGd+Kl0mmq/MprG9yArRkyrQxTO6XjMzA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/shebang-command": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/shebang-command/-/shebang-command-2.0.0.tgz",
      "integrity": "sha512-kHxr2zZpYtdmrN1qDjrrX/Z1rR1kG8Dx+gkpK1G4eXmvXswmcE1hTWBWYUzlraYw1/yZp6YuDY77YtvbN0dmDA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "shebang-regex": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/shebang-regex": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/shebang-regex/-/shebang-regex-3.0.0.tgz",
      "integrity": "sha512-7++dFhtcx3353uBaq8DDR4NuxBetBzC7ZQOhmTQInHEd6bSrXdiEyzCvG07Z44UYdLShWUyXt5M/yhz8ekcb1A==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/signal-exit": {
      "version": "3.0.7",
      "resolved": "https://registry.npmjs.org/signal-exit/-/signal-exit-3.0.7.tgz",
      "integrity": "sha512-wnD2ZE+l+SPC/uoS0vXeE9L1+0wuaMqKlfz9AMUo38JsyLSBWSFcHR1Rri62LZc12vLr1gb3jl7iwQhgwpAbGQ==",
      "license": "ISC"
    },
    "node_modules/sisteransi": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/sisteransi/-/sisteransi-1.0.5.tgz",
      "integrity": "sha512-bLGGlR1QxBcynn2d5YmDX4MGjlZvy2MRBDRNHLJ8VI6l6+9FUiyTFNJ0IveOSP0bcXgVDPRcfGqA0pjaqUpfVg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/skin-tone": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/skin-tone/-/skin-tone-2.0.0.tgz",
      "integrity": "sha512-kUMbT1oBJCpgrnKoSr0o6wPtvRWT9W9UKvGLwfJYO2WuahZRHOpEyL1ckyMGgMWh0UdpmaoFqKKD29WTomNEGA==",
      "license": "MIT",
      "dependencies": {
        "unicode-emoji-modifier-base": "^1.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/slash": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/slash/-/slash-3.0.0.tgz",
      "integrity": "sha512-g9Q1haeby36OSStwb4ntCGGGaKsaVSjQ68fBxoQcutl5fS1vuY18H3wSt3jFyFtrkx+Kz0V1G85A4MyAdDMi2Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/source-map": {
      "version": "0.6.1",
      "resolved": "https://registry.npmjs.org/source-map/-/source-map-0.6.1.tgz",
      "integrity": "sha512-UjgapumWlbMhkBgzT7Ykc5YXUT46F0iKu8SGXq0bcwP5dz/h0Plj6enJqjz1Zbq2l5WaqYnrVbwWOWMyF3F47g==",
      "dev": true,
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/source-map-support": {
      "version": "0.5.13",
      "resolved": "https://registry.npmjs.org/source-map-support/-/source-map-support-0.5.13.tgz",
      "integrity": "sha512-SHSKFHadjVA5oR4PPqhtAVdcBWwRYVd6g6cAXnIbRiIwc2EhPrTuKUBdSLvlEKyIP3GCf89fltvcZiP9MMFA1w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "buffer-from": "^1.0.0",
        "source-map": "^0.6.0"
      }
    },
    "node_modules/sprintf-js": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/sprintf-js/-/sprintf-js-1.0.3.tgz",
      "integrity": "sha512-D9cPgkvLlV3t3IzL0D0YLvGA9Ahk4PcvVwUbN0dSGr1aP0Nrt4AEnTUbuGvquEC0mA64Gqt1fzirlRs5ibXx8g==",
      "dev": true,
      "license": "BSD-3-Clause"
    },
    "node_modules/stack-utils": {
      "version": "2.0.6",
      "resolved": "https://registry.npmjs.org/stack-utils/-/stack-utils-2.0.6.tgz",
      "integrity": "sha512-XlkWvfIm6RmsWtNJx+uqtKLS8eqFbxUg0ZzLXqY0caEy9l7hruX8IpiDnjsLavoBgqCCR71TqWO8MaXYheJ3RQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "escape-string-regexp": "^2.0.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/stdin-discarder": {
      "version": "0.1.0",
      "resolved": "https://registry.npmjs.org/stdin-discarder/-/stdin-discarder-0.1.0.tgz",
      "integrity": "sha512-xhV7w8S+bUwlPTb4bAOUQhv8/cSS5offJuX8GQGq32ONF0ZtDWKfkdomM3HMRA+LhX6um/FZ0COqlwsjD53LeQ==",
      "license": "MIT",
      "dependencies": {
        "bl": "^5.0.0"
      },
      "engines": {
        "node": "^12.20.0 || ^14.13.1 || >=16.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/string_decoder": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/string_decoder/-/string_decoder-1.3.0.tgz",
      "integrity": "sha512-hkRX8U1WjJFd8LsDJ2yQ/wWWxaopEsABU1XfkM8A+j0+85JAGppt16cr1Whg6KIbb4okU6Mql6BOj+uup/wKeA==",
      "license": "MIT",
      "dependencies": {
        "safe-buffer": "~5.2.0"
      }
    },
    "node_modules/string-length": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/string-length/-/string-length-4.0.2.tgz",
      "integrity": "sha512-+l6rNN5fYHNhZZy41RXsYptCjA2Igmq4EG7kZAYFQI1E1VTXarr6ZPXBg6eq7Y6eK4FEhY6AJlyuFIb/v/S0VQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "char-regex": "^1.0.2",
        "strip-ansi": "^6.0.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/string-width": {
      "version": "4.2.3",
      "resolved": "https://registry.npmjs.org/string-width/-/string-width-4.2.3.tgz",
      "integrity": "sha512-wKyQRQpjJ0sIp62ErSZdGsjMJWsap5oRNihHhu6G7JVO/9jIB6UyevL+tXuOqrng8j/cxKTWyWUwvSTriiZz/g==",
      "license": "MIT",
      "dependencies": {
        "emoji-regex": "^8.0.0",
        "is-fullwidth-code-point": "^3.0.0",
        "strip-ansi": "^6.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/strip-ansi": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-6.0.1.tgz",
      "integrity": "sha512-Y38VPSHcqkFrCpFnQ9vuSXmquuv5oXOKpGeT6aGrr3o3Gc9AlVa6JBfUSOCnbxGGZF+/0ooI7KrPuUSztUdU5A==",
      "license": "MIT",
      "dependencies": {
        "ansi-regex": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/strip-bom": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/strip-bom/-/strip-bom-4.0.0.tgz",
      "integrity": "sha512-3xurFv5tEgii33Zi8Jtp55wEIILR9eh34FAW00PZf+JnSsTmV/ioewSgQl97JHvgjoRGwPShsWm+IdrxB35d0w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/strip-final-newline": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/strip-final-newline/-/strip-final-newline-2.0.0.tgz",
      "integrity": "sha512-BrpvfNAE3dcvq7ll3xVumzjKjZQ5tI1sEUIKr3Uoks0XUl45St3FlatVqef9prk4jRDzhW6WZg+3bk93y6pLjA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/strip-json-comments": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/strip-json-comments/-/strip-json-comments-3.1.1.tgz",
      "integrity": "sha512-6fPc+R4ihwqP6N/aIv2f1gMH8lOVtWQHoqC4yK6oSDVVocumAsfCqjkXnqiYMhmMwS/mEHLp7Vehlt3ql6lEig==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/supports-color": {
      "version": "7.2.0",
      "resolved": "https://registry.npmjs.org/supports-color/-/supports-color-7.2.0.tgz",
      "integrity": "sha512-qpCAvRl9stuOHveKsn7HncJRvv501qIacKzQlO/+Lwxc9+0q2wLyv4Dfvt80/DPn2pqOBsJdDiogXGR9+OvwRw==",
      "license": "MIT",
      "dependencies": {
        "has-flag": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/supports-hyperlinks": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/supports-hyperlinks/-/supports-hyperlinks-3.2.0.tgz",
      "integrity": "sha512-zFObLMyZeEwzAoKCyu1B91U79K2t7ApXuQfo8OuxwXLDgcKxuwM+YvcbIhm6QWqz7mHUH1TVytR1PwVVjEuMig==",
      "license": "MIT",
      "dependencies": {
        "has-flag": "^4.0.0",
        "supports-color": "^7.0.0"
      },
      "engines": {
        "node": ">=14.18"
      },
      "funding": {
        "url": "https://github.com/chalk/supports-hyperlinks?sponsor=1"
      }
    },
    "node_modules/supports-preserve-symlinks-flag": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/supports-preserve-symlinks-flag/-/supports-preserve-symlinks-flag-1.0.0.tgz",
      "integrity": "sha512-ot0WnXS9fgdkgIcePe6RHNk1WA8+muPa6cSjeR3V8K27q9BB1rTE3R1p7Hv0z1ZyAc8s6Vvv8DIyWf681MAt0w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/test-exclude": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/test-exclude/-/test-exclude-6.0.0.tgz",
      "integrity": "sha512-cAGWPIyOHU6zlmg88jwm7VRyXnMN7iV68OGAbYDk/Mh/xC/pzVPlQtY6ngoIH/5/tciuhGfvESU8GrHrcxD56w==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "@istanbuljs/schema": "^0.1.2",
        "glob": "^7.1.4",
        "minimatch": "^3.0.4"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/thenify": {
      "version": "3.3.1",
      "resolved": "https://registry.npmjs.org/thenify/-/thenify-3.3.1.tgz",
      "integrity": "sha512-RVZSIV5IG10Hk3enotrhvz0T9em6cyHBLkH/YAZuKqd8hRkKhSfCGIcP2KUY0EPxndzANBmNllzWPwak+bheSw==",
      "license": "MIT",
      "dependencies": {
        "any-promise": "^1.0.0"
      }
    },
    "node_modules/thenify-all": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/thenify-all/-/thenify-all-1.6.0.tgz",
      "integrity": "sha512-RNxQH/qI8/t3thXJDwcstUO4zeqo64+Uy/+sNVRBx4Xn2OX+OZ9oP+iJnNFqplFra2ZUVeKCSa2oVWi3T4uVmA==",
      "license": "MIT",
      "dependencies": {
        "thenify": ">= 3.1.0 < 4"
      },
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/tmpl": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/tmpl/-/tmpl-1.0.5.tgz",
      "integrity": "sha512-3f0uOEAQwIqGuWW2MVzYg8fV/QNnc/IpuJNG837rLuczAaLVHslWHZQj4IGiEl5Hs3kkbhwL9Ab7Hrsmuj+Smw==",
      "dev": true,
      "license": "BSD-3-Clause"
    },
    "node_modules/to-regex-range": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/to-regex-range/-/to-regex-range-5.0.1.tgz",
      "integrity": "sha512-65P7iz6X5yEr1cwcgvQxbbIw7Uk3gOy5dIdtZ4rDveLqhrdJP+Li/Hx6tyK0NEb+2GCyneCMJiGqrADCSNk8sQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-number": "^7.0.0"
      },
      "engines": {
        "node": ">=8.0"
      }
    },
    "node_modules/ts-node": {
      "version": "10.9.2",
      "resolved": "https://registry.npmjs.org/ts-node/-/ts-node-10.9.2.tgz",
      "integrity": "sha512-f0FFpIdcHgn8zcPSbf1dRevwt047YMnaiJM3u2w2RewrB+fob/zePZcrOyQoLMMO7aBIddLcQIEK5dYjkLnGrQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@cspotcode/source-map-support": "^0.8.0",
        "@tsconfig/node10": "^1.0.7",
        "@tsconfig/node12": "^1.0.7",
        "@tsconfig/node14": "^1.0.0",
        "@tsconfig/node16": "^1.0.2",
        "acorn": "^8.4.1",
        "acorn-walk": "^8.1.1",
        "arg": "^4.1.0",
        "create-require": "^1.1.0",
        "diff": "^4.0.1",
        "make-error": "^1.1.1",
        "v8-compile-cache-lib": "^3.0.1",
        "yn": "3.1.1"
      },
      "bin": {
        "ts-node": "dist/bin.js",
        "ts-node-cwd": "dist/bin-cwd.js",
        "ts-node-esm": "dist/bin-esm.js",
        "ts-node-script": "dist/bin-script.js",
        "ts-node-transpile-only": "dist/bin-transpile.js",
        "ts-script": "dist/bin-script-deprecated.js"
      },
      "peerDependencies": {
        "@swc/core": ">=1.2.50",
        "@swc/wasm": ">=1.2.50",
        "@types/node": "*",
        "typescript": ">=2.7"
      },
      "peerDependenciesMeta": {
        "@swc/core": {
          "optional": true
        },
        "@swc/wasm": {
          "optional": true
        }
      }
    },
    "node_modules/type-detect": {
      "version": "4.0.8",
      "resolved": "https://registry.npmjs.org/type-detect/-/type-detect-4.0.8.tgz",
      "integrity": "sha512-0fr/mIH1dlO+x7TlcMy+bIDqKPsw/70tVyeHW787goQjhmqaZe10uwLujubK9q9Lg6Fiho1KUKDYz0Z7k7g5/g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/type-fest": {
      "version": "0.21.3",
      "resolved": "https://registry.npmjs.org/type-fest/-/type-fest-0.21.3.tgz",
      "integrity": "sha512-t0rzBq87m3fVcduHDUFhKmyyX+9eo6WQjZvf51Ea/M0Q7+T374Jp1aUiyUl0GKxp8M/OETVHSDvmkyPgvX+X2w==",
      "dev": true,
      "license": "(MIT OR CC0-1.0)",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/typescript": {
      "version": "5.9.3",
      "resolved": "https://registry.npmjs.org/typescript/-/typescript-5.9.3.tgz",
      "integrity": "sha512-jl1vZzPDinLr9eUt3J/t7V6FgNEw9QjvBPdysz9KfQDD41fQrC2Y4vKQdiaUpFT4bXlb1RHhLpp8wtm6M5TgSw==",
      "dev": true,
      "license": "Apache-2.0",
      "bin": {
        "tsc": "bin/tsc",
        "tsserver": "bin/tsserver"
      },
      "engines": {
        "node": ">=14.17"
      }
    },
    "node_modules/undici-types": {
      "version": "6.21.0",
      "resolved": "https://registry.npmjs.org/undici-types/-/undici-types-6.21.0.tgz",
      "integrity": "sha512-iwDZqg0QAGrg9Rav5H4n0M64c3mkR59cJ6wQp+7C4nI0gsmExaedaYLNO44eT4AtBBwjbTiGPMlt2Md0T9H9JQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/unicode-emoji-modifier-base": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/unicode-emoji-modifier-base/-/unicode-emoji-modifier-base-1.0.0.tgz",
      "integrity": "sha512-yLSH4py7oFH3oG/9K+XWrz1pSi3dfUrWEnInbxMfArOfc1+33BlGPQtLsOYwvdMy11AwUBetYuaRxSPqgkq+8g==",
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/update-browserslist-db": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/update-browserslist-db/-/update-browserslist-db-1.1.4.tgz",
      "integrity": "sha512-q0SPT4xyU84saUX+tomz1WLkxUbuaJnR1xWt17M7fJtEJigJeWUNGUqrauFXsHnqev9y9JTRGwk13tFBuKby4A==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/browserslist"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "escalade": "^3.2.0",
        "picocolors": "^1.1.1"
      },
      "bin": {
        "update-browserslist-db": "cli.js"
      },
      "peerDependencies": {
        "browserslist": ">= 4.21.0"
      }
    },
    "node_modules/util-deprecate": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/util-deprecate/-/util-deprecate-1.0.2.tgz",
      "integrity": "sha512-EPD5q1uXyFxJpCrLnCc1nHnq3gOa6DZBocAIiI2TaSCA7VCJ1UJDMagCzIkXNsUYfD1daK//LTEQ8xiIbrHtcw==",
      "license": "MIT"
    },
    "node_modules/v8-compile-cache-lib": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/v8-compile-cache-lib/-/v8-compile-cache-lib-3.0.1.tgz",
      "integrity": "sha512-wa7YjyUGfNZngI/vtK0UHAN+lgDCxBPCylVXGp0zu59Fz5aiGtNXaq3DhIov063MorB+VfufLh3JlF2KdTK3xg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/v8-to-istanbul": {
      "version": "9.3.0",
      "resolved": "https://registry.npmjs.org/v8-to-istanbul/-/v8-to-istanbul-9.3.0.tgz",
      "integrity": "sha512-kiGUalWN+rgBJ/1OHZsBtU4rXZOfj/7rKQxULKlIzwzQSvMJUUNgPwJEEh7gU6xEVxC0ahoOBvN2YI8GH6FNgA==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "@jridgewell/trace-mapping": "^0.3.12",
        "@types/istanbul-lib-coverage": "^2.0.1",
        "convert-source-map": "^2.0.0"
      },
      "engines": {
        "node": ">=10.12.0"
      }
    },
    "node_modules/walker": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/walker/-/walker-1.0.8.tgz",
      "integrity": "sha512-ts/8E8l5b7kY0vlWLewOkDXMmPdLcVV4GmOQLyxuSswIJsweeFZtAsMF7k1Nszz+TYBQrlYRmzOnr398y1JemQ==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "makeerror": "1.0.12"
      }
    },
    "node_modules/wcwidth": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/wcwidth/-/wcwidth-1.0.1.tgz",
      "integrity": "sha512-XHPEwS0q6TaxcvG85+8EYkbiCux2XtWG2mkc47Ng2A77BQu9+DqIOJldST4HgPkuea7dvKSj5VgX3P1d4rW8Tg==",
      "license": "MIT",
      "dependencies": {
        "defaults": "^1.0.3"
      }
    },
    "node_modules/which": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/which/-/which-2.0.2.tgz",
      "integrity": "sha512-BLI3Tl1TW3Pvl70l3yq3Y64i+awpwXqsGBYWkkqMtnbXgrMD+yj7rhW0kuEDxzJaYXGjEW5ogapKNMEKNMjibA==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "isexe": "^2.0.0"
      },
      "bin": {
        "node-which": "bin/node-which"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/wrap-ansi": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-7.0.0.tgz",
      "integrity": "sha512-YVGIj2kamLSTxw6NsZjoBxfSwsn0ycdesmc4p+Q21c5zPuZ1pl+NfxVdxPtdHvmNVOQ6XSYG4AUtyt/Fi7D16Q==",
      "license": "MIT",
      "dependencies": {
        "ansi-styles": "^4.0.0",
        "string-width": "^4.1.0",
        "strip-ansi": "^6.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/wrap-ansi?sponsor=1"
      }
    },
    "node_modules/wrappy": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/wrappy/-/wrappy-1.0.2.tgz",
      "integrity": "sha512-l4Sp/DRseor9wL6EvV2+TuQn63dMkPjZ/sp9XkghTEbV9KlPS1xUsZ3u7/IQO4wxtcFB4bgpQPRcR3QCvezPcQ==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/write-file-atomic": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/write-file-atomic/-/write-file-atomic-4.0.2.tgz",
      "integrity": "sha512-7KxauUdBmSdWnmpaGFg+ppNjKF8uNLry8LyzjauQDOVONfFLNKrKvQOxZ/VuTIcS/gge/YNahf5RIIQWTSarlg==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "imurmurhash": "^0.1.4",
        "signal-exit": "^3.0.7"
      },
      "engines": {
        "node": "^12.13.0 || ^14.15.0 || >=16.0.0"
      }
    },
    "node_modules/y18n": {
      "version": "5.0.8",
      "resolved": "https://registry.npmjs.org/y18n/-/y18n-5.0.8.tgz",
      "integrity": "sha512-0pfFzegeDWJHJIAmTLRP2DwHjdF5s7jo9tuztdQxAhINCdvS+3nGINqPd00AphqJR/0LhANUS6/+7SCb98YOfA==",
      "license": "ISC",
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/yallist": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/yallist/-/yallist-3.1.1.tgz",
      "integrity": "sha512-a4UGQaWPH59mOXUYnAG2ewncQS4i4F43Tv3JoAM+s2VDAmS9NsK8GpDMLrCHPksFT7h3K6TOoUNn2pb7RoXx4g==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/yargs": {
      "version": "17.7.2",
      "resolved": "https://registry.npmjs.org/yargs/-/yargs-17.7.2.tgz",
      "integrity": "sha512-7dSzzRQ++CKnNI/krKnYRV7JKKPUXMEh61soaHKg9mrWEhzFWhFnxPxGl+69cD1Ou63C13NUPCnmIcrvqCuM6w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "cliui": "^8.0.1",
        "escalade": "^3.1.1",
        "get-caller-file": "^2.0.5",
        "require-directory": "^2.1.1",
        "string-width": "^4.2.3",
        "y18n": "^5.0.5",
        "yargs-parser": "^21.1.1"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/yargs-parser": {
      "version": "21.1.1",
      "resolved": "https://registry.npmjs.org/yargs-parser/-/yargs-parser-21.1.1.tgz",
      "integrity": "sha512-tVpsJW7DdjecAiFpbIB1e3qxIQsE6NoPc5/eTdrbbIC4h0LVsWhnoa3g+m2HclBIujHzsxZ4VJVA+GUuc2/LBw==",
      "dev": true,
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/yn": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/yn/-/yn-3.1.1.tgz",
      "integrity": "sha512-Ux4ygGWsu2c7isFWe8Yu1YluJmqVhxqK2cLXNQA5AcC3QfbGNpM7fu0Y8b/z16pXLnFxZYvWhd3fhBY9DLmC6Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/yocto-queue": {
      "version": "0.1.0",
      "resolved": "https://registry.npmjs.org/yocto-queue/-/yocto-queue-0.1.0.tgz",
      "integrity": "sha512-rVksvsnNCdJ/ohGc6xgPwyN8eheCxsiLM8mxuE/t/mOVqJewPuO1miLpTHQiRgTKCLexL4MeAFVagts7HmNZ2Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/zod": {
      "version": "4.3.5",
      "resolved": "https://registry.npmjs.org/zod/-/zod-4.3.5.tgz",
      "integrity": "sha512-k7Nwx6vuWx1IJ9Bjuf4Zt1PEllcwe7cls3VNzm4CQ1/hgtFUK2bRNG3rvnpPUhFjmqJKAKtjV576KnUkHocg/g==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/colinhacks"
      }
    }
  }
}

````

## 📄 package.json

````json
{
  "name": "yuangs",
  "version": "2.11.0",
  "description": "苑广山的个人应用集合 CLI（彩色版）",
  "author": "苑广山",
  "license": "ISC",
  "bin": {
    "yuangs": "dist/cli.js"
  },
  "main": "dist/cli.js",
  "types": "dist/cli.d.ts",
  "files": [
    "dist"
  ],
  "scripts": {
    "dev": "ts-node src/cli.ts",
    "build": "tsc",
    "prepare": "npm run build",
    "prepublishOnly": "npm run build",
    "test": "jest",
    "verify": "./verify.sh"
  },
  "keywords": [
    "yuangs",
    "cli",
    "tools",
    "colorful"
  ],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/yuanguangshan/npm_yuangs.git"
  },
  "bugs": {
    "url": "https://github.com/yuanguangshan/npm_yuangs/issues"
  },
  "homepage": "https://github.com/yuanguangshan/npm_yuangs#readme",
  "dependencies": {
    "axios": "^1.13.2",
    "chalk": "^4.1.2",
    "commander": "^13.1.0",
    "js-yaml": "^4.1.0",
    "json5": "^2.2.3",
    "marked": "^15.0.12",
    "marked-terminal": "^7.3.0",
    "ora": "^6.3.1",
    "zod": "^4.3.5"
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.9",
    "@types/json5": "^0.0.30",
    "@types/marked": "^5.0.2",
    "@types/marked-terminal": "^6.1.1",
    "@types/node": "^20.11.30",
    "@types/ora": "^3.1.0",
    "jest": "^29.7.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.9.3"
  },
  "engines": {
    "node": ">=18"
  },
  "publishConfig": {
    "access": "public"
  }
}

````

## 📄 poeapi_go.code-workspace

````text
{
	"folders": [
		{
			"name": "npm_yuangs",
			"path": "."
		}
	],
	"settings": {}
}
````

## 📄 src/agent/AgentPipeline.ts

````typescript
import {
    AgentInput,
    AgentMode,
} from './types';

import { inferIntent } from './intent';
import { buildContext } from './context';
import { buildPrompt } from './prompt';
import { selectModel } from './selectModel';
import { runLLM } from './llm';
import { interpretResultToPlan } from './interpret';
import { executePlan } from './planExecutor';
import { saveRecord } from './record';
import { learnSkillFromRecord } from './skills';
import { randomUUID } from 'crypto';

export class AgentPipeline {
    async run(input: AgentInput, mode: AgentMode): Promise<void> {
        const id = randomUUID();

        // 1. Intent Analysis
        const intent = inferIntent(input, mode);

        // 2. Context Assembly
        const context = buildContext(input);

        // 3. Prompt Construction
        const prompt = buildPrompt(intent, context, mode, input.rawInput);

        // 4. Model Selection
        const model = selectModel(intent, input.options?.model);

        // 5. LLM Execution
        const result = await runLLM({
            prompt,
            model,
            stream: mode === 'chat',
            onChunk: mode === 'chat'
                ? (s) => process.stdout.write(s)
                : undefined,
        });

        // 6. Result Interpretation -> Plan
        const isStreaming = mode === 'chat';
        const plan = interpretResultToPlan(result, intent, mode, isStreaming);
        result.plan = plan; // Attach plan to result for recording

        // 7. Save Execution Record (before execution for safety)
        saveRecord({
            id,
            timestamp: Date.now(),
            mode,
            input,
            prompt,
            model,
            llmResult: result,
            action: plan.tasks[0]?.type === 'shell' ? {
                type: 'execute',
                command: plan.tasks[0].payload.command,
                risk: plan.tasks[0].payload.risk
            } : { type: 'print', content: result.rawText }, // For backward compatibility with record.action
        });

        // 8. Plan Execution
        const summary = await executePlan(plan, input.options);

        // 9. Post-execution: Learn Skill if successful
        learnSkillFromRecord({
            id,
            timestamp: Date.now(),
            mode,
            input,
            prompt,
            model,
            llmResult: result,
            action: plan.tasks[0]?.type === 'shell' ? {
                type: 'execute',
                command: plan.tasks[0].payload.command,
                risk: plan.tasks[0].payload.risk
            } : { type: 'print', content: result.rawText },
        }, summary.success);

        // Log execution metrics if verbose
        if (input.options?.verbose) {
            console.log(`\n${'-'.repeat(50)}`);
            console.log(`Execution ID: ${id}`);
            console.log(`Model: ${model}`);
            console.log(`Latency: ${result.latencyMs}ms`);
            if (result.tokens) {
                console.log(`Tokens: ${result.tokens.total}`);
            }
            console.log(`${'-'.repeat(50)}\n`);
        }
    }
}

````

## 📄 src/agent/actions.ts

````typescript
import { AgentAction } from './types';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import readline from 'readline';

const execAsync = promisify(exec);

export async function executeAction(
    action: AgentAction,
    options?: { autoYes?: boolean }
): Promise<void> {
    if (action.type === 'print') {
        console.log(action.content);
        return;
    }

    if (action.type === 'confirm') {
        const ok = options?.autoYes || await confirm('Execute this action?');
        if (ok) {
            await executeAction(action.next, options);
        }
        return;
    }

    if (action.type === 'execute') {
        try {
            console.log(chalk.cyan(`\nExecuting: ${action.command}\n`));
            const { stdout, stderr } = await execAsync(action.command, {
                shell: typeof process.env.SHELL === 'string' ? process.env.SHELL : undefined
            });
            if (stdout) console.log(stdout);
            if (stderr) console.error(chalk.yellow(stderr));
        } catch (error: any) {
            console.error(chalk.red(`Execution failed: ${error.message}`));
            throw error;
        }
    }
}

async function confirm(message: string): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(chalk.cyan(`${message} (y/N): `), (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}

````

## 📄 src/agent/context.ts

````typescript
import { AgentInput, AgentContext } from './types';
import { ContextBuffer } from '../commands/contextBuffer';

// Create a singleton instance for the agent
const globalContextBuffer = new ContextBuffer();

export function buildContext(input: AgentInput): AgentContext {
    const items = globalContextBuffer.export();

    return {
        files: items.map(item => ({
            path: item.path,
            content: item.content,
        })),
        gitDiff: undefined, // Will be enhanced later
        history: [], // Will be populated from conversation history
    };
}

export function getAgentContextBuffer(): ContextBuffer {
    return globalContextBuffer;
}

````

## 📄 src/agent/index.ts

````typescript
export { AgentPipeline } from './AgentPipeline';
export * from './types';

````

## 📄 src/agent/intent.ts

````typescript
import { AgentInput, AgentIntent, AgentMode } from './types';
import { inferCapabilityRequirement } from '../core/capabilityInference';
import { AtomicCapability } from '../core/capabilities';

export function inferIntent(
    input: AgentInput,
    mode: AgentMode
): AgentIntent {
    if (mode === 'chat') {
        return {
            type: 'chat',
            capabilities: {
                reasoning: true,
                streaming: true,
                longContext: true,
            },
        };
    }

    // For command mode, use the existing capability inference
    const capReq = inferCapabilityRequirement(input.rawInput);

    return {
        type: 'shell',
        capabilities: {
            reasoning: capReq.required.includes(AtomicCapability.REASONING),
            code: capReq.required.includes(AtomicCapability.CODE_GENERATION),
            longContext: capReq.required.includes(AtomicCapability.LONG_CONTEXT),
        },
    };
}

````

## 📄 src/agent/interpret.ts

````typescript
import { AgentIntent, AgentMode, LLMResult } from './types';
import { AgentPlan } from './plan';

export function interpretResultToPlan(
    result: LLMResult,
    intent: AgentIntent,
    mode: AgentMode,
    alreadyStreamed: boolean = false
): AgentPlan {
    if (mode === 'chat') {
        const tasks = alreadyStreamed ? [] : [{
            id: 'chat-response',
            description: '输出 AI 回答',
            type: 'custom' as const,
            status: 'pending' as const,
            payload: { kind: 'print', text: result.rawText }
        }];

        return {
            goal: '回答用户咨询',
            tasks: tasks
        };
    }

    const aiPlan = result.parsed;
    if (!aiPlan || (!aiPlan.command && !aiPlan.macro)) {
        throw new Error('AI 未能生成有效的执行计划');
    }

    const command = aiPlan.command || aiPlan.macro; // 暂时简化处理

    return {
        goal: aiPlan.plan || '执行 Shell 命令',
        tasks: [
            {
                id: 'exec-shell',
                description: `执行命令: ${command}`,
                type: 'shell',
                status: 'pending',
                payload: {
                    command: command,
                    risk: aiPlan.risk ?? 'medium'
                }
            }
        ]
    };
}

````

## 📄 src/agent/llm.ts

````typescript
import { AgentPrompt, LLMResult } from './types';
import { callAI_Stream } from '../ai/client';
import axios from 'axios';
import { DEFAULT_AI_PROXY_URL, DEFAULT_MODEL, DEFAULT_ACCOUNT_TYPE, type AIRequestMessage } from '../core/validation';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { safeParseJSON } from '../core/validation';

const CONFIG_FILE = path.join(os.homedir(), '.yuangs.json');

function getUserConfig(): any {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const content = fs.readFileSync(CONFIG_FILE, 'utf8');
            return JSON.parse(content);
        } catch (e) { }
    }
    return {};
}

export async function runLLM({
    prompt,
    model,
    stream,
    onChunk,
}: {
    prompt: AgentPrompt;
    model: string;
    stream: boolean;
    onChunk?: (s: string) => void;
}): Promise<LLMResult> {
    const start = Date.now();

    if (stream) {
        let raw = '';
        await callAI_Stream(prompt.messages, model, (chunk) => {
            raw += chunk;
            onChunk?.(chunk);
        });
        return {
            rawText: raw,
            latencyMs: Date.now() - start,
        };
    }

    // Non-streaming mode with optional schema
    const config = getUserConfig();
    const url = config.aiProxyUrl || DEFAULT_AI_PROXY_URL;

    const headers = {
        'Content-Type': 'application/json',
        'X-Client-ID': 'npm_yuangs',
        'Origin': 'https://cli.want.biz',
        'Referer': 'https://cli.want.biz/',
        'account': config.accountType || DEFAULT_ACCOUNT_TYPE,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json'
    };

    const data = {
        model: model || config.defaultModel || DEFAULT_MODEL,
        messages: prompt.messages,
        stream: false
    };

    try {
        const response = await axios.post(url, data, { headers });
        const rawText = response.data.choices[0]?.message?.content || '';

        let parsed = undefined;
        if (prompt.outputSchema) {
            const parseResult = safeParseJSON(rawText, prompt.outputSchema, {});
            if (parseResult.success) {
                parsed = parseResult.data;
            }
        }

        return {
            rawText,
            parsed,
            latencyMs: Date.now() - start,
        };
    } catch (error: any) {
        const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message || '未知错误';
        throw new Error(`AI 请求失败: ${errorMsg}`);
    }
}

````

## 📄 src/agent/plan.ts

````typescript
export interface AgentPlan {
    goal: string;
    tasks: AgentTask[];
}

export interface AgentTask {
    id: string;
    description: string;
    type: 'llm' | 'shell' | 'custom';
    dependsOn?: string[];
    payload?: any;
    status: 'pending' | 'running' | 'success' | 'failed';
    result?: any;
}

````

## 📄 src/agent/planExecutor.ts

````typescript
import { AgentPlan, AgentTask } from './plan';
import { executeAction } from './actions';
import chalk from 'chalk';

export interface PlanExecutionSummary {
    success: boolean;
    completedCount: number;
    totalCount: number;
}

export async function executePlan(
    plan: AgentPlan,
    options?: { autoYes?: boolean; verbose?: boolean }
): Promise<PlanExecutionSummary> {
    const completed = new Set<string>();
    const failed = new Set<string>();

    if (options?.verbose) {
        console.log(chalk.bold.cyan(`\n🚀 开始执行计划: ${plan.goal}`));
        console.log(chalk.gray(`共 ${plan.tasks.length} 个任务\n`));
    }

    for (const task of plan.tasks) {
        // 检查依赖
        if (task.dependsOn?.some(depId => !completed.has(depId))) {
            if (options?.verbose) {
                console.log(chalk.yellow(`⏭️ 跳过任务 ${task.id}: 依赖未完成`));
            }
            continue;
        }

        if (failed.has(task.id)) continue;

        try {
            task.status = 'running';
            if (options?.verbose) {
                console.log(chalk.cyan(`⚙️ 执行任务 ${task.id}: ${task.description}`));
            }

            await executeTask(task, options);

            task.status = 'success';
            completed.add(task.id);
        } catch (error: any) {
            task.status = 'failed';
            failed.add(task.id);
            console.error(chalk.red(`❌ 任务 ${task.id} 失败: ${error.message}`));
            // 如果一个任务失败，后续依赖它的任务都会被跳过
        }
    }

    if (options?.verbose) {
        console.log(chalk.bold.green(`\n✅ 计划执行完成 (${completed.size}/${plan.tasks.length} 成功)\n`));
    }

    return {
        success: failed.size === 0 && completed.size > 0,
        completedCount: completed.size,
        totalCount: plan.tasks.length
    };
}

async function executeTask(
    task: AgentTask,
    options?: { autoYes?: boolean }
): Promise<void> {
    switch (task.type) {
        case 'shell':
            await executeAction({
                type: 'confirm',
                next: {
                    type: 'execute',
                    command: task.payload.command,
                    risk: task.payload.risk || 'medium'
                }
            }, options);
            break;

        case 'custom':
            if (task.payload?.kind === 'print' && task.payload?.text) {
                console.log(task.payload.text);
            }
            break;

        case 'llm':
            // 未来可以支持任务中再次调用 LLM (Recursive Agent)
            console.log(chalk.gray(`[LLM Task] ${task.description} (Not implemented in MVP)`));
            break;
    }
}

````

## 📄 src/agent/prompt.ts

````typescript
import {
    AgentIntent,
    AgentContext,
    AgentMode,
    AgentPrompt,
} from './types';
import { buildCommandPrompt as buildCommandPromptString } from '../ai/prompt';
import { getOSProfile } from '../core/os';
import { getMacros } from '../core/macros';
import { aiCommandPlanSchema } from '../core/validation';
import { getRelevantSkills } from './skills';

export function buildPrompt(
    intent: AgentIntent,
    context: AgentContext,
    mode: AgentMode,
    input: string
): AgentPrompt {
    if (mode === 'chat') {
        return buildChatPrompt(context, input);
    }

    return buildCommandPromptObject(input, context);
}

function buildChatPrompt(
    context: AgentContext,
    input: string
): AgentPrompt {
    const messages: any[] = [
        ...(context.history ?? []),
    ];

    // Add context files if available
    if (context.files && context.files.length > 0) {
        const contextDesc = context.files.map(f =>
            `File: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``
        ).join('\n\n');

        messages.push({
            role: 'system',
            content: `Context:\n${contextDesc}`,
        });
    }

    messages.push({
        role: 'user',
        content: input,
    });

    return {
        system: 'You are a helpful AI assistant with expertise in software development, system administration, and problem-solving.',
        messages,
    };
}

function buildCommandPromptObject(
    input: string,
    context: AgentContext
): AgentPrompt {
    const os = getOSProfile();
    const macros = getMacros();
    const skills = getRelevantSkills(input);
    let promptText = buildCommandPromptString(input, os, macros);

    if (skills.length > 0) {
        const skillList = skills.map(s => `- ${s.name}: 当遇到 "${s.whenToUse}" 时，你可以参考计划: ${s.planTemplate.goal}`).join('\n');
        promptText = `【参考技能库】\n${skillList}\n\n${promptText}`;
    }

    return {
        messages: [
            {
                role: 'user',
                content: promptText,
            },
        ],
        outputSchema: aiCommandPlanSchema,
    };
}

````

## 📄 src/agent/record.ts

````typescript
import {
    AgentInput,
    AgentMode,
    AgentPrompt,
    LLMResult,
    AgentAction,
} from './types';

export interface ExecutionRecord {
    id: string;
    timestamp: number;
    mode: AgentMode;
    input: AgentInput;
    prompt: AgentPrompt;
    model: string;
    llmResult: LLMResult;
    action: AgentAction;
}

const records: ExecutionRecord[] = [];

export function saveRecord(record: ExecutionRecord) {
    records.push(record);
    // Keep only last 100 records in memory
    if (records.length > 100) {
        records.shift();
    }
}

export function getRecords(): ExecutionRecord[] {
    return [...records];
}

export function getRecordById(id: string): ExecutionRecord | undefined {
    return records.find(r => r.id === id);
}

````

## 📄 src/agent/replay.ts

````typescript
import { ExecutionRecord } from './record';
import { runLLM } from './llm';
import { interpretResultToPlan } from './interpret';
import { AgentIntent } from './types';

export async function replay(record: ExecutionRecord) {
    console.log(`\nReplaying execution: ${record.id}`);
    console.log(`Original timestamp: ${new Date(record.timestamp).toISOString()}`);
    console.log(`Mode: ${record.mode}\n`);

    const result = await runLLM({
        prompt: record.prompt,
        model: record.model,
        stream: record.mode === 'chat',
        onChunk: record.mode === 'chat'
            ? (s) => process.stdout.write(s)
            : undefined,
    });

    // Create a minimal intent for interpretation
    const intent: AgentIntent = {
        type: record.mode === 'chat' ? 'chat' : 'shell',
        capabilities: {},
    };

    return interpretResultToPlan(result, intent, record.mode);
}

````

## 📄 src/agent/selectModel.ts

````typescript
import { AgentIntent } from './types';

export function selectModel(
    intent: AgentIntent,
    override?: string
): string {
    if (override) return override;

    const caps = intent.capabilities;

    // Long context + reasoning = most powerful model
    if (caps.longContext && caps.reasoning) {
        return 'gemini-2.0-flash-exp';
    }

    // Code-focused tasks
    if (caps.code) {
        return 'gemini-2.5-flash-lite';
    }

    // Default to balanced model
    return 'gemini-2.5-flash-lite';
}

````

## 📄 src/agent/skills.ts

````typescript
import { AgentPlan } from './plan';
import { ExecutionRecord } from './record';

export interface Skill {
    id: string;
    name: string;
    description: string;
    whenToUse: string; // 触发场景描述
    planTemplate: AgentPlan;

    // 评价指标
    successCount: number;
    failureCount: number;
    confidence: number; // 0 ~ 1, 初始 0.5

    // 时间戳
    lastUsed: number;
    createdAt: number;
}

let skillLibrary: Skill[] = [];

/**
 * 计算技能分 (0 ~ 1)
 */
function computeSkillScore(skill: Skill, now: number = Date.now()): number {
    const totalUses = skill.successCount + skill.failureCount;
    const successRate = totalUses === 0 ? 0.5 : skill.successCount / totalUses;

    // 时间衰减 (Freshness): 半衰期约 14 天
    const idleDays = (now - skill.lastUsed) / (1000 * 60 * 60 * 24);
    const freshness = Math.exp(-idleDays / 14);

    // 综合得分: 45% 成功率 + 35% 新鲜度 + 20% 置信度
    return (0.45 * successRate) + (0.35 * freshness) + (0.20 * skill.confidence);
}

/**
 * 更新技能状态 (执行后调用)
 */
export function updateSkillStatus(skillId: string, success: boolean) {
    const skill = skillLibrary.find(s => s.id === skillId);
    if (!skill) return;

    skill.lastUsed = Date.now();
    if (success) {
        skill.successCount++;
        // 成功奖励: 置信度缓慢提升
        skill.confidence = Math.min(1, skill.confidence + 0.05);
    } else {
        skill.failureCount++;
        // 失败惩罚: 惩罚力度大于奖励，防止系统“自嗨”
        skill.confidence = Math.max(0, skill.confidence - 0.1);
    }
}

/**
 * 自动学习新技能
 */
export function learnSkillFromRecord(record: ExecutionRecord, success: boolean = true) {
    if (record.mode === 'chat' || !record.llmResult.plan) return;

    const existingSkill = skillLibrary.find(s => s.name === record.llmResult.plan?.goal);

    if (existingSkill) {
        updateSkillStatus(existingSkill.id, success);
        return;
    }

    // 只有成功的记录才被学为新技能
    if (!success) return;

    const now = Date.now();
    skillLibrary.push({
        id: record.id,
        name: record.llmResult.plan.goal,
        description: `自动学习的技能: ${record.llmResult.plan.goal}`,
        whenToUse: record.input.rawInput,
        planTemplate: record.llmResult.plan,
        successCount: 1,
        failureCount: 0,
        confidence: 0.5,
        lastUsed: now,
        createdAt: now
    });

    // 每学习一次，尝试清理一次“冷”技能
    reapColdSkills();
}

/**
 * 筛选并排序技能 (用于注入 Prompt)
 */
export function getRelevantSkills(input: string, limit: number = 3): Skill[] {
    const now = Date.now();

    return skillLibrary
        // 1. 基础筛选: 剔除评分过低的技能 (硬淘汰阈值 0.3)
        .filter(s => computeSkillScore(s, now) >= 0.3)
        // 2. 排序: 按综合分排序
        .sort((a, b) => computeSkillScore(b, now) - computeSkillScore(a, now))
        // 3. 取上限
        .slice(0, limit);
}

/**
 * 清理过期或低质技能 (Reaper)
 */
export function reapColdSkills() {
    const now = Date.now();

    skillLibrary = skillLibrary.filter(skill => {
        const score = computeSkillScore(skill, now);
        const idleDays = (now - skill.lastUsed) / (1000 * 60 * 60 * 24);

        // 满足以下任一条件则淘汰:
        // 1. 得分极低且长期不用
        if (score < 0.25 && idleDays > 30) return false;
        // 2. 失败率极高且尝试过一定次数
        if (skill.failureCount > 5 && (skill.successCount / (skill.successCount + skill.failureCount)) < 0.2) return false;

        return true;
    });

    // 强制保持容量
    if (skillLibrary.length > 100) {
        // 如果还超标，移除得分最低的那个
        skillLibrary.sort((a, b) => computeSkillScore(a, now) - computeSkillScore(b, now));
        skillLibrary.shift();
    }
}

export function getAllSkills(): Skill[] {
    return [...skillLibrary];
}

````

## 📄 src/agent/types.ts

````typescript
import type { AIRequestMessage } from '../core/validation';
import { AgentPlan } from './plan';

export type AgentMode = 'chat' | 'command' | 'command+exec';

export interface AgentInput {
    rawInput: string;
    stdin?: string;
    context?: AgentContext;
    options?: {
        model?: string;
        stream?: boolean;
        autoYes?: boolean;
        verbose?: boolean;
    };
}

export interface AgentContext {
    files?: Array<{ path: string; content: string }>;
    gitDiff?: string;
    history?: AIRequestMessage[];
}

export interface AgentIntent {
    type: 'chat' | 'shell' | 'analysis';
    capabilities: {
        reasoning?: boolean;
        code?: boolean;
        longContext?: boolean;
        streaming?: boolean;
    };
}

export interface AgentPrompt {
    system?: string;
    messages: AIRequestMessage[];
    outputSchema?: any;
}

export interface LLMResult {
    rawText: string;
    parsed?: any;
    plan?: AgentPlan;
    latencyMs: number;
    tokens?: {
        prompt: number;
        completion: number;
        total: number;
    };
    costUsd?: number;
}

export type AgentAction =
    | { type: 'print'; content: string }
    | { type: 'confirm'; next: AgentAction }
    | { type: 'execute'; command: string; risk: 'low' | 'medium' | 'high' };

````

## 📄 src/ai/client.ts

````typescript
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { DEFAULT_AI_PROXY_URL, DEFAULT_MODEL, DEFAULT_ACCOUNT_TYPE, type UserConfig, type AIRequestMessage } from '../core/validation';

const CONFIG_FILE = path.join(os.homedir(), '.yuangs.json');

let conversationHistory: AIRequestMessage[] = [];

export function addToConversationHistory(role: 'system' | 'user' | 'assistant', content: string) {
    conversationHistory.push({ role, content });
    if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
    }
}

export function clearConversationHistory() {
    conversationHistory = [];
}

export function getConversationHistory() {
    return conversationHistory;
}

export function getUserConfig(): UserConfig {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const content = fs.readFileSync(CONFIG_FILE, 'utf8');
            return JSON.parse(content) as UserConfig;
        } catch (e) { }
    }
    return {};
}

export async function askAI(prompt: string, model?: string): Promise<string> {
    const config = getUserConfig();
    const url = config.aiProxyUrl || DEFAULT_AI_PROXY_URL;

    const headers = {
        'Content-Type': 'application/json',
        'X-Client-ID': 'npm_yuangs',
        'Origin': 'https://cli.want.biz',
        'Referer': 'https://cli.want.biz/',
        'account': config.accountType || DEFAULT_ACCOUNT_TYPE,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json'
    };

    const data = {
        model: model || config.defaultModel || DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        stream: false
    };

    try {
        const response = await axios.post(url, data, { headers });
        const content = response.data?.choices?.[0]?.message?.content;
        return content || '';
    } catch (error: any) {
        const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message || '未知错误';
        throw new Error(`AI 请求失败: ${errorMsg}`);
    }
}

export async function callAI_Stream(messages: AIRequestMessage[], model: string | undefined, onChunk: (content: string) => void): Promise<void> {
    const config = getUserConfig();
    const url = config.aiProxyUrl || DEFAULT_AI_PROXY_URL;

    const response = await axios({
        method: 'post',
        url: url,
        data: {
            model: model || config.defaultModel || DEFAULT_MODEL,
            messages: messages,
            stream: true
        },
        responseType: 'stream',
        headers: {
            'Content-Type': 'application/json',
            'X-Client-ID': 'npm_yuangs',
            'Origin': 'https://cli.want.biz',
            'Referer': 'https://cli.want.biz/',
            'account': config.accountType || DEFAULT_ACCOUNT_TYPE,
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
            'Accept': 'application/json'
        }
    });

    return new Promise((resolve, reject) => {
        let buffer = '';
        response.data.on('data', (chunk: Buffer) => {
            buffer += chunk.toString();
            let lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('data: ')) {
                    const data = trimmedLine.slice(6);
                    if (data === '[DONE]') {
                        resolve();
                        return;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content || '';
                        if (content) onChunk(content);
                    } catch (e) { }
                }
            }
        });
        response.data.on('error', reject);
        response.data.on('end', () => {
            resolve();
        });
    });
}

````

## 📄 src/ai/prompt.ts

````typescript
import { OSProfile } from '../core/os';
import type { Macro } from '../core/validation';

export function buildCommandPrompt(
    userInput: string,
    os: OSProfile,
    macros?: Record<string, Macro>
): string {
    const macroContext = macros && Object.keys(macros).length > 0
        ? `
【可复用的快捷指令 (Macros)】
以下是可以直接复用的已验证命令。优先复用这些指令，而不是生成新命令：

${Object.entries(macros).map(([name, macro]) => `  - ${name}: ${macro.description || '(无描述)'}`).join('\n')}

当用户的需求与某个 Macro 匹配或相似时：
1. 优先使用该 Macro
2. 在 JSON 输出中使用 "macro" 字段指定 Macro 名称，而不是 "command" 字段
3. 仅在没有合适 Macro 时才生成新命令
`
        : '';

    return `
你是一个专业的命令行专家。

【系统环境】
- 操作系统: ${os.name}
- Shell: ${os.shell}
- find 实现: ${os.find}
- stat 实现: ${os.stat}

【规则】
- 命令必须与当前系统兼容。
- 如果是 macOS (BSD):
  - 不允许使用 find -printf
  - 优先使用 stat -f
- 如果是 Linux (GNU):
  - 可使用 find -printf
- 默认不使用 sudo。
- 确保输出的命令是单行或者使用 && 连接。
- 不要解释，只输出符合以下 JSON 结构的文本。
- 优先复用已验证的快捷指令（Macros），每个 Macro 都是经过人工验证的可靠命令。在生成新命令前，检查是否已有 Macro 可以完成任务。

${macroContext}

【输出 JSON 结构】
{
  "plan": "简要说明你准备执行的步骤",
  "command": "可直接执行的 shell 命令（仅当没有合适 Macro 时提供）",
  "macro": "要复用的 Macro 名称（优先使用，与 command 二选一）",
  "risk": "low | medium | high"
}

【用户需求】
${userInput}
`;
}

export function buildFixPrompt(
    originalCmd: string,
    stderr: string,
    os: OSProfile
): string {
    return `
该命令在 ${os.name} 上执行失败：

命令：
${originalCmd}

错误信息：
${stderr}

请生成一个 **${os.name} 兼容** 的等价命令。
依然只输出 JSON 格式。注意：这是修复命令，不需要检查 Macro。

{
  "plan": "修复说明",
  "command": "修复后的命令",
  "risk": "low | medium | high"
}
`;
}

````

## 📄 src/ai/types.ts

````typescript
export { AICommandPlan, type AICommandPlan as AICommandPlanType } from '../core/validation';

````

## 📄 src/cli.ts

````typescript
#!/usr/bin/env node
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { Command } from 'commander';
import { handleAICommand } from './commands/handleAICommand';
import { handleAIChat } from './commands/handleAIChat';
import { handleConfig } from './commands/handleConfig';
import { registerCapabilityCommands } from './commands/capabilityCommands';
import { loadAppsConfig, openUrl, DEFAULT_APPS } from './core/apps';
import { getMacros, saveMacro, runMacro } from './core/macros';
import { getCommandHistory } from './utils/history';

// Mandatory Node.js version check
const majorVersion = Number(process.versions.node.split('.')[0]);
if (majorVersion < 18) {
    console.error(chalk.red(`Error: yuangs requires Node.js >= 18. Current version: ${process.version}`));
    process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const version = packageJson.version;

const program = new Command();

program
    .name('yuangs')
    .description('苑广山的个人命令行工具')
    .version(version, '-V, --version');

async function readStdin(): Promise<string> {
    if (process.stdin.isTTY) return '';
    return new Promise((resolve) => {
        let data = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', chunk => data += chunk);
        process.stdin.on('end', () => resolve(data));
        // Simple timeout to avoid hanging if no input
        setTimeout(() => resolve(data), 2000);
    });
}

function parseOptionsFromArgs(args: string[]): {
    exec: boolean;
    model?: string;
    withContent: boolean;
} {
    return {
        exec: args.includes('-e') || args.includes('--exec'),
        model: getArgValue(args, ['-m', '--model']) || getModelFromShortcuts(args),
        withContent: args.includes('-w') || args.includes('--with-content')
    };
}

function getModelFromShortcuts(args: string[]): string | undefined {
    if (args.includes('-p')) return 'gemini-2.5-flash-lite';
    if (args.includes('-f')) return 'gemini-2.5-flash-lite';
    if (args.includes('-l')) return 'gemini-2.5-flash-lite';
    return undefined;
}

function getArgValue(args: string[], flags: string[]): string | undefined {
    for (let i = 0; i < args.length; i++) {
        for (const flag of flags) {
            if (args[i] === flag && i + 1 < args.length && !args[i + 1].startsWith('-')) {
                return args[i + 1];
            }
        }
    }
    return undefined;
}

program
    .command('ai [question...]')
    .description('向 AI 提问')
    .option('-e, --exec', '生成并执行 Linux 命令')
    .option('-m, --model <model>', '指定 AI 模型')
    .option('-p', '使用 Pro 模型 (gemini-2.5-flash-lite)')
    .option('-f', '使用 Flash 模型 (gemini-2.5-flash-lite)')
    .option('-l', '使用 Lite 模型 (gemini-2.5-flash-lite)')
    .option('-w, --with-content', '在管道模式下读取文件内容')
    .option('--verbose', '详细输出（显示 Capability 匹配详情）')
    .action(async (questionArgs, options) => {
        const stdinData = await readStdin();
        let question = Array.isArray(questionArgs) ? questionArgs.join(' ').trim() : questionArgs || '';

        if (stdinData) {
            if (options.withContent) {
                const { parseFilePathsFromLsOutput, readFilesContent, buildPromptWithFileContent } = await import('./core/fileReader');
                const filePaths = parseFilePathsFromLsOutput(stdinData);
                const contentMap = readFilesContent(filePaths);
                question = buildPromptWithFileContent(stdinData, filePaths, contentMap, question || undefined);
            } else {
                question = `以下是输入内容：\n\n${stdinData}\n\n我的问题是：${question || '分析以上内容'}`;
            }
        }

        let model = options.model;
        if (options.p) model = 'gemini-2.5-flash-lite';
        if (options.f) model = 'gemini-2.5-flash-lite';
        if (options.l) model = 'gemini-2.5-flash-lite';

        if (options.exec) {
            await handleAICommand(question, { execute: false, model, verbose: options.verbose });
        } else {
            await handleAIChat(question || null, model);
        }
    });

program
    .command('list')
    .description('列出所有应用')
    .action(() => {
        const apps = loadAppsConfig();
        console.log(chalk.bold.cyan('\n📱 应用列表\n'));
        Object.entries(apps).forEach(([key, url]) => {
            console.log(`  ${chalk.green('●')} ${chalk.bold(key.padEnd(10))} ${chalk.blue(url)}`);
        });
    });

program
    .command('history')
    .description('查看及执行命令历史')
    .option('-l, --last', '执行上一条命令')
    .action(async (options) => {
        const history = getCommandHistory();
        if (history.length === 0) {
            console.log(chalk.gray('暂无命令历史\n'));
            return;
        }

        if (options.last) {
            const lastItem = history[0]; // history is unshift-ed, so 0 is latest
            console.log(chalk.bold.cyan('\n📋 上一次执行的命令:\n'));
            console.log(chalk.white(`${lastItem.command}`));
            console.log(chalk.gray(`问题: ${lastItem.question}\n`));

            const rlLast = require('node:readline/promises').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            const confirmLast = await rlLast.question(chalk.cyan('确认再次执行? (y/N): '));
            rlLast.close();

            if (confirmLast.toLowerCase() === 'y' || confirmLast.toLowerCase() === 'yes') {
                const { exec } = require('child_process');
                console.log(chalk.bold.cyan('执行中...\n'));
                exec(lastItem.command, (error: any, stdout: string, stderr: string) => {
                    if (stdout) console.log(stdout);
                    if (stderr) console.error(chalk.red(stderr));
                    if (error) console.error(chalk.red(error.message));
                    process.exit(0);
                });
                return;
            } else {
                console.log(chalk.gray('已取消执行'));
            }
            return;
        }

        console.log(chalk.bold.cyan('\n📋 命令历史\n'));
        history.forEach((item, index) => {
            console.log(`${index + 1}. ${chalk.white(item.command)}`);
            console.log(chalk.gray(`   问题: ${item.question}\n`));
        });

        const rlHistory = require('node:readline/promises').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const indexInput = await rlHistory.question(chalk.cyan('输入序号选择命令 (直接回车取消): '));
        rlHistory.close();

        if (indexInput.trim()) {
            const index = parseInt(indexInput) - 1;
            if (index >= 0 && index < history.length) {
                const targetCommand = history[index].command;
                console.log(chalk.yellow(`\n即将执行: ${targetCommand}\n`));
                const rlConfirm = require('node:readline/promises').createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                const confirm = await rlConfirm.question(chalk.cyan('确认执行? (y/N): '));
                rlConfirm.close();

                if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
                    const { exec } = require('child_process');
                    console.log(chalk.bold.cyan('执行中...\n'));
                    exec(targetCommand, (error: any, stdout: string, stderr: string) => {
                        if (stdout) console.log(stdout);
                        if (stderr) console.error(chalk.red(stderr));
                        if (error) console.error(chalk.red(error.message));
                        process.exit(0);
                    });
                    return;
                } else {
                    console.log(chalk.gray('已取消执行'));
                }
            } else {
                console.log(chalk.red('无效的序号'));
            }
        }
    });

program
    .command('config')
    .description('管理本地配置 (~/.yuangs.json)')
    .argument('[action]', 'get, set, list')
    .argument('[key]', '配置项名称')
    .argument('[value]', '配置项值')
    .action(handleConfig);

program
    .command('macros')
    .description('查看所有快捷指令')
    .action(() => {
        const allMacros = getMacros();
        console.log(chalk.bold.cyan('\n🚀 快捷指令列表\n'));
        Object.keys(allMacros).forEach(name => {
            console.log(`  ${chalk.white(name)}: ${chalk.gray(allMacros[name].commands)}`);
        });
    });

program
    .command('save <name>')
    .description('保存快捷指令')
    .option('-l, --from-last', 'save last executed AI command')
    .option('-g, --global', 'add alias to ~/.zshrc')
    .action(async (name, options) => {
        const addToZshrc = (aliasName: string) => {
            const zshrcPath = path.join(os.homedir(), '.zshrc');
            if (fs.existsSync(zshrcPath)) {
                const aliasLine = `alias ${aliasName}="yuangs run ${aliasName}"`;
                try {
                    const content = fs.readFileSync(zshrcPath, 'utf8');
                    if (!content.includes(aliasLine)) {
                        fs.appendFileSync(zshrcPath, `\n${aliasLine}\n`);
                        console.log(chalk.green(`✓ 已添加 alias 到 ~/.zshrc`));
                        console.log(chalk.yellow(`ℹ️  请运行 "source ~/.zshrc" 以生效`));
                    } else {
                        console.log(chalk.yellow(`ℹ️  Alias "${aliasName}" 已存在于 ~/.zshrc`));
                    }
                } catch (err) {
                    console.error(chalk.red(`❌ 无法写入 ~/.zshrc: ${(err as Error).message}`));
                }
            } else {
                console.log(chalk.red(`❌ 未找到 ~/.zshrc`));
            }
        };

        if (options.fromLast) {
            const history = getCommandHistory();
            if (history.length === 0) {
                console.log(chalk.red('❌ 暂无 AI 命令历史'));
                return;
            }
            const lastItem = history[0];

            saveMacro(name, lastItem.command, `Saved from: ${lastItem.question}`);
            console.log(chalk.green(`✓ 已将最近一条 AI 命令保存为 "${name}"`));
            console.log(chalk.gray(`  Command: ${lastItem.command}`));

            if (options.global) {
                addToZshrc(name);
            }
            return;
        }

        const rl = require('node:readline/promises').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const cmd = await rl.question(chalk.cyan('请输入要保存的命令: '));
        saveMacro(name, cmd);
        console.log(chalk.green(`✓ 快捷指令 "${name}" 已保存`));
        rl.close();

        if (options.global) {
            addToZshrc(name);
        }
    });

program
    .command('run <name>')
    .description('执行快捷指令')
    .action((name) => {
        if (runMacro(name)) {
            console.log(chalk.green(`✓ 正在执行 "${name}"...`));
        } else {
            console.log(chalk.red(`错误: 快捷指令 "${name}" 不存在`));
        }
    });

registerCapabilityCommands(program);

program
    .command('help')
    .description('显示帮助信息')
    .action(() => {
        console.log(chalk.bold.cyan('\n🎨 苑广山的个人应用启动器 (Modular TS版)\n'));
        console.log(chalk.yellow(`当前版本: ${version}`));
        console.log(chalk.white('使用方法:') + chalk.gray(' yuangs <命令> [参数]\n'));
        console.log(chalk.bold('命令列表:'));
        console.log(`  ${chalk.green('ai')} "<问题>"      向 AI 提问`);
        console.log(`    ${chalk.gray('-e')}              生成并执行 Linux 命令 (OS 感知)`);
        console.log(`  ${chalk.green('list')}              列出所有应用`);
        console.log(`  ${chalk.green('history')}           查看命令历史`);
        console.log(`  ${chalk.green('config')}            管理本地配置 (~/.yuangs.json)`);
        console.log(`  ${chalk.green('macros')}            查看所有快捷指令`);
        console.log(`  ${chalk.green('save')} <名称>      保存快捷指令`);
        console.log(`  ${chalk.green('run')} <名称>        执行快捷指令`);
        console.log(`  ${chalk.green('help')}              显示帮助信息\n`);
    });

const apps = loadAppsConfig();

program
    .command('shici')
    .description('打开古诗词 PWA')
    .action(() => {
        const url = apps['shici'] || DEFAULT_APPS['shici'];
        console.log(chalk.green(`✓ 正在打开 shici...`));
        openUrl(url);
    });

program
    .command('dict')
    .description('打开英语词典')
    .action(() => {
        const url = apps['dict'] || DEFAULT_APPS['dict'];
        console.log(chalk.green(`✓ 正在打开 dict...`));
        openUrl(url);
    });

program
    .command('pong')
    .description('打开 Pong 游戏')
    .action(() => {
        const url = apps['pong'] || DEFAULT_APPS['pong'];
        console.log(chalk.green(`✓ 正在打开 pong...`));
        openUrl(url);
    });

program
    .argument('[command]', '自定义应用命令')
    .action((command) => {
        if (command && apps[command]) {
            openUrl(apps[command]);
        } else {
            program.outputHelp();
        }
    });

async function main() {
    const args = process.argv.slice(2);

    const knownCommands = ['ai', 'list', 'history', 'config', 'macros', 'save', 'run', 'help', 'shici', 'dict', 'pong', 'capabilities'];
    const globalFlags = ['-h', '--help', '-V', '--version', '-v'];
    const firstArg = args[0];
    const isKnownCommand = firstArg && knownCommands.includes(firstArg);
    const isGlobalFlag = firstArg && globalFlags.includes(firstArg);

    if (!isKnownCommand && !isGlobalFlag) {
        const stdinData = await readStdin();

        if (stdinData || args.length > 0) {
            const options = parseOptionsFromArgs(args);
            let question = args.filter(arg => !arg.startsWith('-')).join(' ');

            if (stdinData) {
                if (options.withContent) {
                    const { parseFilePathsFromLsOutput, readFilesContent, buildPromptWithFileContent } = await import('./core/fileReader');
                    const filePaths = parseFilePathsFromLsOutput(stdinData);
                    const contentMap = readFilesContent(filePaths);
                    question = buildPromptWithFileContent(stdinData, filePaths, contentMap, question || undefined);
                } else {
                    question = `以下是输入内容：\n\n${stdinData}\n\n我的问题是：${question || '分析以上内容'}`;
                }
            }

            let model = options.model;
            if (options.exec) {
                await handleAICommand(question, { execute: false, model, verbose: options.withContent });
            } else {
                await handleAIChat(question || null, model);
            }
            process.exit(0);
        }
    }

    program.parse();
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

````

## 📄 src/commands/capabilityCommands.ts

````typescript
import chalk from 'chalk';
import { Command } from 'commander';
import { AtomicCapability, COMPOSITE_CAPABILITIES } from '../core/capabilities';
import { CapabilitySystem } from '../core/capabilitySystem';
import { CapabilityRequirement } from '../core/modelMatcher';
import { listExecutionRecords } from '../core/executionStore';
import { ReplayMode } from '../core/replayEngine';

export function registerCapabilityCommands(program: Command): void {
  const capProgram = program.command('capabilities').description('Capability system commands (new architecture)');

  capProgram
    .command('explain')
    .description('Explain current configuration with sources')
    .action(() => {
      const system = new CapabilitySystem();
      console.log(chalk.bold.cyan('\n📋 Configuration Snapshot\n'));
      console.log(system.explainConfig());
    });

  capProgram
    .command('match')
    .description('Test capability matching')
    .argument('<capabilities...>', 'Required capabilities (e.g., text_generation reasoning)')
    .action((capabilities) => {
      const system = new CapabilitySystem();

      const { AtomicCapability } = require('../core/capabilities');

      const requirement: CapabilityRequirement = {
        required: capabilities as any,
        preferred: [],
      };

      const result = system.matchCapability(requirement);

      console.log(chalk.bold.cyan('\n🤖 Capability Match Result\n'));

      if (!result.selected) {
        console.log(chalk.red('❌ No model satisfies requirements\n'));
        result.candidates.forEach(c => {
          console.log(chalk.yellow(`${c.modelName} (${c.provider}):`));
          console.log(chalk.gray(`  ${c.reason}\n`));
        });
        return;
      }

      console.log(chalk.green(`✅ Selected: ${result.selected.name} (${result.selected.provider})\n`));

      console.log(chalk.bold('Capability coverage:'));
      result.selected.atomicCapabilities.forEach(cap => {
        console.log(chalk.green(`  ✓ ${cap}`));
      });

      if (result.fallbackOccurred) {
        console.log(chalk.yellow('\n⚠️  Fallback was used'));
      }

      console.log(chalk.bold('\nAll candidates:'));
      result.candidates.forEach(c => {
        const icon = c.hasRequired ? chalk.green('✓') : chalk.red('✗');
        console.log(`  ${icon} ${c.modelName} (${c.provider})`);
        console.log(chalk.gray(`    ${c.reason}\n`));
      });
    });

  capProgram
    .command('list')
    .description('List all available capabilities')
    .action(() => {
      console.log(chalk.bold.cyan('\n📦 Available Capabilities\n'));

      console.log(chalk.bold('Atomic Capabilities:'));
      Object.values(AtomicCapability).forEach(cap => {
        console.log(`  - ${chalk.green(cap)}`);
      });

      console.log(chalk.bold('\nComposite Capabilities:'));
      COMPOSITE_CAPABILITIES.forEach(comp => {
        console.log(`  - ${chalk.cyan(comp.name)}`);
        console.log(chalk.gray(`    Composed of: ${comp.composedOf.join(', ')}`));
      });
    });

  capProgram
    .command('history')
    .description('List execution history')
    .option('-l, --limit <n>', 'Limit number of records', '10')
    .action((options) => {
      const limit = parseInt(options.limit);
      const records = listExecutionRecords(limit);

      if (records.length === 0) {
        console.log(chalk.gray('📭 No execution history found\n'));
        return;
      }

      console.log(chalk.bold.cyan(`\n📋 Execution History (last ${records.length})\n`));

      records.forEach((record, idx) => {
        const status = record.outcome.success
          ? chalk.green('✓')
          : chalk.red('✗');
        const model = record.decision.selectedModel?.name || 'N/A';
        const time = new Date(record.meta.timestamp).toLocaleString();

        console.log(`${status} ${chalk.white(record.id)}`);
        console.log(chalk.gray(`  Command: ${record.meta.commandName}`));
        console.log(chalk.gray(`  Model: ${model}`));
        console.log(chalk.gray(`  Time: ${time}\n`));
      });
    });

  capProgram
    .command('replay <id>')
    .description('Replay an execution')
    .option('-s, --strict', 'Strict replay (use exact model)')
    .option('-c, --compatible', 'Compatible replay (allow fallback)')
    .option('-v, --verbose', 'Verbose output')
    .action(async (id, options) => {
      const system = new CapabilitySystem();

      let mode: ReplayMode = 'strict';
      if (options.compatible) mode = 'compatible';

      const result = await system.replayExecution(id, {
        mode,
        skipAI: true,
        verbose: options.verbose,
      });

      if (result.success) {
        console.log(chalk.green(`\n✅ ${result.message}\n`));
        if (result.executedModel) {
          console.log(chalk.gray(`Model: ${result.executedModel}`));
        }
      } else {
        console.log(chalk.red(`\n❌ ${result.message}\n`));
      }
    });
}

````

## 📄 src/commands/contextBuffer.ts

````typescript
export type ContextItem = {
    type: 'file' | 'directory';
    path: string;
    alias?: string;
    content: string;
    summary?: string;
    tokens: number;
};

const estimateTokens = (text: string) => Math.ceil(text.length / 4);

export class ContextBuffer {
    private items: ContextItem[] = [];
    private maxTokens = 8000;

    add(item: Omit<ContextItem, 'tokens'>, bypassTokenLimit: boolean = false) {
        const tokens = estimateTokens(item.content);
        this.items.push({ ...item, tokens });
        if (!bypassTokenLimit) {
            this.trimIfNeeded();
        }
    }

    clear() {
        this.items = [];
    }

    list() {
        return this.items.map((item, i) => ({
            index: i + 1,
            type: item.type,
            path: item.path,
            alias: item.alias,
            tokens: item.tokens,
            summary: item.summary
        }));
    }

    isEmpty() {
        return this.items.length === 0;
    }

    export() {
        return this.items;
    }

    import(items: ContextItem[]) {
        this.items = items;
    }

    private totalTokens() {
        return this.items.reduce((sum, i) => sum + i.tokens, 0);
    }

    private trimIfNeeded() {
        while (this.totalTokens() > this.maxTokens) {
            this.items.shift();
        }
    }

    buildPrompt(userInput: string): string {
        const contextBlock = this.items.map(item => {
            const title = item.alias
                ? `${item.type}：${item.alias} (${item.path})`
                : `${item.type}：${item.path}`;

            const body = item.summary ?? item.content;

            return `${title}\n\`\`\`\n${body}\n\`\`\``;
        }).join('\n\n');

        return `
你正在基于以下上下文回答问题：

${contextBlock}

用户问题：
${userInput}
`;
    }
}
// Test change for git diff
// Another test change (unstaged)

````

## 📄 src/commands/contextStorage.ts

````typescript
import fs from 'fs/promises';
import path from 'path';
import { ContextItem } from './contextBuffer';

const CONTEXT_DIR = path.resolve(process.cwd(), '.ai');
const CONTEXT_FILE = path.join(CONTEXT_DIR, 'context.json');

export async function loadContext(): Promise<ContextItem[]> {
    try {
        const raw = await fs.readFile(CONTEXT_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

export async function saveContext(items: ContextItem[]) {
    await fs.mkdir(CONTEXT_DIR, { recursive: true });
    await fs.writeFile(CONTEXT_FILE, JSON.stringify(items, null, 2));
}

export async function clearContextStorage() {
    await fs.rm(CONTEXT_FILE, { force: true });
}

````

## 📄 src/commands/gitContext.ts

````typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function run(cmd: string): Promise<string | null> {
    try {
        const { stdout } = await execAsync(cmd, { maxBuffer: 1024 * 1024 });
        return stdout.trim() || null;
    } catch {
        return null;
    }
}

export async function getGitContext() {
    const staged = await run('git diff --staged');
    const unstaged = await run('git diff');

    if (!staged && !unstaged) return null;

    let result = `以下是 Git 变更内容：\n`;

    if (staged) {
        result += `\n【已暂存】\n\`\`\`diff\n${staged}\n\`\`\`\n`;
    }

    if (unstaged) {
        result += `\n【未暂存】\n\`\`\`diff\n${unstaged}\n\`\`\`\n`;
    }

    return result;
}

````

## 📄 src/commands/handleAIChat.ts

````typescript
import chalk from 'chalk';
import ora from 'ora';
import readline from 'readline';
import { callAI_Stream, getConversationHistory, addToConversationHistory, clearConversationHistory } from '../ai/client';
import * as marked from 'marked';
import TerminalRenderer from 'marked-terminal';
import fs from 'fs';
import path from 'path';
import { buildPromptWithFileContent, readFilesContent } from '../core/fileReader';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ContextBuffer } from './contextBuffer';
import { loadContext, saveContext, clearContextStorage } from './contextStorage';
import { getGitContext } from './gitContext';
import {
    Mode,
    detectMode,
    createCompleter,
    executeCommand as shellExecuteCommand,
    updateGhost,
    clearGhost,
    renderGhost,
    listPlugins
} from './shellCompletions';
const execAsync = promisify(exec);

function findCommonPrefix(strings: string[]): string {
    if (strings.length === 0) return '';
    if (strings.length === 1) return strings[0];

    let common = '';
    const first = strings[0];

    for (let i = 0; i < first.length; i++) {
        const char = first[i];
        if (strings.every(s => s[i] === char)) {
            common += char;
        } else {
            break;
        }
    }

    return common;
}

async function executeCommand(filePath: string, command?: string) {
    const fullPath = path.resolve(filePath);
    const commandStr = command || '';

    if (command) {
        const { stdout, stderr } = await exec(commandStr, { cwd: path.dirname(fullPath) });
        console.log(stdout);
        if (stderr) console.error(chalk.red(stderr));
    } else {
        const { stdout, stderr } = await exec(fullPath, { cwd: process.cwd() });
        console.log(stdout);
        if (stderr) console.error(chalk.red(stderr));
    }
}

async function readFileContent(filePath: string): Promise<string> {
    const fullPath = path.resolve(filePath);
    return await fs.promises.readFile(fullPath, 'utf-8');
}

async function showFileSelector(rl: readline.Interface): Promise<string | null> {
    return new Promise((resolve) => {
        try {
            const currentDir = process.cwd();
            const files = fs.readdirSync(currentDir);

            if (files.length === 0) {
                console.log(chalk.yellow('当前目录为空\n'));
                resolve(null);
                return;
            }

            console.log(chalk.bold.cyan('📁 当前目录文件列表:\n'));

            files.forEach((file, index) => {
                const fullPath = path.join(currentDir, file);
                const isDir = fs.statSync(fullPath).isDirectory();
                const icon = isDir ? chalk.cyan('📁') : chalk.green('📄');
                const padding = (index + 1).toString().padStart(2);
                console.log(`  [${padding}] ${icon} ${file}`);
            });
            console.log();

            rl.question(chalk.cyan('请选择文件 (输入序号，或按 Enter 返回): '), (choice) => {
                if (choice.trim() === '') {
                    console.log(chalk.gray('已取消选择\n'));
                    resolve(null);
                    return;
                }

                const index = parseInt(choice) - 1;
                if (isNaN(index) || index < 0 || index >= files.length) {
                    console.log(chalk.red('无效的序号\n'));
                    resolve(null);
                    return;
                }

                const selectedFile = files[index];
                console.log(chalk.green(`✓ 已选择: ${selectedFile}\n`));
                resolve(selectedFile);
            });
        } catch (error) {
            console.error(chalk.red(`读取目录失败: ${error}\n`));
            resolve(null);
        }
    });
}

async function handleFileReference(filePath: string, question?: string): Promise<string> {
    const fullPath = path.resolve(filePath);

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
        console.log(chalk.red(`错误: 文件 "${filePath}" 不存在或不是一个文件\n`));
        return question || '';
    }

    const spinner = ora(chalk.cyan('正在读取文件...')).start();

    try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const relativePath = path.relative(process.cwd(), fullPath);

        const contentMap = new Map<string, string>();
        contentMap.set(relativePath, content);

        const prompt = buildPromptWithFileContent(
            `文件: ${relativePath}`,
            [relativePath],
            contentMap,
            question || `请分析文件: ${relativePath}`
        );

        spinner.stop();
        console.log(chalk.green(`✓ 已读取文件: ${relativePath}\n`));
        return prompt;
    } catch (error) {
        spinner.stop();
        console.error(chalk.red(`读取文件失败: ${error}\n`));
        return question || '';
    }
}

async function handleFileReferenceInput(input: string): Promise<string> {
    const match = input.match(/^@\s*(.+?)\s*(?:\n(.*))?$/s);
    if (!match) {
        console.log(chalk.yellow('格式错误，正确用法: @文件路径 [问题]\n'));
        return '';
    }

    const filePath = match[1].trim();
    const question = match[2] ? match[2].trim() : '';
    return handleFileReference(filePath, question);
}

async function handleDirectoryReference(input: string): Promise<string> {
    const match = input.match(/^#\s*(.+?)\s*(?:\n(.*))?$/s);
    if (!match) {
        console.log(chalk.yellow('格式错误，正确用法: # 目录路径 [问题]\n'));
        return input;
    }

    const dirPath = match[1].trim();
    const question = match[2] ? match[2].trim() : '请分析这个目录下的文件';

    const fullPath = path.resolve(dirPath);

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
        console.log(chalk.red(`错误: 目录 "${dirPath}" 不存在或不是一个目录\n`));
        return question;
    }

    const spinner = ora(chalk.cyan('正在读取文件...')).start();

    try {
        const findCommand = process.platform === 'darwin' || process.platform === 'linux'
            ? `find "${fullPath}" -type f`
            : `dir /s /b "${fullPath}"`;

        const { stdout } = await execAsync(findCommand);
        const filePaths = stdout.trim().split('\n').filter(f => f);

        spinner.stop();

        if (filePaths.length === 0) {
            console.log(chalk.yellow(`目录 "${dirPath}" 下没有文件\n`));
            return question;
        }

        const contentMap = readFilesContent(filePaths);

        const prompt = buildPromptWithFileContent(
            `目录: ${dirPath}\n找到 ${filePaths.length} 个文件`,
            filePaths.map(p => path.relative(process.cwd(), p)),
            contentMap,
            question
        );

        console.log(chalk.green(`✓ 已读取 ${contentMap.size} 个文件\n`));
        return prompt;
    } catch (error) {
        spinner.stop();
        console.error(chalk.red(`读取目录失败: ${error}\n`));
        return question;
    }
}

export async function handleAIChat(initialQuestion: string | null, model?: string) {
    if (initialQuestion) {
        await askOnceStream(initialQuestion, model);
        return;
    }

    console.log(chalk.bold.cyan('\n🤖 进入 AI 交互模式 (输入 exit 退出)\n'));

    const contextBuffer = new ContextBuffer();
    const persisted = await loadContext();
    contextBuffer.import(persisted);

    if (persisted.length > 0) {
        console.log(chalk.yellow(`📦 已恢复 ${persisted.length} 条上下文\n`));
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
        completer: createCompleter(),
        historySize: 1000
    });

    readline.emitKeypressEvents(process.stdin);

    process.stdin.on('keypress', (str, key) => {
        if (key.ctrl && key.name === 'r') {
            rl.write(null, { ctrl: true, name: 'r' });
        }
    });

    // Helper to wrap rl.question in a Promise
    const ask = (query: string): Promise<string> => {
        return new Promise((resolve) => {
            rl.question(query, (answer) => {
                resolve(answer);
            });
        });
    };

    try {
        while (true) {
            const input = await ask(chalk.green('你：'));
            const trimmed = input.trim();

            if (trimmed.startsWith('@')) {
                rl.pause();
                try {
                    // 新增：支持执行命令的语法
                    // @ filename:command - 添加并执行命令
                    // @!filename - 添加并立即执行文件

                    const execMatch = trimmed.match(/^@\s*(.+?)\s*:\s*([^].*)?$/);
                    const immediateExecMatch = trimmed.match(/^@\s*!\s*(.+?)$/);

                    if (execMatch && execMatch[2]) {
                        // @ filename:command - 添加并执行命令
                        const filePath = execMatch[1].trim();
                        const commandStr = execMatch[2].trim();

                        const content = await readFileContent(filePath);

                        contextBuffer.add({
                            type: 'file',
                            path: filePath,
                            content
                        });

                        const displayName = filePath;
                        console.log(chalk.green(`✓ 已加入文件上下文: ${displayName}\n`));
                        
                        await saveContext(contextBuffer.export());
                        
                        console.log(chalk.cyan(`⚡️  正在执行: ${commandStr}\n`));
                        
                        const { stdout, stderr } = await exec(commandStr, { cwd: path.dirname(filePath) });
                        console.log(stdout);
                        if (stderr) console.error(chalk.red(stderr));

                        await saveContext(contextBuffer.export());
                        console.log(chalk.green(`✓ 执行完成\n`));

                        rl.resume();
                        continue;
                    }

                    if (immediateExecMatch) {
                        // @!filename - 添加并立即执行文件
                        const filePath = immediateExecMatch[1].trim();
                        const content = await readFileContent(filePath);
                        
                        contextBuffer.add({
                            type: 'file',
                            path: filePath,
                            content
                        });

                        const displayName = filePath;
                        console.log(chalk.green(`✓ 已加入文件上下文: ${displayName}\n`));
                        
                        await saveContext(contextBuffer.export());
                        
                        console.log(chalk.cyan(`⚡️  正在执行: ${filePath}\n`));
                        
                        const { stdout, stderr } = await exec(filePath, { cwd: process.cwd() });
                        console.log(stdout);
                        if (stderr) console.error(chalk.red(stderr));

                        await saveContext(contextBuffer.export());
                        console.log(chalk.green(`✓ 执行完成\n`));

                        rl.resume();
                        continue;
                    }

                    // 增强的匹配模式，支持行号指定: @ filepath:startLine-endLine as alias
                    const match = trimmed.match(/^@\s*(.+?)(?::(\d+)(?:-(\d+))?)?(?:\s+as\s+(.+))?$/);
                    const filePath = match?.[1] ?? (await showFileSelector(rl));
                    const lineStart = match?.[2] ? parseInt(match[2]) : null;
                    const lineEnd = match?.[3] ? parseInt(match[3]) : null;
                    const alias = match?.[4];

                    if (!filePath) continue;

                    const absolutePath = path.resolve(filePath);
                    let content = await fs.promises.readFile(absolutePath, 'utf-8');

                    // 如果指定了行号范围，则提取相应行
                    if (lineStart !== null) {
                        const lines = content.split('\n');

                        // 验证行号范围
                        if (lineStart < 1 || lineStart > lines.length) {
                            console.log(chalk.red(`\n错误: 起始行号 ${lineStart} 超出文件范围 (文件共有 ${lines.length} 行)\n`));
                            rl.resume();
                            continue;
                        }

                        const startIdx = lineStart - 1; // 转换为数组索引（从0开始）
                        let endIdx = lineEnd ? Math.min(lineEnd, lines.length) : lines.length; // 如果未指定结束行，则到文件末尾

                        if (lineEnd && (lineEnd < lineStart || lineEnd > lines.length)) {
                            console.log(chalk.red(`\n错误: 结束行号 ${lineEnd} 超出有效范围 (应在 ${lineStart}-${lines.length} 之间)\n`));
                            rl.resume();
                            continue;
                        }

                        // 提取指定范围的行
                        content = lines.slice(startIdx, endIdx).join('\n');

                        // 更新路径显示，包含行号信息
                        const rangeInfo = lineEnd ? `${lineStart}-${lineEnd}` : `${lineStart}`;
                        const pathWithRange = `${filePath}:${rangeInfo}`;

                        contextBuffer.add({
                            type: 'file',
                            path: pathWithRange,
                            alias,
                            content
                        }, true); // bypassTokenLimit = true
                    } else {
                        // 原始行为：添加整个文件
                        contextBuffer.add({
                            type: 'file',
                            path: filePath,
                            alias,
                            content
                        });
                    }

                    await saveContext(contextBuffer.export());
                    const displayName = alias ? `${alias} (${filePath}${lineStart !== null ? `:${lineStart}${lineEnd ? `-${lineEnd}` : ''}` : ''})` :
                        (filePath + (lineStart !== null ? `:${lineStart}${lineEnd ? `-${lineEnd}` : ''}` : ''));
                    console.log(chalk.green(`✅ 已加入文件上下文: ${displayName}\n`));
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : String(err);
                    console.error(chalk.red(`\n[处理错误]: ${message}\n`));
                } finally {
                    rl.resume();
                }
                continue;
            }

            if (trimmed.startsWith('#')) {
                rl.pause();
                try {
                    const match = trimmed.match(/^#\s*(.+?)\s*(?:\n(.*))?$/s);
                    if (!match) {
                        console.log(chalk.yellow('格式错误，正确用法: # 目录路径\n'));
                        rl.resume();
                        continue;
                    }

                    const dirPath = match[1].trim();
                    const fullPath = path.resolve(dirPath);

                    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
                        console.log(chalk.red(`错误: 目录 "${dirPath}" 不存在或不是一个目录\n`));
                        rl.resume();
                        continue;
                    }

                    const findCommand = process.platform === 'darwin' || process.platform === 'linux'
                        ? `find "${fullPath}" -type f`
                        : `dir /s /b "${fullPath}"`;

                    const { stdout } = await execAsync(findCommand);
                    const filePaths = stdout.trim().split('\n').filter(f => f);

                    if (filePaths.length === 0) {
                        console.log(chalk.yellow(`目录 "${dirPath}" 下没有文件\n`));
                        rl.resume();
                        continue;
                    }

                    const contentMap = readFilesContent(filePaths);
                    const prompt = buildPromptWithFileContent(
                        `目录: ${dirPath}\n找到 ${filePaths.length} 个文件`,
                        filePaths.map(p => path.relative(process.cwd(), p)),
                        contentMap,
                        ''
                    );

                    contextBuffer.add({
                        type: 'directory',
                        path: dirPath,
                        content: prompt
                    });

                    await saveContext(contextBuffer.export());
                    console.log(chalk.green(`✅ 已加入目录上下文: ${dirPath}\n`));
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : String(err);
                    console.error(chalk.red(`\n[处理错误]: ${message}\n`));
                } finally {
                    rl.resume();
                }
                continue;
            }

            if (['exit', 'quit', 'bye'].includes(trimmed.toLowerCase())) {
                console.log(chalk.cyan('👋 再见！'));
                break;
            }

            if (trimmed === '/clear') {
                clearConversationHistory();
                console.log(chalk.yellow('✓ 对话历史已清空\n'));
                continue;
            }

            if (trimmed === '/history') {
                const history = getConversationHistory();
                if (history.length === 0) {
                    console.log(chalk.gray('暂无对话历史\n'));
                } else {
                    history.forEach((msg) => {
                        const prefix = msg.role === 'user' ? chalk.green('你: ') : chalk.blue('AI: ');
                        console.log(prefix + msg.content);
                    });
                }
                continue;
            }

            if (trimmed === ':ls') {
                const list = contextBuffer.list();
                if (list.length === 0) {
                    console.log(chalk.gray('📭 当前没有上下文\n'));
                } else {
                    console.table(list);
                }
                continue;
            }

            if (trimmed === ':clear') {
                contextBuffer.clear();
                await clearContextStorage();
                console.log(chalk.yellow('🧹 上下文已清空（含持久化）\n'));
                continue;
            }

            if (trimmed === ':plugins') {
                const plugins = listPlugins();
                if (plugins.length === 0) {
                    console.log(chalk.gray('📭 当前没有加载的插件\n'));
                } else {
                    console.log(chalk.cyan('已加载的插件:\n'));
                    plugins.forEach(p => console.log(chalk.green(`  - ${p}`)));
                    console.log();
                }
                continue;
            }

            if (!trimmed) continue;

            const mode = detectMode(trimmed);

            if (mode === 'command') {
                rl.pause();
                try {
                    await shellExecuteCommand(trimmed, (code) => {
                        if (code !== 0) {
                            console.log(chalk.red(`\n[command exited with code ${code}]\n`));
                        }
                    });
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : String(err);
                    console.error(chalk.red(`\n[Command Error]: ${message}`));
                } finally {
                    rl.resume();
                }
                continue;
            }

            let finalPrompt = contextBuffer.isEmpty()
                ? trimmed
                : contextBuffer.buildPrompt(trimmed);

            const gitContext = await getGitContext();

            if (gitContext) {
                finalPrompt = `
${gitContext}

${finalPrompt}
`;
            }

            try {
                rl.pause();
                await askOnceStream(finalPrompt, model);

                contextBuffer.clear();
                await saveContext([]);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                console.error(chalk.red(`\n[AI execution error]: ${message}`));
            } finally {
                rl.resume();
            }
        }
    } catch (criticalErr: unknown) {
        const message = criticalErr instanceof Error ? criticalErr.message : String(criticalErr);
        console.error(chalk.red(`\n[Critical Loop Error]: ${message}`));
    } finally {
        rl.close();
    }
}

// 配置 marked 使用 TerminalRenderer
marked.setOptions({
    renderer: new TerminalRenderer({
        tab: 2,
        width: process.stdout.columns || 80,
        showSectionPrefix: false
    }) as any
});

async function askOnceStream(question: string, model?: string) {
    const startTime = Date.now();
    const messages = [...getConversationHistory()];
    messages.push({ role: 'user', content: question });

    const spinner = ora(chalk.cyan('AI 正在思考...')).start();
    let fullResponse = '';
    const BOT_PREFIX = chalk.bold.blue('🤖 AI：');



    try {
        let isFirstOutput = true;
        await callAI_Stream(messages, model, (chunk) => {
            if (spinner.isSpinning) {
                spinner.stop();
                if (isFirstOutput) {
                    process.stdout.write(BOT_PREFIX);
                    isFirstOutput = false;
                }
            }
            fullResponse += chunk;
            process.stdout.write(chunk);
        });

        const formatted = (marked.parse(fullResponse, { async: false }) as string).trim();

        if (process.stdout.isTTY) {
            // TTY模式（交互模式）
            // 1. 先输出原本的流式内容（Raw）
            // 2. 结束时，计算 Raw 内容的高度（Visual Line Count）
            // 3. 向上清除相应行数
            // 4. 输出渲染后的 Markdown 内容

            const screenWidth = process.stdout.columns || 80;
            const totalContent = BOT_PREFIX + fullResponse;
            let lineCount = getVisualLineCount(totalContent, screenWidth);

            // 清除 Raw Output
            // 移至当前行开头并清除
            process.stdout.write('\r\x1b[K');
            // 向上移动并清除
            for (let i = 0; i < lineCount - 1; i++) {
                process.stdout.write('\x1b[A\x1b[K');
            }

            // 输出格式化的 Markdown 内容
            process.stdout.write(BOT_PREFIX + formatted + '\n');
        } else {
            // 非TTY模式（如管道模式）
            // 只输出格式化内容，不执行清除逻辑，避免转义序列可见
            if (spinner.isSpinning) {
                spinner.stop();
            }
            process.stdout.write(BOT_PREFIX + formatted + '\n');
        }

        addToConversationHistory('user', question);
        addToConversationHistory('assistant', fullResponse);

        const elapsed = (Date.now() - startTime) / 1000;
        process.stdout.write('\n' + chalk.gray(`─`.repeat(20) + ` (耗时: ${elapsed.toFixed(2)}s) ` + `─`.repeat(20) + '\n\n'));
    } catch (error: any) {
        if (spinner.isSpinning) {
            spinner.stop();
        }
        throw error;
    }
}

function getVisualLineCount(text: string, screenWidth: number): number {
    const stripAnsi = (str: string) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

    const lines = text.split('\n');
    let totalLines = 0;

    for (const line of lines) {
        // Expand tabs (assuming 8 spaces)
        const expandedLine = line.replace(/\t/g, '        ');
        const cleanLine = stripAnsi(expandedLine);

        let lineWidth = 0;
        for (const char of cleanLine) {
            const code = char.codePointAt(0) || 0;
            // Most characters > 255 are 2 cells (CJK, Emojis, etc.)
            lineWidth += code > 255 ? 2 : 1;
        }

        if (lineWidth === 0) {
            totalLines += 1;
        } else {
            totalLines += Math.ceil(lineWidth / screenWidth);
        }
    }

    return totalLines;
}

````

## 📄 src/commands/handleAICommand.ts

````typescript
import chalk from 'chalk';
import ora from 'ora';
import { getOSProfile } from '../core/os';
import { buildCommandPrompt } from '../ai/prompt';
import { askAI } from '../ai/client';
import { exec } from '../core/executor';
import { assessRisk } from '../core/risk';
import { autoFixCommand } from '../core/autofix';
import { confirm } from '../utils/confirm';
import { saveHistory } from '../utils/history';
import { safeParseJSON, AICommandPlan, AIFixPlan } from '../core/validation';
import { getMacros, runMacro } from '../core/macros';
import { CapabilitySystem } from '../core/capabilitySystem';
import { inferCapabilityRequirement } from '../core/capabilityInference';
import { CapabilityMatchResult } from '../core/modelMatcher';

function validateAIPlan(obj: any): obj is AICommandPlan {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.plan === 'string' &&
        ['low', 'medium', 'high'].includes(obj.risk) &&
        (typeof obj.command === 'string' || typeof obj.macro === 'string')
    );
}

export async function handleAICommand(
    userInput: string,
    options: { execute: boolean; model?: string; dryRun?: boolean; autoYes?: boolean; verbose?: boolean }
) {
    const os = getOSProfile();
    const macros = getMacros();
    const capabilitySystem = new CapabilitySystem();
    const spinner = ora(chalk.cyan('🧠 AI 正在规划中...')).start();

    const startTime = Date.now();

    try {
        const requirement = inferCapabilityRequirement(userInput);

        let matchResult: CapabilityMatchResult;
        let selectedModel: string;

        if (options.model) {
            matchResult = {
                selected: null,
                candidates: [],
                fallbackOccurred: false,
            };

            selectedModel = options.model;
        } else {
            matchResult = capabilitySystem.matchCapability(requirement);
            selectedModel = matchResult.selected?.name || 'gemini-2.5-flash-lite';
        }

        spinner.stop();

        const prompt = buildCommandPrompt(userInput, os, macros);
        const raw = await askAI(prompt, selectedModel);

        const { aiCommandPlanSchema } = require('../core/validation');
        const parseResult = safeParseJSON(raw, aiCommandPlanSchema, {} as AICommandPlan);

        if (!parseResult.success) {
            console.log(chalk.red('\n❌ AI 输出不是合法 JSON:'));
            console.log(raw);
            console.log(chalk.gray('\n验证错误: ' + parseResult.error.issues.map((e: any) => e.message).join(', ')));
            return { code: 1 };
        }

        const plan = parseResult.data;

        const isUsingMacro = !!plan.macro;
        let actualCommand = plan.macro ? macros[plan.macro]?.commands : plan.command;

        if (!actualCommand) {
            console.log(chalk.red('\n❌ 无效的计划：'));
            if (plan.macro) {
                console.log(chalk.red(`未找到名为 "${plan.macro}" 的 Macro`));
            } else {
                console.log(chalk.red('未提供有效的命令'));
            }
            return { code: 1 };
        }

        const commandToExecute: string = actualCommand;
        const finalRisk = assessRisk(commandToExecute, plan.risk);

        console.log(chalk.bold.cyan('\n🧠 计划: ') + plan.plan);

        if (isUsingMacro) {
            console.log(chalk.bold.green('✨ 复用 Macro: ') + chalk.yellow(plan.macro!));
            console.log(chalk.gray('   (已验证的命令，无需重新生成)'));
        } else {
            console.log(chalk.bold.green('💻 命令: ') + chalk.yellow(commandToExecute));
        }

        const riskColor = finalRisk === 'high' ? chalk.red : (finalRisk === 'medium' ? chalk.yellow : chalk.green);
        console.log(chalk.bold('⚠️  风险判断: ') + riskColor(finalRisk.toUpperCase()));

        if (options.verbose) {
            console.log(chalk.bold.cyan('\n🔍 Capability 匹配详情:'));
            console.log(chalk.gray(`  用户意图能力: ${requirement.required.join(', ')}`));
            console.log(chalk.gray(`  使用的模型: ${selectedModel}`));

            if (matchResult.selected) {
                console.log(chalk.gray(`  模型能力覆盖: ${matchResult.selected.atomicCapabilities.join(', ')}`));
            }

            if (matchResult.fallbackOccurred) {
                console.log(chalk.yellow('  ⚠️  触发了 Fallback'));
            }

            matchResult.candidates.forEach(c => {
                const icon = c.hasRequired ? chalk.green('✓') : chalk.red('✗');
                console.log(chalk.gray(`  ${icon} ${c.modelName}: ${c.reason}`));
            });
        }

        if (options.dryRun) {
            console.log(chalk.gray('\n[Dry Run] 仅模拟，不执行命令。'));
            return { code: 0 };
        }

        console.log(chalk.gray('─'.repeat(50)));
        if (isUsingMacro) {
            console.log(chalk.yellow('⚠️  注意: AI 正在复用已验证的 Macro。'));
        } else {
            console.log(chalk.yellow('⚠️  注意: 以上命令由 AI 生成，请在执行前仔细检查。'));
            console.log(chalk.gray('   AI 可能会犯错，安全由您掌控。'));
        }
        console.log(chalk.gray('─'.repeat(50)));

        let shouldExecute = options.execute || options.autoYes;

        if (!shouldExecute) {
            shouldExecute = await confirm('是否执行该命令？');
        }

        if (!shouldExecute) {
            console.log(chalk.gray('执行已取消。'));
            return { code: 1 };
        }

        console.log(chalk.gray('\n执行中...\n'));
        let result: { code: number | null; stdout?: string; stderr?: string };

        if (isUsingMacro) {
            const macroSuccess = runMacro(plan.macro!);
            result = { code: 0, stdout: '', stderr: '' };
            console.log(chalk.green('✓ Macro 已执行'));
        } else {
            result = await exec(commandToExecute);
        }

        const latencyMs = Date.now() - startTime;

        if (!isUsingMacro && result.code !== 0 && result.code !== null) {
            console.log(chalk.red('\n❌ 执行失败，尝试自动修复...'));
            const fixedPlan = await autoFixCommand(
                commandToExecute,
                result.stderr!,
                os,
                selectedModel
            );

            if (fixedPlan && fixedPlan.command) {
                console.log(chalk.bold.cyan('🔁 修复方案: ') + fixedPlan.plan);
                console.log(chalk.bold.green('💻 修复命令: ') + chalk.yellow(fixedPlan.command));

                const retry = await confirm('是否执行修复后的命令？');
                if (retry) {
                    console.log(chalk.gray('\n正在重试...\n'));
                    result = await exec(fixedPlan.command);
                    if (result.code === 0) {
                        saveHistory({
                            question: userInput,
                            command: fixedPlan.command,
                        });
                        console.log(chalk.green('\n✓ 修复命令执行成功并已存入历史库'));
                        return result;
                    }
                }
            }
        }

        if (result.code === 0) {
            saveHistory({
                question: userInput,
                command: commandToExecute,
            });

            if (isUsingMacro) {
                console.log(chalk.green('\n✓ Macro 执行成功并已存入历史库'));
            } else {
                console.log(chalk.green('\n✓ 执行成功并已存入历史库'));
            }

            if (!isUsingMacro) {
                capabilitySystem.createAndSaveExecutionRecord(
                    'ai-command',
                    requirement,
                    matchResult,
                    commandToExecute
                );
            }
        }

        return result;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        spinner.fail(chalk.red('发生错误: ' + message));
        return { code: 1 };
    }
}

````

## 📄 src/commands/handleConfig.ts

````typescript
import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import { parseUserConfig, userConfigSchema, type UserConfig } from '../core/validation';

const CONFIG_FILE = path.join(os.homedir(), '.yuangs.json');

export function handleConfig(args: string[]) {
    const action = args[0]; // get, set, list

    if (!action || action === 'list') {
        const config = readConfig();
        console.log(chalk.bold.cyan('\n⚙️  当前配置 (~/.yuangs.json):\n'));
        if (Object.keys(config).length === 0) {
            console.log(chalk.gray('  (配置文件不存在或为空)'));
        } else {
            Object.entries(config).forEach(([key, value]) => {
                console.log(`  ${chalk.white(key)}: ${chalk.green(value)}`);
            });
        }
        console.log('\n使用方法:');
        console.log(chalk.gray('  yuangs config set <key> <value>'));
        console.log(chalk.gray('  yuangs config get <key>\n'));
        return;
    }

    if (action === 'set') {
        const key = args[1];
        const value = args[2];
        if (!key || !value) {
            console.log(chalk.red('错误: 请提供 key 和 value。例如: yuangs config set defaultModel gemini-2.5-flash-lite'));
            return;
        }
        const config = readConfig();
        config[key] = value;
        writeConfig(config);
        console.log(chalk.green(`✓ 已将 ${key} 设置为 ${value}`));
        return;
    }

    if (action === 'get') {
        const key = args[1];
        if (!key) {
            console.log(chalk.red('错误: 请提供 key。例如: yuangs config get defaultModel'));
            return;
        }
        const config = readConfig();
        if (config[key] !== undefined) {
            console.log(config[key]);
        } else {
            console.log(chalk.yellow(`配置项 ${key} 不存在`));
        }
        return;
    }
}

function readConfig(): UserConfig {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            return parseUserConfig(fs.readFileSync(CONFIG_FILE, 'utf8'));
        } catch (e) {
            return {};
        }
    }
    return {};
}

function writeConfig(config: UserConfig) {
    const validated = userConfigSchema.parse(config);
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(validated, null, 2));
}

````

## 📄 src/commands/shellCompletions.ts

````typescript
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { execSync } from 'child_process';

/* ========================================
   TYPE DEFINITIONS
   ======================================== */

export type Mode = 'chat' | 'file' | 'dir' | 'command';

export interface CompletionContext {
    line: string;
    cursor: number;
    mode: Mode;
    cwd: string;
}

export interface CommandPlugin {
    command: string;
    complete(args: string[], context: CompletionContext): string[];
}

/* ========================================
   PROJECT CONTEXT
   ======================================== */

let PROJECT_ROOT: string | null = null;

export function findProjectRoot(start = process.cwd()): string {
    if (PROJECT_ROOT) return PROJECT_ROOT;

    let dir = start;
    const MAX_DEPTH = 10;
    let depth = 0;

    while (dir !== path.dirname(dir) && depth < MAX_DEPTH) {
        if (fs.existsSync(path.join(dir, 'package.json')) ||
            fs.existsSync(path.join(dir, '.git'))) {
            PROJECT_ROOT = dir;
            return dir;
        }
        dir = path.dirname(dir);
        depth++;
    }

    PROJECT_ROOT = start;
    return start;
}

const PRIORITY_DIRS = ['src', 'packages', 'apps', 'lib', 'components'];

export function sortEntries(entries: fs.Dirent[]): fs.Dirent[] {
    return entries.sort((a, b) => {
        const ai = PRIORITY_DIRS.indexOf(a.name);
        const bi = PRIORITY_DIRS.indexOf(b.name);

        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
    });
}

/* ========================================
   CACHING SYSTEM
   ======================================== */

interface CacheEntry<T> {
    ts: number;
    value: T;
}

const cache = new Map<string, CacheEntry<any>>();
const TTL = 2000; // 2 seconds

export function cached<T>(key: string, fn: () => T): T {
    const now = Date.now();
    const hit = cache.get(key);

    if (hit && now - hit.ts < TTL) {
        return hit.value;
    }

    const value = fn();
    cache.set(key, { ts: now, value });
    return value;
}

export function clearCache(): void {
    cache.clear();
}

/* ========================================
   MODE DETECTION
   ======================================== */

export function detectMode(line: string): Mode {
    const trimmed = line.trimStart();

    // Check for explicit command prefixes
    if (trimmed.startsWith('$') || trimmed.startsWith('!')) {
        return 'command';
    }

    const tokens = line.split(/\s+/);
    const last = tokens[tokens.length - 1];

    // Check for file reference (@)
    if (last?.startsWith('@')) {
        return 'file';
    }

    // Check for directory reference (#)
    if (last?.startsWith('#')) {
        return 'dir';
    }

    // Check if first token is a command (fish-style)
    const first = tokens[0];
    if (first) {
        const commands = loadCommands();
        if (commands.includes(first)) {
            return 'command';
        }
    }

    // Default to chat mode
    return 'chat';
}

/* ========================================
   COMMAND COMPLETION (PATH)
   ======================================== */

let commandCache: string[] | null = null;

// Common shell builtins that should always be available
const SHELL_BUILTINS = [
    'cd', 'pwd', 'ls', 'mkdir', 'rmdir', 'rm', 'cp', 'mv', 'cat',
    'echo', 'grep', 'find', 'head', 'tail', 'less', 'more',
    'chmod', 'chown', 'touch', 'ln', 'df', 'du', 'free',
    'ps', 'top', 'kill', 'killall', 'bg', 'fg', 'jobs',
    'export', 'unset', 'env', 'alias', 'unalias',
    'history', 'type', 'which', 'whereis', 'man',
    'sleep', 'wait', 'date', 'cal', 'uptime', 'uname',
    'tar', 'gzip', 'gunzip', 'zip', 'unzip',
    'curl', 'wget', 'ssh', 'scp', 'rsync'
];

export function loadCommands(): string[] {
    return cached('PATH_COMMANDS', () => {
        const paths = process.env.PATH?.split(path.delimiter) ?? [];
        const cmds = new Set<string>(SHELL_BUILTINS);

        for (const p of paths) {
            try {
                for (const f of fs.readdirSync(p)) {
                    cmds.add(f);
                }
            } catch {
                // Ignore directories we can't read
            }
        }

        commandCache = [...cmds];
        return commandCache;
    });
}

export function completeCommands(partial: string): string[] {
    return loadCommands().filter(cmd => cmd.startsWith(partial));
}

/* ========================================
   FILE/DIRECTORY COMPLETION
   ======================================== */

function splitToken(line: string): { prefix: string; token: string } {
    const match = line.match(/(.+?\s)?([^\s]*)$/);
    return {
        prefix: match?.[1] ?? '',
        token: match?.[2] ?? ''
    };
}

export function completePath(
    raw: string,
    type: 'file' | 'dir'
): string[] {
    // Remove sigil (@ or #)
    const withoutSigil = raw.slice(1);

    // Handle case: only sigil (e.g., "@")
    if (!withoutSigil) {
        const currentDir = process.cwd();
        try {
            let entries = fs.readdirSync(currentDir, { withFileTypes: true });
            entries = sortEntries(entries);
            return entries
                .filter(e => type === 'file' ? e.isFile() : e.isDirectory())
                .map(e => (type === 'file' ? '@' : '#') + e.name);
        } catch {
            return [];
        }
    }

    // Extract base directory and partial name
    const baseDir = withoutSigil.includes(path.sep)
        ? path.dirname(withoutSigil)
        : '.';

    const partial = withoutSigil.includes(path.sep)
        ? path.basename(withoutSigil)
        : withoutSigil;

    const resolvedBase = path.resolve(baseDir);

    if (!fs.existsSync(resolvedBase) || !fs.statSync(resolvedBase).isDirectory()) {
        return [];
    }

    let entries: fs.Dirent[];
    try {
        entries = fs.readdirSync(resolvedBase, { withFileTypes: true });
        entries = sortEntries(entries);
    } catch {
        return [];
    }

    return entries
        .filter(e => {
            const matchesPrefix = e.name.startsWith(partial);
            if (!matchesPrefix) return false;
            return type === 'file' ? e.isFile() : e.isDirectory();
        })
        .map(e => {
            const fullName = (baseDir === '.' ? '' : baseDir + path.sep) + e.name;
            const sigil = type === 'file' ? '@' : '#';
            return sigil + fullName;
        });
}

/* ========================================
   FILE:LINE COMPLETION
   ======================================== */

export function completeFileWithLine(token: string): string[] {
    const [filePath, linePart] = token.slice(1).split(':');

    if (!filePath) {
        return completePath('@' + token, 'file');
    }

    const absolutePath = path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
        return [];
    }

    if (linePart !== undefined) {
        // Suggest common line numbers
        const lineNums = ['1', '10', '20', '50', '100', '200'];
        const matches = lineNums.filter(ln => ln.startsWith(linePart));
        return matches.map(ln => '@' + filePath + ':' + ln);
    }

    // File exists, add colon for line input
    return ['@' + filePath + ':'];
}

/* ========================================
   ARGUMENT COMPLETION (GIT, etc.)
   ======================================== */

export function completeGitArgs(args: string[]): string[] {
    try {
        if (args.length <= 1) {
            // Complete subcommands
            const subcommands = [
                'add', 'branch', 'checkout', 'commit', 'diff',
                'log', 'merge', 'pull', 'push', 'rebase',
                'status', 'reset', 'revert', 'stash'
            ];
            return subcommands.filter(cmd => cmd.startsWith(args[1] || ''));
        }

        if (args[1] === 'checkout' && args.length <= 2) {
            // Complete branches
            try {
                const branches = execSync('git branch --all', {
                    encoding: 'utf8',
                    cwd: process.cwd()
                });
                return branches
                    .split('\n')
                    .map(l => l.replace(/^[* ]+/, '').trim())
                    .filter(b => b && b.startsWith(args[2] || ''));
            } catch {
                return [];
            }
        }
    } catch {
        // Not in a git repo or git not available
    }

    return [];
}

/* ========================================
   SMART COMPLETER (Main Entry)
   ======================================== */

export function createCompleter(): readline.Completer {
    return (line: string) => {
        try {
            const mode = detectMode(line);
            const { prefix, token } = splitToken(line);

            if (mode === 'file' && token.startsWith('@')) {
                if (token.includes(':')) {
                    // File:line mode
                    const matches = completeFileWithLine(token);
                    return [matches, token];
                }

                // File completion
                const matches = completePath(token, 'file');
                return [matches, token];
            }

            if (mode === 'dir' && token.startsWith('#')) {
                // Directory completion
                const matches = completePath(token, 'dir');
                return [matches, token];
            }

            if (mode === 'command') {
                // Command completion
                const cmdLine = line.replace(/^[$!]/, '');
                const parts = cmdLine.split(/\s+/);
                const cmd = parts[0];
                const current = parts[parts.length - 1] || '';

                // Git argument completion
                if (cmd === 'git') {
                    const matches = completeGitArgs(parts);
                    const filtered = matches.filter(m => m.startsWith(current));
                    return [filtered, current];
                }

                // General command completion
                const matches = completeCommands(current);
                return [matches, current];
            }

            // Default: no completion in chat mode
            return [[], line];
        } catch (error) {
            // Fail gracefully
            return [[], line];
        }
    };
}

/* ========================================
   COMMAND EXECUTION
   ======================================== */

export async function executeCommand(
    cmdLine: string,
    onExit?: (code: number | null) => void
): Promise<void> {
    const trimmed = cmdLine.trim();
    const command = trimmed.replace(/^[$!]\s*/, '');

    const child = spawn(command, {
        stdio: 'inherit',
        shell: true,
        cwd: process.cwd()
    });

    child.on('exit', (code) => {
        if (onExit) {
            onExit(code);
        }
    });

    child.on('error', (err) => {
        console.error(`\n[Command Error]: ${err.message}`);
        if (onExit) {
            onExit(1);
        }
    });

    return new Promise((resolve) => {
        child.on('close', () => resolve());
    });
}

/* ========================================
   GHOST TEXT (Suggestions)
   ======================================== */

let currentGhostText = '';

export function predictGhostText(line: string): string {
    const mode = detectMode(line);

    if (mode === 'command') {
        const cmdLine = line.replace(/^[$!]/, '');

        // Git suggestions
        if (cmdLine === 'git ch') return 'eckout';
        if (cmdLine === 'git st') return 'atus';
        if (cmdLine === 'git co') return 'mmit';

        // NPM suggestions
        if (cmdLine === 'npm r') return 'un dev';
        if (cmdLine === 'npm b') return 'uild';

        // LS suggestions
        if (cmdLine === 'ls -') return 'la';

        // Common patterns
        if (cmdLine === 'gi') return 't';
    }

    return '';
}

export function renderGhost(rl: readline.Interface): void {
    if (!currentGhostText) return;
    process.stdout.write(`\x1b[90m${currentGhostText}\x1b[0m`);
}

export function clearGhost(rl: readline.Interface): void {
    if (currentGhostText) {
        process.stdout.write(`\x1b[2K\r`);
        currentGhostText = '';
    }
}

export function updateGhost(line: string): void {
    currentGhostText = predictGhostText(line);
}

/* ========================================
   PLUGIN SYSTEM
   ======================================== */

const plugins = new Map<string, CommandPlugin>();
const PLUGIN_DIR = path.join(findProjectRoot(), '.shell', 'plugins');

export function loadPlugins(): void {
    if (!fs.existsSync(PLUGIN_DIR)) {
        try {
            fs.mkdirSync(PLUGIN_DIR, { recursive: true });
        } catch {
            // Can't create plugin directory
        }
        return;
    }

    try {
        for (const file of fs.readdirSync(PLUGIN_DIR)) {
            if (file.endsWith('.js') || file.endsWith('.ts')) {
                try {
                    const pluginPath = path.join(PLUGIN_DIR, file);
                    const plugin = require(pluginPath);
                    if (plugin.command && plugin.complete) {
                        plugins.set(plugin.command, plugin);
                    }
                } catch {
                    // Invalid plugin
                }
            }
        }
    } catch {
        // Can't read plugin directory
    }
}

export function getPlugin(command: string): CommandPlugin | undefined {
    return plugins.get(command);
}

export function listPlugins(): string[] {
    return [...plugins.keys()];
}

/* ========================================
   INITIALIZE
   ======================================== */

export function initialize(): void {
    findProjectRoot();
    loadPlugins();
    loadCommands();
}

// Auto-initialize on import
initialize();

````

## 📄 src/core/apps.ts

````typescript
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import os from 'os';
import { DEFAULT_APPS, parseAppsConfig } from './validation';

export { DEFAULT_APPS };

export function loadAppsConfig(): Record<string, string> {
    const configPaths = [
        path.join(process.cwd(), 'yuangs.config.json'),
        path.join(process.cwd(), 'yuangs.config.yaml'),
        path.join(process.cwd(), 'yuangs.config.yml'),
        path.join(process.cwd(), '.yuangs.json'),
        path.join(process.cwd(), '.yuangs.yaml'),
        path.join(process.cwd(), '.yuangs.yml'),
        path.join(os.homedir(), '.yuangs.json'),
        path.join(os.homedir(), '.yuangs.yaml'),
        path.join(os.homedir(), '.yuangs.yml'),
    ];

    for (const configPath of configPaths) {
        if (fs.existsSync(configPath)) {
            try {
                const configContent = fs.readFileSync(configPath, 'utf8');
                let config: Record<string, string>;
                if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
                    config = yaml.load(configContent) as Record<string, string>;
                } else {
                    config = parseAppsConfig(configContent);
                }
                return config;
            } catch (error) { }
        }
    }
    return DEFAULT_APPS;
}


export function openUrl(url: string) {
    let command;
    switch (process.platform) {
        case 'darwin': command = `open "${url}"`; break;
        case 'win32': command = `start "${url}"`; break;
        default: command = `xdg-open "${url}"`; break;
    }
    exec(command);
}

````

## 📄 src/core/autofix.ts

````typescript
import { OSProfile } from './os';
import { buildFixPrompt } from '../ai/prompt';
import { askAI } from '../ai/client';
import { safeParseJSON, AIFixPlan, aiFixPlanSchema } from './validation';

export async function autoFixCommand(
    originalCmd: string,
    stderr: string,
    os: OSProfile,
    model?: string
): Promise<AIFixPlan | null> {
    const prompt = buildFixPrompt(originalCmd, stderr, os);
    const raw = await askAI(prompt, model);

    const parseResult = safeParseJSON(raw, aiFixPlanSchema, {} as AIFixPlan);

    if (!parseResult.success) {
        return null;
    }

    return parseResult.data;
}

````

## 📄 src/core/capabilities.ts

````typescript
export enum AtomicCapability {
  TEXT_GENERATION = 'text_generation',
  CODE_GENERATION = 'code_generation',
  TOOL_CALLING = 'tool_calling',
  LONG_CONTEXT = 'long_context',
  REASONING = 'reasoning',
  STREAMING = 'streaming',
}

export interface CompositeCapability {
  name: string;
  composedOf: AtomicCapability[];
}

export const COMPOSITE_CAPABILITIES: CompositeCapability[] = [
  {
    name: 'interactive_agent',
    composedOf: [AtomicCapability.TOOL_CALLING, AtomicCapability.REASONING],
  },
  {
    name: 'large_repo_analysis',
    composedOf: [AtomicCapability.LONG_CONTEXT, AtomicCapability.REASONING],
  },
  {
    name: 'safe_code_editing',
    composedOf: [AtomicCapability.CODE_GENERATION, AtomicCapability.REASONING],
  },
];

export enum ConstraintCapability {
  PREFER_DETERMINISTIC = 'prefer_deterministic',
  LOW_COST = 'low_cost',
  FAST_RESPONSE = 'fast_response',
}

export const CAPABILITY_VERSION = '1.0';

export function isAtomicCapability(value: string): value is AtomicCapability {
  return Object.values(AtomicCapability).includes(value as AtomicCapability);
}

export function isConstraintCapability(value: string): value is ConstraintCapability {
  return Object.values(ConstraintCapability).includes(value as ConstraintCapability);
}

export function resolveCompositeCapability(name: string): AtomicCapability[] {
  const composite = COMPOSITE_CAPABILITIES.find(c => c.name === name);
  if (!composite) {
    throw new Error(`Unknown composite capability: ${name}`);
  }
  return composite.composedOf;
}

export function expandCapabilities(
  capabilities: Array<AtomicCapability | string>
): Set<AtomicCapability> {
  const result = new Set<AtomicCapability>();

  for (const cap of capabilities) {
    if (isAtomicCapability(cap)) {
      result.add(cap);
    } else {
      const atomicCaps = resolveCompositeCapability(cap);
      atomicCaps.forEach(c => result.add(c));
    }
  }

  return result;
}

````

## 📄 src/core/capabilityInference.ts

````typescript
import { AtomicCapability } from '../core/capabilities';
import type { CapabilityRequirement } from '../core/modelMatcher';

export function inferCapabilityRequirement(userInput: string): CapabilityRequirement {
  const required: AtomicCapability[] = [];

  const input = userInput.toLowerCase();

  if (input.includes('代码') || input.includes('script') || input.includes('文件') || input.includes('create') || input.includes('write')) {
    required.push(AtomicCapability.CODE_GENERATION);
  }

  if (input.includes('分析') || input.includes('理解') || input.includes('解释') || input.includes('推理')) {
    required.push(AtomicCapability.REASONING);
  }

  if (input.includes('长') || input.includes('large') || input.includes('仓库') || input.includes('目录') || input.includes('所有文件')) {
    required.push(AtomicCapability.LONG_CONTEXT);
  }

  return {
    required: Array.from(new Set(required)),
    preferred: [],
  };
}

````

## 📄 src/core/capabilitySystem.ts

````typescript
import {
  CapabilityRequirement,
  matchModelWithFallback,
  ModelCapabilities,
  CapabilityMatchResult,
} from './modelMatcher';
import {
  mergeConfigs,
  loadConfigAt,
  dumpConfigSnapshot,
  getConfigFilePaths,
  MergedConfig,
} from './configMerge';
import {
  createExecutionRecord,
  ExecutionRecord,
} from './executionRecord';
import {
  saveExecutionRecord,
  loadExecutionRecord,
  listExecutionRecords,
} from './executionStore';
import { replayEngine, ReplayOptions, ReplayResult } from './replayEngine';

export class CapabilitySystem {
  private primaryModels: ModelCapabilities[] = [];
  private fallbackModels: ModelCapabilities[] = [];

  constructor() {
    this.initializeDefaultModels();
  }

  private initializeDefaultModels(): void {
    // 初始化为空数组，让配置文件成为主要来源
    this.primaryModels = [];
    this.fallbackModels = [];
  }

  matchCapability(requirement: CapabilityRequirement): CapabilityMatchResult {
    const allModels = this.getAllModels();
    const primaryModels = [...this.primaryModels, ...this.loadCustomModels()];
    return matchModelWithFallback(
      primaryModels,
      this.fallbackModels,
      requirement
    );
  }

  loadMergedConfig(): MergedConfig {
    const builtin = {
      aiProxyUrl: 'https://aiproxy.want.biz/v1/chat/completions',
      defaultModel: 'gemini-2.5-flash-lite',
      accountType: 'free',
    };

    const filePaths = getConfigFilePaths();
    const projectConfig = filePaths.project ? loadConfigAt(filePaths.project) : null;
    const userGlobal = loadConfigAt(filePaths.userGlobal);

    return mergeConfigs(builtin, userGlobal, projectConfig, null);
  }

  loadCustomModels(): ModelCapabilities[] {
    const filePaths = getConfigFilePaths();
    const projectConfig = filePaths.project ? loadConfigAt(filePaths.project) : null;
    const userGlobal = loadConfigAt(filePaths.userGlobal);

    const customModelsArray = [];
    if (userGlobal?.models && Array.isArray(userGlobal.models)) {
      customModelsArray.push(...userGlobal.models as ModelCapabilities[]);
    }
    if (projectConfig?.models && Array.isArray(projectConfig.models)) {
      customModelsArray.push(...projectConfig.models as ModelCapabilities[]);
    }

    return customModelsArray;
  }

  getAllModels(): ModelCapabilities[] {
    const customModels = this.loadCustomModels();
    return [...this.primaryModels, ...this.fallbackModels, ...customModels];
  }

  createAndSaveExecutionRecord(
    commandName: string,
    requirement: CapabilityRequirement,
    matchResult: CapabilityMatchResult,
    command?: string
  ): string {
    const config = this.loadMergedConfig();
    const record = createExecutionRecord(
      commandName,
      requirement,
      config,
      matchResult,
      { success: matchResult.selected !== null },
      command
    );

    const filePath = saveExecutionRecord(record);
    return record.id;
  }

  replayExecution(recordId: string, options: ReplayOptions): Promise<ReplayResult> {
    return replayEngine.replay(recordId, options);
  }

  explainConfig(): string {
    const config = this.loadMergedConfig();
    return dumpConfigSnapshot(config);
  }
}

export const capabilitySystem = new CapabilitySystem();

````

## 📄 src/core/configMerge.ts

````typescript
import fs from 'fs';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';

export type ConfigSource = 'built-in' | 'user-global' | 'project' | 'command-override';

export interface ConfigFieldSource<T = unknown> {
  value: T;
  source: ConfigSource;
  filePath?: string;
}

export interface MergedConfig {
  aiProxyUrl: ConfigFieldSource<string>;
  defaultModel: ConfigFieldSource<string>;
  accountType: ConfigFieldSource<'free' | 'pro'>;
  [key: string]: ConfigFieldSource<unknown>;
}

export function loadConfigAt(filePath: string): Record<string, unknown> | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
      return yaml.load(content) as Record<string, unknown>;
    }
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Failed to load config from ${filePath}:`, error);
    return null;
  }
}

export function mergeConfigs(
  builtin: Record<string, unknown>,
  userGlobal: Record<string, unknown> | null,
  project: Record<string, unknown> | null,
  commandOverride: Record<string, unknown> | null
): MergedConfig {
  const merged: MergedConfig = {} as MergedConfig;

  const addField = (key: string, value: unknown, source: ConfigSource, filePath?: string) => {
    merged[key] = { value, source, filePath };
  };

  Object.entries(builtin).forEach(([key, value]) => {
    addField(key, value, 'built-in');
  });

  if (userGlobal) {
    Object.entries(userGlobal).forEach(([key, value]) => {
      addField(key, value, 'user-global', path.join(os.homedir(), '.yuangs.json'));
    });
  }

  if (project) {
    Object.entries(project).forEach(([key, value]) => {
      addField(key, value, 'project');
    });
  }

  if (commandOverride) {
    Object.entries(commandOverride).forEach(([key, value]) => {
      addField(key, value, 'command-override');
    });
  }

  return merged;
}

export function dumpConfigSnapshot(config: MergedConfig): string {
  const output: Record<string, any> = {};

  Object.entries(config).forEach(([key, field]) => {
    output[key] = {
      value: field.value,
      source: field.source,
      filePath: field.filePath,
    };
  });

  return JSON.stringify(output, null, 2);
}

function findProjectConfig(cwd = process.cwd()): string | null {
  let dir = cwd;
  const configFiles = ['.yuangs.json', '.yuangs.yaml', '.yuangs.yml', 'yuangs.config.json'];

  while (dir && dir !== path.dirname(dir)) {
    for (const filename of configFiles) {
      const candidate = path.join(dir, filename);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    dir = path.dirname(dir);
  }

  const root = path.parse(cwd).root;
  for (const filename of configFiles) {
    const rootCandidate = path.join(root, filename);
    if (fs.existsSync(rootCandidate)) {
      return rootCandidate;
    }
  }

  return null;
}

export function getConfigFilePaths(): {
  userGlobal: string;
  project: string | null;
} {
  return {
    userGlobal: path.join(os.homedir(), '.yuangs.json'),
    project: findProjectConfig(),
  };
}

````

## 📄 src/core/executionRecord.ts

````typescript
import { MergedConfig } from './configMerge';
import { ModelCapabilities, CapabilityMatchExplanation } from './modelMatcher';
import { CapabilityRequirement } from './modelMatcher';

export interface ExecutionMeta {
  commandName: string;
  timestamp: string;
  toolVersion: string;
  projectPath: string;
}

export interface CapabilityIntent {
  required: string[];
  preferred: string[];
  capabilityVersion: string;
}

export interface ModelDecision {
  candidateModels: CapabilityMatchExplanation[];
  selectedModel: ModelCapabilities | null;
  usedFallback: boolean;
  fallbackReason?: string;
}

export interface ExecutionOutcome {
  success: boolean;
  failureReason?: 'capability-mismatch' | 'provider-error' | 'user-abort' | 'timeout' | 'other';
  tokenCount?: number;
  latencyMs?: number;
}

export interface ExecutionRecord {
  id: string;
  meta: ExecutionMeta;
  intent: CapabilityIntent;
  configSnapshot: MergedConfig;
  decision: ModelDecision;
  outcome: ExecutionOutcome;
  command?: string;
}

export function createExecutionId(): string {
  return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createExecutionRecord(
  commandName: string,
  requirement: CapabilityRequirement,
  config: MergedConfig,
  matchResult: any,
  outcome: Partial<ExecutionOutcome> = {},
  command?: string
): ExecutionRecord {
  const version = require('../../package.json').version;

  return {
    id: createExecutionId(),
    meta: {
      commandName,
      timestamp: new Date().toISOString(),
      toolVersion: version,
      projectPath: process.cwd(),
    },
    intent: {
      required: requirement.required.map(String),
      preferred: requirement.preferred.map(String),
      capabilityVersion: require('./capabilities').CAPABILITY_VERSION,
    },
    configSnapshot: config,
    decision: {
      candidateModels: matchResult.candidates || [],
      selectedModel: matchResult.selected,
      usedFallback: matchResult.fallbackOccurred,
    },
    outcome: {
      success: outcome.success ?? false,
      ...outcome,
    },
    command,
  };
}

export function serializeExecutionRecord(record: ExecutionRecord): string {
  return JSON.stringify(record, null, 2);
}

export function deserializeExecutionRecord(json: string): ExecutionRecord {
  return JSON.parse(json) as ExecutionRecord;
}

````

## 📄 src/core/executionStore.ts

````typescript
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ExecutionRecord, serializeExecutionRecord, deserializeExecutionRecord } from './executionRecord';

const RECORD_DIR = path.join(os.homedir(), '.yuangs', 'executions');

export function ensureRecordDir(): void {
  if (!fs.existsSync(RECORD_DIR)) {
    fs.mkdirSync(RECORD_DIR, { recursive: true });
  }
}

export function saveExecutionRecord(record: ExecutionRecord): string {
  ensureRecordDir();

  const filename = `${record.id}.json`;
  const filepath = path.join(RECORD_DIR, filename);

  fs.writeFileSync(filepath, serializeExecutionRecord(record), 'utf8');

  return filepath;
}

export function loadExecutionRecord(id: string): ExecutionRecord | null {
  ensureRecordDir();

  const filename = `${id}.json`;
  const filepath = path.join(RECORD_DIR, filename);

  if (!fs.existsSync(filepath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filepath, 'utf8');
    return deserializeExecutionRecord(content);
  } catch (error) {
    console.error(`Failed to load execution record ${id}:`, error);
    return null;
  }
}

export function listExecutionRecords(limit: number = 50): ExecutionRecord[] {
  ensureRecordDir();

  const files = fs.readdirSync(RECORD_DIR)
    .filter(f => f.endsWith('.json'))
    .sort((a, b) => {
      const statA = fs.statSync(path.join(RECORD_DIR, a));
      const statB = fs.statSync(path.join(RECORD_DIR, b));
      return statB.mtimeMs - statA.mtimeMs;
    })
    .slice(0, limit);

  const records: ExecutionRecord[] = [];

  for (const file of files) {
    const record = loadExecutionRecord(file.replace('.json', ''));
    if (record) {
      records.push(record);
    }
  }

  return records;
}

export function deleteExecutionRecord(id: string): boolean {
  ensureRecordDir();

  const filename = `${id}.json`;
  const filepath = path.join(RECORD_DIR, filename);

  if (!fs.existsSync(filepath)) {
    return false;
  }

  try {
    fs.unlinkSync(filepath);
    return true;
  } catch (error) {
    console.error(`Failed to delete execution record ${id}:`, error);
    return false;
  }
}

export function clearAllExecutionRecords(): void {
  ensureRecordDir();

  const files = fs.readdirSync(RECORD_DIR).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const filepath = path.join(RECORD_DIR, file);
    try {
      fs.unlinkSync(filepath);
    } catch (error) {
      console.error(`Failed to delete ${filepath}:`, error);
    }
  }
}

````

## 📄 src/core/executor.ts

````typescript
import { spawn } from 'child_process';

export type ExecResult = {
    stdout: string;
    stderr: string;
    code: number | null;
};

export async function exec(command: string): Promise<ExecResult> {
    return new Promise((resolve) => {
        let stdout = '';
        let stderr = '';

        // Use user's preferred shell back with full support for their environment
        const shell = process.env.SHELL || true;
        const child = spawn(command, [], { shell });

        child.stdout.on('data', (data) => {
            stdout += data.toString();
            process.stdout.write(data);
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
            process.stderr.write(data);
        });

        child.on('close', (code) => {
            resolve({ stdout, stderr, code });
        });

        child.on('error', (err) => {
            stderr += err.message;
            resolve({ stdout, stderr, code: 1 });
        });
    });
}

````

## 📄 src/core/fileReader.ts

````typescript
import fs from 'fs';
import path from 'path';

export function parseFilePathsFromLsOutput(output: string): string[] {
    const lines = output.trim().split('\n');
    const filePaths: string[] = [];

    for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const lastPart = parts[parts.length - 1];
        
        if (lastPart && !lastPart.startsWith('-') && lastPart !== '.' && lastPart !== '..') {
            filePaths.push(lastPart);
        }
    }

    return filePaths;
}

export function readFilesContent(filePaths: string[]): Map<string, string> {
    const contentMap = new Map<string, string>();

    for (const filePath of filePaths) {
        try {
            const fullPath = path.resolve(filePath);
            if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
                const content = fs.readFileSync(fullPath, 'utf-8');
                contentMap.set(filePath, content);
            }
        } catch (error) {
            console.error(`无法读取文件: ${filePath}`);
        }
    }

    return contentMap;
}

export function buildPromptWithFileContent(
    originalOutput: string,
    filePaths: string[],
    contentMap: Map<string, string>,
    question?: string
): string {
    let prompt = '';

    prompt += '## 文件列表\n';
    prompt += '```\n';
    prompt += originalOutput;
    prompt += '```\n\n';

    if (contentMap.size > 0) {
        prompt += '## 文件内容\n\n';
        for (const [filePath, content] of contentMap) {
            prompt += `### ${filePath}\n`;
            prompt += '```\n';
            const maxChars = 5000;
            const truncated = content.length > maxChars 
                ? content.substring(0, maxChars) + '\n... (内容过长已截断)'
                : content;
            prompt += truncated;
            prompt += '\n```\n\n';
        }
    }

    if (question) {
        prompt += `\n## 我的问题\n${question}`;
    } else {
        prompt += '\n## 我的问题\n请分析以上文件列表和文件内容';
    }

    return prompt;
}

````

## 📄 src/core/macros.ts

````typescript
import fs from 'fs';
import path from 'path';
import os from 'os';
import { parseMacros, type Macro } from './validation';

const USER_MACROS_FILE = path.join(os.homedir(), '.yuangs_macros.json');

export type { Macro };

function loadMacrosFromFile(filePath: string): Record<string, Macro> {
    if (fs.existsSync(filePath)) {
        try {
            return parseMacros(fs.readFileSync(filePath, 'utf8'));
        } catch (e) { }
    }
    return {};
}

function findProjectMacros(cwd = process.cwd()): string | null {
    let dir = cwd;
    while (dir && dir !== path.dirname(dir)) {
        const candidate = path.join(dir, 'yuangs_macros.json');
        if (fs.existsSync(candidate)) {
            return candidate;
        }
        dir = path.dirname(dir);
    }
    // Check root one last time
    const rootCandidate = path.join(targetRoot(dir), 'yuangs_macros.json');
    if (fs.existsSync(rootCandidate)) return rootCandidate;
    
    return null;
}

// Helper to reliably stop at root (dirname('/') is '/')
function targetRoot(dir: string) {
    return path.parse(dir).root;
}

export function getMacros(): Record<string, Macro> {
    const userMacros = loadMacrosFromFile(USER_MACROS_FILE);
    
    const projectMacrosPath = findProjectMacros();
    const projectMacros = projectMacrosPath ? loadMacrosFromFile(projectMacrosPath) : {};

    return {
        ...userMacros,
        ...projectMacros // Project overrides User
    };
}

export function saveMacro(name: string, commands: string, description: string = '') {
    // Only load USER macros for saving
    const macros = loadMacrosFromFile(USER_MACROS_FILE);
    macros[name] = {
        commands,
        description,
        createdAt: new Date().toISOString()
    };
    fs.writeFileSync(USER_MACROS_FILE, JSON.stringify(macros, null, 2));
    return true;
}

export function deleteMacro(name: string) {
    // Only delete from USER macros
    const macros = loadMacrosFromFile(USER_MACROS_FILE);
    if (macros[name]) {
        delete macros[name];
        fs.writeFileSync(USER_MACROS_FILE, JSON.stringify(macros, null, 2));
        return true;
    }
    return false;
}

export function runMacro(name: string) {
    const macros = getMacros();
    const macro = macros[name];
    if (!macro) return false;

    const { spawn } = require('child_process');
    spawn(macro.commands, [], { shell: true, stdio: 'inherit' });
    return true;
}

````

## 📄 src/core/modelMatcher.ts

````typescript
import { AtomicCapability, ConstraintCapability, expandCapabilities } from './capabilities';

export interface ModelCapabilities {
  name: string;
  provider: string;
  atomicCapabilities: AtomicCapability[];
  contextWindow?: number;
  costProfile?: 'low' | 'medium' | 'high';
}

export interface CapabilityRequirement {
  required: AtomicCapability[];
  preferred: AtomicCapability[];
  constraints?: ConstraintCapability[];
}

export interface CapabilityMatchExplanation {
  modelName: string;
  provider: string;
  hasRequired: boolean;
  hasPreferred: AtomicCapability[];
  missingRequired: AtomicCapability[];
  reason: string;
}

export interface CapabilityMatchResult {
  selected: ModelCapabilities | null;
  candidates: CapabilityMatchExplanation[];
  fallbackOccurred: boolean;
}

export function matchModel(
  models: ModelCapabilities[],
  requirement: CapabilityRequirement
): CapabilityMatchResult {
  const explanations: CapabilityMatchExplanation[] = [];

  for (const model of models) {
    const hasRequired = requirement.required.every(cap =>
      model.atomicCapabilities.includes(cap)
    );

    const missingRequired = requirement.required.filter(cap =>
      !model.atomicCapabilities.includes(cap)
    );

    const hasPreferred = requirement.preferred.filter(cap =>
      model.atomicCapabilities.includes(cap)
    );

    const explanation: CapabilityMatchExplanation = {
      modelName: model.name,
      provider: model.provider,
      hasRequired,
      hasPreferred,
      missingRequired,
      reason: hasRequired
        ? `Has all required capabilities. Matches ${hasPreferred.length}/${requirement.preferred.length} preferred.`
        : `Missing required capabilities: ${missingRequired.map(c => String(c)).join(', ')}`,
    };

    explanations.push(explanation);
  }

  const matchingModels = explanations.filter(e => e.hasRequired);

  if (matchingModels.length === 0) {
    return {
      selected: null,
      candidates: explanations,
      fallbackOccurred: false,
    };
  }

  const bestMatch = matchingModels[0];
  const selectedModel = models.find(m => m.name === bestMatch.modelName);

  return {
    selected: selectedModel || null,
    candidates: explanations,
    fallbackOccurred: false,
  };
}

export function matchModelWithFallback(
  models: ModelCapabilities[],
  fallbackModels: ModelCapabilities[],
  requirement: CapabilityRequirement
): CapabilityMatchResult {
  const primaryResult = matchModel(models, requirement);

  if (primaryResult.selected) {
    return primaryResult;
  }

  const fallbackResult = matchModel(fallbackModels, requirement);

  return {
    ...fallbackResult,
    fallbackOccurred: fallbackResult.selected !== null,
  };
}

````

## 📄 src/core/os.ts

````typescript
export type OSProfile = {
    name: string;
    shell: string;
    find: 'bsd' | 'gnu';
    stat: 'bsd' | 'gnu';
};

export function getOSProfile(): OSProfile {
    switch (process.platform) {
        case 'darwin':
            return {
                name: 'macOS',
                shell: 'zsh',
                find: 'bsd',
                stat: 'bsd',
            };
        case 'linux':
            return {
                name: 'Linux',
                shell: 'bash',
                find: 'gnu',
                stat: 'gnu',
            };
        case 'win32':
            return {
                name: 'Windows',
                shell: 'cmd',
                find: 'gnu', // Win32 find is different, but for AI context let's assume GNU style tools if they are there, or just label it.
                stat: 'gnu',
            };
        default:
            return {
                name: process.platform,
                shell: 'sh',
                find: 'gnu',
                stat: 'gnu',
            };
    }
}

````

## 📄 src/core/replayEngine.ts

````typescript
import chalk from 'chalk';
import { ExecutionRecord } from './executionRecord';
import { loadExecutionRecord } from './executionStore';

export type ReplayMode = 'strict' | 'compatible' | 're-evaluate';

export interface ReplayOptions {
  mode: ReplayMode;
  skipAI?: boolean;
  verbose?: boolean;
}

export interface ReplayResult {
  success: boolean;
  message: string;
  executedModel?: string;
  deviationReason?: string;
}

export class ReplayEngine {
  async replay(recordId: string, options: ReplayOptions = { mode: 'strict' }): Promise<ReplayResult> {
    const record = loadExecutionRecord(recordId);

    if (!record) {
      return {
        success: false,
        message: `Execution record ${recordId} not found`,
      };
    }

    if (options.mode === 'strict') {
      return this.strictReplay(record, options);
    }

    if (options.mode === 'compatible') {
      return this.compatibleReplay(record, options);
    }

    return this.reEvaluate(record, options);
  }

  private async strictReplay(
    record: ExecutionRecord,
    options: ReplayOptions
  ): Promise<ReplayResult> {
    const selectedModel = record.decision.selectedModel;

    if (options.verbose) {
      console.log(chalk.cyan('[Strict Replay]'));
      console.log(chalk.gray(`  Original Model: ${selectedModel?.name || 'N/A'}`));
      console.log(chalk.gray(`  Original Provider: ${selectedModel?.provider || 'N/A'}`));
      console.log(chalk.gray(`  Original Timestamp: ${record.meta.timestamp}`));
      console.log(chalk.gray(`  Original Command: ${record.meta.commandName}`));
    }

    if (options.skipAI) {
      return {
        success: true,
        message: 'Strict replay prepared (AI execution skipped)',
        executedModel: selectedModel?.name ?? undefined,
      };
    }

    if (!record.command) {
      return {
        success: false,
        message: 'Strict replay: No command to execute (command not stored in record)',
        executedModel: selectedModel?.name ?? undefined,
      };
    }

    const { exec } = require('./executor');

    try {
      console.log(chalk.gray('[Strict Replay] Executing with original parameters...'));
      const result = await exec(record.command);

      return {
        success: result.code === 0 || result.code === null,
        message: result.code === 0 || result.code === null
          ? 'Strict replay completed successfully'
          : `Strict replay failed with code ${result.code}`,
        executedModel: selectedModel?.name ?? undefined,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Strict replay error: ${message}`,
        executedModel: selectedModel?.name ?? undefined,
      };
    }
  }

  private async compatibleReplay(
    record: ExecutionRecord,
    options: ReplayOptions
  ): Promise<ReplayResult> {
    const originalModel = record.decision.selectedModel;

    if (options.verbose) {
      console.log(chalk.cyan('[Compatible Replay]'));
      console.log(chalk.gray(`  Original Model: ${originalModel?.name || 'N/A'}`));
      console.log(chalk.gray(`  Will attempt fallback if original unavailable`));
    }

    return {
      success: false,
      message: 'Compatible replay not yet implemented in Phase 1',
      executedModel: originalModel?.name,
      deviationReason: 'Phase 1 only supports strict replay',
    };
  }

  private async reEvaluate(
    record: ExecutionRecord,
    options: ReplayOptions
  ): Promise<ReplayResult> {
    if (options.verbose) {
      console.log(chalk.cyan('[Re-evaluate]'));
      console.log(chalk.gray(`  Will re-run capability matching with current config`));
      console.log(chalk.gray(`  Original Intent: ${record.intent.required.join(', ')}`));
    }

    return {
      success: false,
      message: 'Re-evaluate not yet implemented in Phase 1',
    };
  }
}

export const replayEngine = new ReplayEngine();

````

## 📄 src/core/risk.ts

````typescript
export function assessRisk(command: string, aiRisk: 'low' | 'medium' | 'high'): 'low' | 'medium' | 'high' {
    const HIGH_RISK_PATTERNS = [
        /\brm\b/i,
        /\bsudo\b/i,
        /\bmv\b/i,
        /\bdd\b/i,
        /\bchmod\b/i,
        /\bchown\b/i,
        />\s*\/dev\//,
        /:\(\)\s*\{.*\}/, // Fork bomb
        /\bmkfs\b/i,
    ];

    const hasHighRisk = HIGH_RISK_PATTERNS.some(pattern => pattern.test(command));

    if (hasHighRisk) return 'high';
    return aiRisk;
}

````

## 📄 src/core/validation.ts

````typescript
import { z } from 'zod';

export type UserConfig = {
    defaultModel?: string;
    aiProxyUrl?: string;
    accountType?: 'free' | 'pro';
    [key: string]: string | undefined;
};

export type AppsConfig = Record<string, string>;

export type AIRequestMessage = {
    role: 'system' | 'user' | 'assistant';
    content: string;
};

export type AIResponse = {
    choices?: Array<{
        message?: {
            content?: string;
        };
        delta?: {
            content?: string;
        };
    }>;
};

export const DEFAULT_AI_PROXY_URL = 'https://aiproxy.want.biz/v1/chat/completions';
export const DEFAULT_MODEL = 'gemini-2.5-flash-lite';
export const DEFAULT_ACCOUNT_TYPE = 'free' as const;

export const DEFAULT_APPS = {
    shici: 'https://wealth.want.biz/shici/index.html',
    dict: 'https://wealth.want.biz/pages/dict.html',
    pong: 'https://wealth.want.biz/pages/pong.html'
} as const;

export const aiCommandPlanSchema = z.object({
    plan: z.string().describe('Explanation of the command'),
    command: z.string().optional().describe('The shell command to execute'),
    macro: z.string().optional().describe('Name of an existing macro to reuse'),
    risk: z.enum(['low', 'medium', 'high']).describe('Risk level assessment')
}).refine(data => data.command || data.macro, {
    message: 'Either command or macro must be provided'
});

export type AICommandPlan = z.infer<typeof aiCommandPlanSchema>;

export const aiFixPlanSchema = z.object({
    plan: z.string().describe('Fix explanation'),
    command: z.string().describe('The fixed shell command (always required for fixes)'),
    risk: z.enum(['low', 'medium', 'high']).describe('Risk level assessment')
});

export type AIFixPlan = z.infer<typeof aiFixPlanSchema>;

export const userConfigSchema = z.object({
    defaultModel: z.string().optional(),
    aiProxyUrl: z.string().url().optional(),
    accountType: z.enum(['free', 'pro']).optional()
});

export const appsConfigSchema = z.record(z.string(), z.string());

export const macroSchema = z.object({
    commands: z.string(),
    description: z.string(),
    createdAt: z.string()
});

export type Macro = z.infer<typeof macroSchema>;

export const historyEntrySchema = z.object({
    question: z.string(),
    command: z.string(),
    time: z.string()
});

export type HistoryEntry = z.infer<typeof historyEntrySchema>;

export function extractJSON(raw: string): string {
    let jsonContent = raw.trim();

    if (jsonContent.includes('```json')) {
        jsonContent = jsonContent.split('```json')[1].split('```')[0].trim();
    }
    else if (jsonContent.includes('```')) {
        jsonContent = jsonContent.split('```')[1].split('```')[0].trim();
    }

    const firstBrace = jsonContent.indexOf('{');
    const lastBrace = jsonContent.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonContent = jsonContent.substring(firstBrace, lastBrace + 1);
    }

    return jsonContent;
}

export function safeParseJSON<T>(
    raw: string,
    schema: z.ZodSchema<T>,
    fallback: T
): { success: true; data: T } | { success: false; error: z.ZodError } {
    try {
        const jsonContent = extractJSON(raw);
        const result = schema.safeParse(JSON.parse(jsonContent));

        if (result.success) {
            return { success: true, data: result.data };
        } else {
            return { success: false, error: result.error };
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error };
        }
        return {
            success: false,
            error: new z.ZodError([
                {
                    code: z.ZodIssueCode.custom,
                    message: `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`,
                    path: []
                }
            ])
        };
    }
}

export function parseUserConfig(content: string): UserConfig {
    return userConfigSchema.parse(JSON.parse(content));
}

export function parseAppsConfig(content: string): AppsConfig {
    return appsConfigSchema.parse(JSON.parse(content)) as AppsConfig;
}

export function parseMacros(content: string): Record<string, Macro> {
    const parsed = JSON.parse(content);
    const macros: Record<string, Macro> = {};

    for (const [name, value] of Object.entries(parsed)) {
        macros[name] = macroSchema.parse(value);
    }

    return macros;
}

export function parseCommandHistory(content: string): HistoryEntry[] {
    const parsed = JSON.parse(content);
    return z.array(historyEntrySchema).parse(parsed);
}

````

## 📄 src/index.ts

````typescript
// This file is empty because yuangs is a CLI-first project.
// We don't expose any public library APIs to avoid breaking changes.
export { };

````

## 📄 src/types.d.ts

````typescript
declare module 'marked-terminal' {
    import { Renderer } from 'marked';
    export default class TerminalRenderer extends Renderer {
        constructor(options?: any);
    }
}

````

## 📄 src/utils/confirm.ts

````typescript
import * as readline from 'node:readline/promises';
import chalk from 'chalk';

export async function confirm(message: string): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    try {
        const answer = await rl.question(chalk.yellow(`\n⚠️  ${message} (y/N) `));
        return answer.toLowerCase() === 'y';
    } finally {
        rl.close();
    }
}


````

## 📄 src/utils/history.ts

````typescript
import fs from 'fs';
import path from 'path';
import os from 'os';
import { parseCommandHistory, type HistoryEntry } from '../core/validation';

const HISTORY_FILE = path.join(os.homedir(), '.yuangs_cmd_history.json');

export type { HistoryEntry };

export function getCommandHistory(): HistoryEntry[] {
    if (fs.existsSync(HISTORY_FILE)) {
        try {
            return parseCommandHistory(fs.readFileSync(HISTORY_FILE, 'utf8'));
        } catch (e) { }
    }
    return [];
}

export function saveHistory(entry: { question: string; command: string }) {
    let history = getCommandHistory();
    const newEntry: HistoryEntry = {
        ...entry,
        time: new Date().toLocaleString()
    };
    // Keep last 1000, unique commands
    history = [newEntry, ...history.filter(item => item.command !== entry.command)].slice(0, 1000);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

````

## 📄 test/fileReader.test.js

````javascript
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
    parseFilePathsFromLsOutput,
    readFilesContent,
    buildPromptWithFileContent
} = require('../dist/core/fileReader');

jest.mock('fs');
jest.mock('path');

describe('Module: FileReader', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        path.resolve.mockImplementation((p) => p);
        fs.existsSync.mockReturnValue(true);
        fs.statSync.mockReturnValue({ isFile: () => true });
    });

    describe('parseFilePathsFromLsOutput', () => {
        test('should parse simple ls output', () => {
            const output = 'file1.txt\nfile2.ts\nfile3.js';
            const paths = parseFilePathsFromLsOutput(output);
            expect(paths).toEqual(['file1.txt', 'file2.ts', 'file3.js']);
        });

        test('should parse ls -l output', () => {
            const output = '-rw-r--r-- 1 user group 123 Jan 1 file1.txt\n-rw-r--r-- 1 user group 456 Jan 2 file2.ts';
            const paths = parseFilePathsFromLsOutput(output);
            expect(paths).toEqual(['file1.txt', 'file2.ts']);
        });

        test('should skip . and .. directories', () => {
            const output = '.\n..\nfile.txt';
            const paths = parseFilePathsFromLsOutput(output);
            expect(paths).toEqual(['file.txt']);
        });

        test('should skip permission strings', () => {
            const output = '-rw-r--r--\nfile.txt';
            const paths = parseFilePathsFromLsOutput(output);
            expect(paths).toEqual(['file.txt']);
        });

        test('should handle empty output', () => {
            const output = '';
            const paths = parseFilePathsFromLsOutput(output);
            expect(paths).toEqual([]);
        });
    });

    describe('readFilesContent', () => {
        test('should read multiple files', () => {
            const mockContent = { 'file1.txt': 'content1', 'file2.ts': 'content2' };
            fs.readFileSync.mockImplementation((filePath) => mockContent[filePath] || '');

            const filePaths = ['file1.txt', 'file2.ts'];
            const contentMap = readFilesContent(filePaths);

            expect(contentMap.size).toBe(2);
            expect(contentMap.get('file1.txt')).toBe('content1');
            expect(contentMap.get('file2.ts')).toBe('content2');
        });

        test('should skip directories', () => {
            fs.statSync.mockReturnValue({ isFile: () => false });

            const filePaths = ['file.txt', 'directory'];
            const contentMap = readFilesContent(filePaths);

            expect(contentMap.size).toBe(0);
            expect(fs.readFileSync).not.toHaveBeenCalled();
        });

        test('should skip non-existent files', () => {
            fs.existsSync.mockImplementation((p) => p === 'exists.txt');

            const filePaths = ['exists.txt', 'notexists.txt'];
            const contentMap = readFilesContent(filePaths);

            expect(contentMap.size).toBe(1);
            expect(contentMap.has('exists.txt')).toBe(true);
            expect(contentMap.has('notexists.txt')).toBe(false);
        });

        test('should handle read errors gracefully', () => {
            fs.readFileSync.mockImplementation(() => {
                throw new Error('Read error');
            });

            const filePaths = ['error.txt'];
            const contentMap = readFilesContent(filePaths);

            expect(contentMap.size).toBe(0);
        });

        test('should return empty map for empty input', () => {
            const contentMap = readFilesContent([]);
            expect(contentMap.size).toBe(0);
        });
    });

    describe('buildPromptWithFileContent', () => {
        test('should build prompt with all content', () => {
            const originalOutput = 'file1.txt\nfile2.ts';
            const filePaths = ['file1.txt', 'file2.ts'];
            const contentMap = new Map([
                ['file1.txt', 'content1'],
                ['file2.ts', 'content2']
            ]);
            const question = 'Analyze these files';

            const prompt = buildPromptWithFileContent(originalOutput, filePaths, contentMap, question);

            expect(prompt).toContain('## 文件列表');
            expect(prompt).toContain('file1.txt\nfile2.ts');
            expect(prompt).toContain('## 文件内容');
            expect(prompt).toContain('### file1.txt');
            expect(prompt).toContain('content1');
            expect(prompt).toContain('### file2.ts');
            expect(prompt).toContain('content2');
            expect(prompt).toContain('## 我的问题');
            expect(prompt).toContain('Analyze these files');
        });

        test('should truncate content longer than 5000 chars', () => {
            const longContent = 'x'.repeat(6000);
            const contentMap = new Map([['long.txt', longContent]]);
            const prompt = buildPromptWithFileContent('long.txt', ['long.txt'], contentMap);

            expect(prompt).toContain('... (内容过长已截断)');
            expect(prompt.length).toBeLessThan(longContent.length + 1000);
        });

        test('should use default question when not provided', () => {
            const prompt = buildPromptWithFileContent('file.txt', ['file.txt'], new Map([['file.txt', 'content']]));

            expect(prompt).toContain('请分析以上文件列表和文件内容');
        });

        test('should work with empty content map', () => {
            const prompt = buildPromptWithFileContent('file.txt', ['file.txt'], new Map(), 'Analyze');

            expect(prompt).toContain('## 文件列表');
            expect(prompt).toContain('## 我的问题');
            expect(prompt).not.toContain('## 文件内容');
        });

        test('should work with empty file paths', () => {
            const prompt = buildPromptWithFileContent('', [], new Map(), 'Analyze');

            expect(prompt).toContain('## 我的问题');
            expect(prompt).not.toContain('## 文件内容');
        });
    });
});

````

## 📄 test/macros.test.js

````javascript
const fs = require('fs');
const yuangs = require('../dist/core/macros');
const path = require('path');
const os = require('os');

jest.mock('fs');

describe('Module: Macros', () => {
    const mockMacrosFile = path.join(os.homedir(), '.yuangs_macros.json');

    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default mock implementation
        fs.existsSync.mockReturnValue(false);
        fs.readFileSync.mockReturnValue('{}');
        fs.writeFileSync.mockReturnValue(undefined);
        // We need to unmock path and os if they were mocked, but we only mocked fs
    });

    test('should get empty macros when file does not exist', () => {
        fs.existsSync.mockReturnValue(false);
        const macros = yuangs.getMacros();
        expect(macros).toEqual({});
        expect(fs.existsSync).toHaveBeenCalledWith(mockMacrosFile);
    });

    test('should save a new macro', () => {
        fs.existsSync.mockReturnValue(false); // File doesn't exist yet
        
        const result = yuangs.saveMacro('test', 'echo hello', 'description');
        
        expect(result).toBe(true);
        expect(fs.writeFileSync).toHaveBeenCalled();
        
        const [filePath, content] = fs.writeFileSync.mock.calls[0];
        expect(filePath).toBe(mockMacrosFile);
        
        const data = JSON.parse(content);
        expect(data).toHaveProperty('test');
        expect(data.test.commands).toBe('echo hello');
        expect(data.test.description).toBe('description');
        expect(data.test).toHaveProperty('createdAt');
    });

    test('should retrieve existing macros', () => {
        const mockData = {
            "demo": {
                "commands": "ls -la",
                "description": "list files",
                "createdAt": "2024-01-01T00:00:00.000Z"
            }
        };
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

        const macros = yuangs.getMacros();
        expect(macros).toEqual(mockData);
    });

    test('should delete a macro', () => {
        const mockData = {
            "todelete": { "commands": "rm -rf /", "description": "dangerous", "createdAt": "2024-01-01T00:00:00.000Z" },
            "keep": { "commands": "echo safe", "description": "safe", "createdAt": "2024-01-01T00:00:00.000Z" }
        };
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

        const result = yuangs.deleteMacro('todelete');
        
        expect(result).toBe(true);
        expect(fs.writeFileSync).toHaveBeenCalled();
        
        const [filePath, content] = fs.writeFileSync.mock.calls[0];
        const savedData = JSON.parse(content);
        expect(savedData).not.toHaveProperty('todelete');
        expect(savedData).toHaveProperty('keep');
    });

    test('should return false when deleting non-existent macro', () => {
        fs.existsSync.mockReturnValue(false); // Or true with empty object
        
        const result = yuangs.deleteMacro('nonexistent');
        expect(result).toBe(false);
        // Should not write to disk if nothing changed (optional optimization, but current implementation reads first)
        // Actually current implementation:
        // const macros = getMacros();
        // if (macros[name]) { ... }
        // getMacros returns {} if file not exists. macros['nonexistent'] is undefined.
        // So it returns false and does NOT call writeFileSync.
        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
});

````

## 📄 test/quick_test.js

````javascript
const { spawn } = require('child_process');

console.log('Quick test for escape sequences after fix\n');

const child = spawn('npm', ['run', 'dev', '--', '-p'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

child.stdin.write('简短测试\n');
child.stdin.end();

let output = '';
child.stdout.on('data', (data) => {
    output += data.toString();
});

child.on('close', (code) => {
    const escapeSequenceCount = (output.match(/\x1b/g) || []).length;
    console.log('Escape sequences found:', escapeSequenceCount);

    if (escapeSequenceCount > 5) {
        console.log('❌ Still has escape sequences');
    } else if (escapeSequenceCount > 0) {
        console.log('⚠️  Few escape sequences (might be chalk colors)');
    } else {
        console.log('✓ No problematic escape sequences');
    }
});

````

## 📄 test/risk-validation.test.js

````javascript
const { assessRisk } = require('../dist/core/risk');

describe('Risk Assessment', () => {
        test('should detect rm command as high risk', () => {
            expect(assessRisk('rm -rf file.txt', 'low')).toBe('high');
            expect(assessRisk('rm file.txt', 'low')).toBe('high');
        });

        test('should detect sudo command as high risk', () => {
            expect(assessRisk('sudo apt install package', 'low')).toBe('high');
            expect(assessRisk('SUDO apt install', 'low')).toBe('high');
        });

        test('should detect mv command as high risk', () => {
            expect(assessRisk('mv file1 file2', 'low')).toBe('high');
        });

        test('should detect dd command as high risk', () => {
            expect(assessRisk('dd if=/dev/zero of=file', 'low')).toBe('high');
        });

        test('should detect chmod command as high risk', () => {
            expect(assessRisk('chmod 777 file.txt', 'low')).toBe('high');
        });

        test('should detect chown command as high risk', () => {
            expect(assessRisk('chown user:group file', 'low')).toBe('high');
        });

        test('should detect mkfs command as high risk', () => {
            expect(assessRisk('mkfs.ext4 /dev/sda1', 'low')).toBe('high');
        });

        test('should detect fork bomb pattern as high risk', () => {
            expect(assessRisk(':(){ :|:& };:', 'low')).toBe('high');
        });

        test('should detect redirecting to /dev as high risk', () => {
            expect(assessRisk('echo "data" > /dev/sda', 'low')).toBe('high');
        });

        test('should return ai risk if no high risk patterns found', () => {
            expect(assessRisk('ls -la', 'low')).toBe('low');
            expect(assessRisk('cat file.txt', 'medium')).toBe('medium');
            expect(assessRisk('grep "pattern" file', 'high')).toBe('high');
        });

        test('should override ai risk if high risk pattern detected', () => {
            expect(assessRisk('rm -rf file', 'low')).toBe('high');
            expect(assessRisk('sudo ls', 'medium')).toBe('high');
            expect(assessRisk('chmod 777 file', 'medium')).toBe('high');
        });

        test('should be case insensitive for dangerous commands', () => {
            expect(assessRisk('RM file.txt', 'low')).toBe('high');
            expect(assessRisk('SUDO cmd', 'low')).toBe('high');
            expect(assessRisk('CHMOD 777 file', 'low')).toBe('high');
        });
});
````

## 📄 test/test_agent_pipeline.js

````javascript
#!/usr/bin/env node

/**
 * Agent Pipeline 测试脚本
 * 
 * 用法：
 *   node test_agent_pipeline.js
 */

const { AgentPipeline } = require('../dist/agent');

async function testChatMode() {
    console.log('\n=== 测试 Chat 模式 ===\n');

    const agent = new AgentPipeline();

    try {
        await agent.run(
            {
                rawInput: "简单解释一下什么是冒泡排序",
                options: {
                    verbose: true
                }
            },
            'chat'
        );

        console.log('\n✅ Chat 模式测试通过\n');
    } catch (error) {
        console.error('\n❌ Chat 模式测试失败:', error.message);
    }
}

async function testCommandMode() {
    console.log('\n=== 测试 Command 模式 ===\n');

    const agent = new AgentPipeline();

    try {
        await agent.run(
            {
                rawInput: "列出当前目录的所有 TypeScript 文件",
                options: {
                    verbose: true,
                    autoYes: false  // 不自动执行，只生成命令
                }
            },
            'command'
        );

        console.log('\n✅ Command 模式测试通过\n');
    } catch (error) {
        console.error('\n❌ Command 模式测试失败:', error.message);
    }
}

async function testExecutionRecord() {
    console.log('\n=== 测试执行记录 ===\n');

    const { getRecords } = require('../dist/agent/record');

    const records = getRecords();
    console.log(`当前共有 ${records.length} 条执行记录`);

    if (records.length > 0) {
        const latest = records[records.length - 1];
        console.log('\n最新记录:');
        console.log(`  ID: ${latest.id}`);
        console.log(`  模式: ${latest.mode}`);
        console.log(`  时间: ${new Date(latest.timestamp).toLocaleString()}`);
        console.log(`  模型: ${latest.model}`);
        console.log(`  延迟: ${latest.llmResult.latencyMs}ms`);
    }

    console.log('\n✅ 执行记录测试通过\n');
}

async function main() {
    console.log('🚀 开始测试 Agent Pipeline\n');

    // 注意：这些测试需要有效的 AI API 配置
    // 如果没有配置，测试会失败

    try {
        await testChatMode();
        // await testCommandMode();  // 取消注释以测试命令模式
        await testExecutionRecord();

        console.log('\n🎉 所有测试完成！\n');
    } catch (error) {
        console.error('\n💥 测试过程中发生错误:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

````

## 📄 test/test_display_anomaly.js

````javascript
/**
 * Test for AI chat display anomalies
 * This test simulates the display clearing logic to identify potential issues
 */

function stripAnsi(str) {
    return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

function getVisualLineCount(text, screenWidth) {
    const lines = text.split('\n');
    let totalLines = 0;

    for (const line of lines) {
        const expandedLine = line.replace(/\t/g, '        ');
        const cleanLine = stripAnsi(expandedLine);

        let lineWidth = 0;
        for (const char of cleanLine) {
            const code = char.codePointAt(0) || 0;
            lineWidth += code > 255 ? 2 : 1;
        }

        if (lineWidth === 0) {
            totalLines += 1;
        } else {
            totalLines += Math.ceil(lineWidth / screenWidth);
        }
    }

    return totalLines;
}

function simulateDisplayClearing(rawText, formattedText, screenWidth = 80) {
    const BOT_PREFIX = '🤖 AI：';
    const totalContent = BOT_PREFIX + rawText;
    const lineCount = getVisualLineCount(totalContent, screenWidth);

    console.log(`\n=== Display Clearing Simulation ===`);
    console.log(`Screen width: ${screenWidth}`);
    console.log(`Raw text length: ${rawText.length}`);
    console.log(`Calculated visual lines to clear: ${lineCount}`);

    console.log(`\nRaw output would be cleared using:`);
    console.log(`  1. Clear current line (\\r\\x1b[K)`);
    console.log(`  2. Move up and clear ${lineCount - 1} more lines`);

    console.log(`\nFormatted output length: ${formattedText.length}`);

    const formattedVisualLines = getVisualLineCount(BOT_PREFIX + formattedText, screenWidth);
    console.log(`Formatted output visual lines: ${formattedVisualLines}`);

    if (lineCount !== formattedVisualLines) {
        console.log(`⚠️  WARNING: Line count mismatch!`);
        console.log(`   Raw: ${lineCount} lines, Formatted: ${formattedVisualLines} lines`);
        return { success: false, rawLines: lineCount, formattedLines: formattedVisualLines };
    }

    return { success: true, rawLines: lineCount, formattedLines: formattedVisualLines };
}

const testCases = [
    {
        name: "Simple text",
        raw: "Hello world",
        formatted: "Hello world"
    },
    {
        name: "Text exactly at screen width",
        raw: "A".repeat(70),
        formatted: "A".repeat(70)
    },
    {
        name: "Text that wraps exactly once",
        raw: "B".repeat(90),
        formatted: "B".repeat(90)
    },
    {
        name: "Multiple lines",
        raw: "Line 1\nLine 2\nLine 3",
        formatted: "Line 1\nLine 2\nLine 3"
    },
    {
        name: "Text with markdown formatting (adds characters)",
        raw: "**Bold** and *italic* text",
        formatted: "**Bold** and *italic* text"
    },
    {
        name: "Long markdown text",
        raw: "This is a long paragraph that should wrap across multiple lines when displayed in the terminal. It contains various words and phrases to test the wrapping behavior.",
        formatted: "This is a long paragraph that should wrap across multiple lines when displayed in the terminal. It contains various words and phrases to test the wrapping behavior."
    },
    {
        name: "Code block (may have different visual height)",
        raw: "Here's some code:\nconst x = 1;\nconst y = 2;",
        formatted: "Here's some code:\nconst x = 1;\nconst y = 2;"
    },
    {
        name: "CJK text (2-cell characters)",
        raw: "这是一段中文文本，测试显示效果。这段文字应该能够正确处理中文字符。",
        formatted: "这是一段中文文本，测试显示效果。这段文字应该能够正确处理中文字符。"
    }
];

console.log("\n" + "=".repeat(80));
console.log("AI Chat Display Anomaly Test");
console.log("=".repeat(80));

let failures = 0;
testCases.forEach(test => {
    const result = simulateDisplayClearing(test.raw, test.formatted);
    if (!result.success) {
        failures++;
        console.log(`\n❌ FAILED: ${test.name}`);
    } else {
        console.log(`\n✓ PASSED: ${test.name}`);
    }
});

console.log("\n" + "=".repeat(80));
console.log(`Test Summary: ${testCases.length - failures}/${testCases.length} passed`);
console.log("=".repeat(80) + "\n");

if (failures > 0) {
    console.log(`⚠️  ${failures} test(s) failed due to line count mismatch`);
    console.log(`\nPotential issues:`);
    console.log(`  1. The clearing logic might not clear enough lines`);
    console.log(`  2. The visual line count calculation might be inaccurate`);
    console.log(`  3. Formatted output might have different visual height than raw`);
    process.exit(1);
} else {
    console.log("✓ All display clearing tests passed");
    process.exit(0);
}

````

## 📄 test/test_display_logic.js

````javascript
function stripAnsi(str) {
    return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

function getVisualLineCount(text, screenWidth) {
    const lines = text.split('\n');
    let totalLines = 0;

    for (const line of lines) {
        const expandedLine = line.replace(/\t/g, '        ');
        const cleanLine = stripAnsi(expandedLine);

        let lineWidth = 0;
        for (const char of cleanLine) {
            const code = char.codePointAt(0) || 0;
            lineWidth += code > 255 ? 2 : 1;
        }

        if (lineWidth === 0) {
            totalLines += 1;
        } else {
            totalLines += Math.ceil(lineWidth / screenWidth);
        }
    }

    return totalLines;
}

const testCases = [
    { name: "Simple short text", text: "Hello world", screenWidth: 80 },
    { name: "Text that exactly fills one line", text: "A".repeat(80), screenWidth: 80 },
    { name: "Text that exceeds one line", text: "B".repeat(100), screenWidth: 80 },
    { name: "Multiple lines", text: "Line 1\nLine 2\nLine 3", screenWidth: 80 },
    { name: "Text with ANSI codes (colors)", text: "\x1b[31mRed text\x1b[0m and normal text", screenWidth: 80 },
    { name: "CJK characters (2 cells each)", text: "中文字符测试".repeat(20), screenWidth: 80 },
    { name: "Emoji characters (2 cells each)", text: "😀😁😂🤣😃".repeat(20), screenWidth: 80 },
    { name: "Mixed content", text: "Normal text with 中文 and 😀😁 emojis and \x1b[31mcolors\x1b[0m", screenWidth: 80 }
];

console.log("Testing visual line count calculation\n");
console.log("=".repeat(80));

testCases.forEach(test => {
    const lineCount = getVisualLineCount(test.text, test.screenWidth);
    const strippedLength = stripAnsi(test.text).length;

    console.log(`\nTest: ${test.name}`);
    console.log(`Screen width: ${test.screenWidth}`);
    console.log(`Text length (without ANSI): ${strippedLength}`);
    console.log(`Calculated visual lines: ${lineCount}`);
    console.log(`Preview: ${test.text.substring(0, 50)}${test.text.length > 50 ? '...' : ''}`);
});

console.log("\n" + "=".repeat(80));
console.log("\n✓ All tests completed\n");

console.log("\nSimulating cursor clearing logic:");
console.log("=".repeat(80));

const sampleText = "This is a test of the clearing logic\nWith multiple lines\nAnd some wrapping text that goes on for a while and should wrap around the screen";
const screenWidth = 80;
const lineCount = getVisualLineCount(sampleText, screenWidth);

console.log(`\nSample text:\n${sampleText}`);
console.log(`\nCalculated visual lines: ${lineCount}`);
console.log(`Cursor would move up: ${lineCount - 1} times`);

if (lineCount > 0) {
    console.log(`\n⚠️  Note: The clearing logic uses ${lineCount - 1} iterations.`);
    console.log(`   If the cursor is at the end of the last line, it needs to:`);
    console.log(`   1. Clear current line`);
    console.log(`   2. Move up and clear ${lineCount - 1} more lines`);
    console.log(`   Total: ${lineCount} lines cleared ✓`);
} else {
    console.log(`\n❌ ERROR: Line count is 0 or negative!`);
}

````

## 📄 test/test_escape_sequences.js

````javascript
const { spawn } = require('child_process');

console.log('Testing escape sequence visibility in different contexts\n');

console.log('=== Test 1: Direct TTY output (if available) ===');
if (process.stdout.isTTY) {
    console.log('stdout is a TTY');
    console.log('Writing escape sequence: \\x1b[A (cursor up)');
    process.stdout.write('\x1b[A');
    console.log('\n(You should see "Test 2" appear above this line)\n');
} else {
    console.log('stdout is NOT a TTY (pipelined output)');
    console.log('Escape sequences will be visible as text\n');
}

console.log('=== Test 2: Piped output (non-TTY) ===');
const child = spawn('npm', ['run', 'dev', '--', '-p'], {
    stdio: ['pipe', 'pipe', 'inherit']
});

child.stdin.write('测试\n');
child.stdin.end();

let output = '';
child.stdout.on('data', (data) => {
    output += data.toString();
});

child.on('close', (code) => {
    console.log('\n=== Analysis ===');
    console.log('Exit code:', code);

    const escapeSequenceCount = (output.match(/\x1b/g) || []).length;
    console.log('Escape sequences found:', escapeSequenceCount);

    if (escapeSequenceCount > 0) {
        console.log('\n❌ ISSUE DETECTED: Escape sequences are visible in output!');
        console.log('This causes display anomalies in piped/non-TTY mode.');
    } else {
        console.log('\n✓ No escape sequences found in output');
    }
});

child.on('error', (err) => {
    console.error('Error:', err);
});

````

## 📄 test/test_interactive_completion.js

````javascript
/**
 * Interactive test for tab completion
 * This test simulates how the completer would be called in real usage
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

function findCommonPrefix(strings) {
    if (strings.length === 0) return '';
    if (strings.length === 1) return strings[0];

    let common = '';
    const first = strings[0];

    for (let i = 0; i < first.length; i++) {
        const char = first[i];
        if (strings.every(s => s[i] === char)) {
            common += char;
        } else {
            break;
        }
    }

    return common;
}

function createCompleter() {
    return (line) => {
        if (!line.startsWith('@') && !line.startsWith('#')) {
            return [[], line];
        }

        const isFileMode = line.startsWith('@');
        const prefix = isFileMode ? '@ ' : '# ';
        const inputAfterPrefix = line.substring(prefix.length);

        if (!inputAfterPrefix) {
            const currentDir = process.cwd();
            const files = fs.readdirSync(currentDir);
            const completions = isFileMode
                ? files.filter(f => {
                    const fullPath = path.join(currentDir, f);
                    return fs.statSync(fullPath).isFile();
                })
                : files.filter(f => {
                    const fullPath = path.join(currentDir, f);
                    return fs.statSync(fullPath).isDirectory();
                });
            return [completions.map(c => prefix + c), prefix];
        }

        const parts = inputAfterPrefix.split(path.sep);
        const partialName = parts[parts.length - 1];
        const basePath = parts.slice(0, -1).join(path.sep);
        const searchPath = basePath ? path.resolve(basePath) : process.cwd();

        if (!fs.existsSync(searchPath) || !fs.statSync(searchPath).isDirectory()) {
            return [[], line];
        }

        const files = fs.readdirSync(searchPath);
        const completions = files
            .filter(f => {
                const fullPath = path.join(searchPath, f);
                const isDir = fs.statSync(fullPath).isDirectory();
                const matchesPrefix = f.toLowerCase().startsWith(partialName.toLowerCase());

                if (isFileMode) {
                    return matchesPrefix && !isDir;
                } else {
                    return matchesPrefix && isDir;
                }
            })
            .map(f => {
                const fullPath = path.join(searchPath, f);
                const isDir = fs.statSync(fullPath).isDirectory();
                return isDir ? f + path.sep : f;
            });

        const commonPrefix = completions.length === 1
            ? completions[0]
            : findCommonPrefix(completions);

        const newLine = basePath
            ? prefix + basePath + path.sep + commonPrefix
            : prefix + commonPrefix;

        return [completions.map(c => {
            const fullCompletion = basePath
                ? prefix + basePath + path.sep + c
                : prefix + c;
            return fullCompletion;
        }), newLine];
    };
}

const completer = createCompleter();

console.log('Tab Completion Interactive Test\n');
console.log('This simulates the completion behavior in handleAIChat.ts\n');

console.log('\nTest 1: @ (files only)');
const [completions1, hit1] = completer('@');
console.log(`  Hit: "${hit1}"`);
console.log(`  Completions: ${completions1.slice(0, 5).join(', ')}${completions1.length > 5 ? '...' : ''}\n`);

console.log('Test 2: # (directories only)');
const [completions2, hit2] = completer('#');
console.log(`  Hit: "${hit2}"`);
console.log(`  Completions: ${completions2.slice(0, 5).join(', ')}${completions2.length > 5 ? '...' : ''}\n`);

console.log('Test 3: @ src/ (files in src directory)');
const [completions3, hit3] = completer('@ src/');
console.log(`  Hit: "${hit3}"`);
console.log(`  Completions: ${completions3.slice(0, 5).join(', ')}${completions3.length > 5 ? '...' : ''}\n`);

console.log('Test 4: @ .git (no completions, .git is a directory)');
const [completions4, hit4] = completer('@ .git');
console.log(`  Hit: "${hit4}"`);
console.log(`  Completions: ${completions4.length > 0 ? completions4.slice(0, 5).join(', ') : '(none)'}\n`);

console.log('✓ All tests completed successfully!');
console.log('\nTo test in real mode:');
console.log('  1. Run: npm run dev -- ai');
console.log('  2. Type: @ and press Tab');
console.log('  3. Type: # and press Tab');
console.log('  4. Type: @ src/ and press Tab');

````

## 📄 test/test_logic.js

````javascript
const getVisualLineCount = (text, columns = 20) => {
    const lines = text.split('\n');
    let totalLines = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');
        let visualWidth = 0;
        for (let j = 0; j < cleanLine.length; j++) {
            visualWidth += cleanLine.charCodeAt(j) > 255 ? 2 : 1;
        }
        const consumed = Math.max(1, Math.ceil(visualWidth / columns));
        totalLines += consumed;
        console.log(`Line ${i}: "${line}" (width ${visualWidth}) -> consumed ${consumed}`);
    }
    return totalLines;
};

console.log('--- Test 1: "Hello" ---');
console.log('Total:', getVisualLineCount('Hello'));

console.log('--- Test 2: "Hello\\n" ---');
console.log('Total:', getVisualLineCount('Hello\n'));

console.log('--- Test 3: 25 chars in 20 width ---');
console.log('Total:', getVisualLineCount('a'.repeat(25)));

````

## 📄 test/test_no_duplicates.js

````javascript
const { spawn } = require('child_process');

console.log('Test: Check for duplicate output in pipe mode\n');

const child = spawn('npm', ['run', 'dev', '--', '-p'], {
    stdio: ['pipe', 'pipe', 'inherit']
});

child.stdin.write('简短测试\n');
child.stdin.end();

let output = '';
child.stdout.on('data', (data) => {
    output += data.toString();
});

child.on('close', (code) => {
    // Count occurrences of "AI：" prefix
    const aiPrefixMatches = output.match(/AI：/g) || [];
    const aiPrefixCount = aiPrefixMatches.length;

    console.log(`AI prefix count: ${aiPrefixCount}`);

    if (aiPrefixCount > 1) {
        console.log(`❌ FAILED: Duplicate AI prefixes found (${aiPrefixCount} times)`);
        process.exit(1);
    } else if (aiPrefixCount === 1) {
        console.log('✓ PASSED: Only one AI prefix (no duplicates)');
        process.exit(0);
    } else {
        console.log('⚠️  WARNING: No AI prefix found');
        process.exit(1);
    }
});

````

## 📄 test/test_tab_completion.js

````javascript
/**
 * Test tab completion logic
 */

const fs = require('fs');
const path = require('path');

function findCommonPrefix(strings) {
    if (strings.length === 0) return '';
    if (strings.length === 1) return strings[0];

    let common = '';
    const first = strings[0];

    for (let i = 0; i < first.length; i++) {
        const char = first[i];
        if (strings.every(s => s[i] === char)) {
            common += char;
        } else {
            break;
        }
    }

    return common;
}

function testCompleter(line) {
    if (!line.startsWith('@') && !line.startsWith('#')) {
        return [[], line];
    }

    const isFileMode = line.startsWith('@');
    const prefix = isFileMode ? '@ ' : '# ';
    const inputAfterPrefix = line.substring(prefix.length);

    if (!inputAfterPrefix) {
        const currentDir = process.cwd();
        const files = fs.readdirSync(currentDir);
        const completions = isFileMode
            ? files.filter(f => {
                const fullPath = path.join(currentDir, f);
                return fs.statSync(fullPath).isFile();
            })
            : files.filter(f => {
                const fullPath = path.join(currentDir, f);
                return fs.statSync(fullPath).isDirectory();
            });
        return [completions.map(c => prefix + c), prefix];
    }

    const parts = inputAfterPrefix.split(path.sep);
    const partialName = parts[parts.length - 1];
    const basePath = parts.slice(0, -1).join(path.sep);
    const searchPath = basePath ? path.resolve(basePath) : process.cwd();

    if (!fs.existsSync(searchPath) || !fs.statSync(searchPath).isDirectory()) {
        return [[], line];
    }

    const files = fs.readdirSync(searchPath);
    const completions = files
        .filter(f => {
            const fullPath = path.join(searchPath, f);
            const isDir = fs.statSync(fullPath).isDirectory();
            const matchesPrefix = f.toLowerCase().startsWith(partialName.toLowerCase());

            if (isFileMode) {
                return matchesPrefix && !isDir;
            } else {
                return matchesPrefix && isDir;
            }
        })
        .map(f => {
            const fullPath = path.join(searchPath, f);
            const isDir = fs.statSync(fullPath).isDirectory();
            return isDir ? f + path.sep : f;
        });

    const commonPrefix = completions.length === 1
        ? completions[0]
        : findCommonPrefix(completions);

    const newLine = basePath
        ? prefix + basePath + path.sep + commonPrefix
        : prefix + commonPrefix;

    return [completions.map(c => {
        const fullCompletion = basePath
            ? prefix + basePath + path.sep + c
            : prefix + c;
        return fullCompletion;
    }), newLine];
}

console.log('Testing tab completion logic\n');

const testCases = [
    '@',
    '#',
    '@ src',
    '# s',
    '@ README',
];

testCases.forEach(testLine => {
    console.log(`\nInput: "${testLine}"`);
    const [completions, hit] = testCompleter(testLine);
    console.log(`Hit: "${hit}"`);
    console.log(`Completions (${completions.length}):`);
    completions.slice(0, 10).forEach(c => {
        console.log(`  - ${c}`);
    });
    if (completions.length > 10) {
        console.log(`  ... and ${completions.length - 10} more`);
    }
});

console.log('\n✓ Tab completion logic tests completed');

````

## 📄 test/test_tab_completion_debug.js

````javascript
/**
 * Test tab completion logic with more cases
 */

const fs = require('fs');
const path = require('path');

function findCommonPrefix(strings) {
    if (strings.length === 0) return '';
    if (strings.length === 1) return strings[0];

    let common = '';
    const first = strings[0];

    for (let i = 0; i < first.length; i++) {
        const char = first[i];
        if (strings.every(s => s[i] === char)) {
            common += char;
        } else {
            break;
        }
    }

    return common;
}

function testCompleter(line) {
    if (!line.startsWith('@') && !line.startsWith('#')) {
        return [[], line];
    }

    const isFileMode = line.startsWith('@');
    const prefix = isFileMode ? '@ ' : '# ';
    const inputAfterPrefix = line.substring(prefix.length);

    if (!inputAfterPrefix) {
        const currentDir = process.cwd();
        const files = fs.readdirSync(currentDir);
        const completions = isFileMode
            ? files.filter(f => {
                const fullPath = path.join(currentDir, f);
                return fs.statSync(fullPath).isFile();
            })
            : files.filter(f => {
                const fullPath = path.join(currentDir, f);
                return fs.statSync(fullPath).isDirectory();
            });
        return [completions.map(c => prefix + c), prefix];
    }

    const parts = inputAfterPrefix.split(path.sep);
    const partialName = parts[parts.length - 1];
    const basePath = parts.slice(0, -1).join(path.sep);
    const searchPath = basePath ? path.resolve(basePath) : process.cwd();

    console.log(`  DEBUG: parts=${JSON.stringify(parts)}, partialName="${partialName}", basePath="${basePath}", searchPath="${searchPath}"`);

    if (!fs.existsSync(searchPath) || !fs.statSync(searchPath).isDirectory()) {
        console.log(`  DEBUG: searchPath does not exist or is not a directory`);
        return [[], line];
    }

    const files = fs.readdirSync(searchPath);
    const completions = files
        .filter(f => {
            const fullPath = path.join(searchPath, f);
            const isDir = fs.statSync(fullPath).isDirectory();
            const matchesPrefix = f.toLowerCase().startsWith(partialName.toLowerCase());

            if (isFileMode) {
                return matchesPrefix && !isDir;
            } else {
                return matchesPrefix && isDir;
            }
        })
        .map(f => {
            const fullPath = path.join(searchPath, f);
            const isDir = fs.statSync(fullPath).isDirectory();
            return isDir ? f + path.sep : f;
        });

    const commonPrefix = completions.length === 1
        ? completions[0]
        : findCommonPrefix(completions);

    const newLine = basePath
        ? prefix + basePath + path.sep + commonPrefix
        : prefix + commonPrefix;

    return [completions.map(c => {
        const fullCompletion = basePath
            ? prefix + basePath + path.sep + c
            : prefix + c;
        return fullCompletion;
    }), newLine];
}

console.log('Testing tab completion logic with debug\n');

const testCases = [
    '@',
    '#',
    '@ src/',
    '# src/',
    '@ dist/cli.js',
    '@ .g',
];

testCases.forEach(testLine => {
    console.log(`\nInput: "${testLine}"`);
    const [completions, hit] = testCompleter(testLine);
    console.log(`Hit: "${hit}"`);
    console.log(`Completions (${completions.length}):`);
    completions.slice(0, 5).forEach(c => {
        console.log(`  - ${c}`);
    });
    if (completions.length > 5) {
        console.log(`  ... and ${completions.length - 5} more`);
    }
});

console.log('\n✓ Tab completion logic tests completed');

````

## 📄 tsconfig.json

````json
{
    "compilerOptions": {
        "target": "ES2022",
        "module": "CommonJS",
        "moduleResolution": "node",
        "rootDir": "src",
        "outDir": "dist",
        "declaration": true,
        "sourceMap": true,
        "strict": true,
        "esModuleInterop": true,
        "forceConsistentCasingInFileNames": true,
        "skipLibCheck": true,
        "resolveJsonModule": true
    },
    "include": [
        "src"
    ],
    "exclude": [
        "node_modules",
        "**/*.test.ts"
    ]
}
````

## 📄 verify.sh

````bash
#!/bin/bash

# ==========================================
# yuangs CLI - 自动化构建与发布验证脚本
# ==========================================

# 设置遇到错误立即停止
set -e

# 定义颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[Step] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[Warn] $1${NC}"
}

error() {
    echo -e "${RED}[Error] $1${NC}"
    exit 1
}

# 1. 环境清理
log "1. 清理旧构建产物..."
rm -rf dist/
rm -f *.tgz
# 确保根目录没有残留的 index.js (之前的历史遗留问题)
if [ -f "index.js" ]; then
    warn "发现根目录存在 index.js，正在删除以确保环境纯净..."
    rm index.js
fi

# 2. Node.js 版本检查
log "2. 检查 Node.js 版本..."
NODE_MAJOR=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_MAJOR" -lt 18 ]; then
    error "Node.js 版本太低 (当前: $(node -v))，必须 >= 18"
fi

# 3. 安装依赖
log "3. 检查依赖..."
npm install

# 4. TypeScript 构建
log "4. 执行构建 (npm run build)..."
npm run build

# 验证构建产物是否存在
if [ ! -f "dist/cli.js" ]; then
    error "构建失败：dist/cli.js 未生成"
fi

# 5. 单元测试
log "5. 运行单元测试 (npm test)..."
# 注意：你的测试依赖于 dist/ 目录，所以必须在 build 之后运行
npm test

# 6. NPM 打包模拟
log "6. 模拟 NPM 打包 (npm pack)..."
npm pack

# 获取生成的 tgz 文件名
PACKAGE_FILE=$(ls yuangs-*.tgz | head -n 1)

if [ -z "$PACKAGE_FILE" ]; then
    error "打包失败：未找到 .tgz 文件"
fi

echo -e "📦 生成包文件: ${YELLOW}$PACKAGE_FILE${NC}"

# 7. 包内容验证 (防止源码泄漏)
log "7. 验证包内容结构..."
# 检查是否包含 dist 目录
if ! tar -tf "$PACKAGE_FILE" | grep -q "dist/cli.js"; then
    error "包结构错误：缺少 dist/cli.js"
fi

# 检查是否包含 src 目录 (不应该包含)
if tar -tf "$PACKAGE_FILE" | grep -q "^package/src/"; then
    error "包结构错误：包含了 src/ 源码目录 (请检查 package.json 的 files 字段)"
else
    echo "✅ 源码未泄漏 (src/ 目录未包含)"
fi

# 8. 执行冒烟测试 (运行构建后的 CLI)...
log "8. 执行冒烟测试 (运行构建后的 CLI)..."

# 测试 help 命令
echo "Testing: yuangs --help"
node dist/cli.js --help > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Help 命令正常"
else
    error "Help 命令执行失败"
fi

# 测试 version 命令
echo "Testing: yuangs --version"
VERSION_OUTPUT=$(node dist/cli.js --version)
echo "✅ 版本号显示: $VERSION_OUTPUT"

# 9. 完成
log "9. 完成验证"
echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}🎉 验证通过！项目状态健康，随时可以发布。${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
````

## 📄 yuangs.config.example.json

````json
{
  "shici": "https://wealth.want.biz/shici/index.html",
  "dict": "https://wealth.want.biz/pages/dict.html",
  "pong": "https://wealth.want.biz/pages/pong.html",
  "github": "https://github.com",
  "calendar": "https://calendar.google.com",
  "mail": "https://mail.google.com",
  "aiProxyUrl": "https://aiproxy.want.biz/v1/chat/completions",
  "defaultModel": "Assistant",
  "accountType": "free"
}
````

## 📄 yuangs.config.example.yaml

````yaml
# Example configuration file for yuangs CLI
# Add your custom applications here

shici: "https://wealth.want.biz/shici/index.html"
dict: "https://wealth.want.biz/pages/dict.html"
pong: "https://wealth.want.biz/pages/pong.html"
github: "https://github.com"
calendar: "https://calendar.google.com"
mail: "https://mail.google.com"

# AI Configuration
aiProxyUrl: "https://aiproxy.want.biz/v1/chat/completions"
defaultModel: "Assistant"
accountType: "free"

# You can also use the apps property if you prefer to group them
# apps:
#   shici: "https://wealth.want.biz/shici/index.html"
#   dict: "https://wealth.want.biz/pages/dict.html"
#   pong: "https://wealth.want.biz/pages/pong.html"
#   github: "https://github.com"
#   calendar: "https://calendar.google.com"
#   mail: "https://mail.google.com"

````

## 📄 yuangs.config.json

````json
{
  "aiProxyUrl": "https://aiproxy.want.biz/v1/chat/completions",
  "defaultModel": "gemini-2.5-flash",
  "accountType": "paid",
  "models": [
    {
      "name": "gemini-2.5-flash",
      "provider": "gemini",
      "atomicCapabilities": [
        "text_generation",
        "code_generation",
        "reasoning",
        "long_context",
        "streaming"
      ],
      "contextWindow": 1000000,
      "costProfile": "low"
    },
    {
      "name": "gemini-2.5-flash-lite",
      "provider": "gemini",
      "atomicCapabilities": [
        "text_generation",
        "code_generation",
        "reasoning",
        "long_context",
        "streaming"
      ],
      "contextWindow": 1000000,
      "costProfile": "low"
    },
    {
      "name": "Assistant",
      "provider": "poe",
      "atomicCapabilities": [
        "text_generation",
        "code_generation",
        "reasoning"
      ],
      "contextWindow": 128000,
      "costProfile": "low"
    },
    {
      "name": "GPT-4o-mini",
      "provider": "poe",
      "atomicCapabilities": [
        "text_generation",
        "code_generation",
        "reasoning",
        "streaming"
      ],
      "contextWindow": 128000,
      "costProfile": "low"
    },
    {
      "name": "POE-DeepSeek-V3.2",
      "provider": "poe",
      "atomicCapabilities": [
        "text_generation",
        "code_generation",
        "reasoning"
      ],
      "contextWindow": 32768,
      "costProfile": "medium"
    },
    {
      "name": "POE-Gemini-3-Flash",
      "provider": "poe",
      "atomicCapabilities": [
        "text_generation",
        "code_generation",
        "reasoning",
        "long_context",
        "streaming"
      ],
      "contextWindow": 2000000,
      "costProfile": "low"
    },
    {
      "name": "POE-Gemini-3-Pro",
      "provider": "poe",
      "atomicCapabilities": [
        "text_generation",
        "code_generation",
        "reasoning",
        "long_context",
        "streaming"
      ],
      "contextWindow": 2000000,
      "costProfile": "high"
    },
    {
      "name": "GLM-4-Flash",
      "provider": "zhipu",
      "atomicCapabilities": [
        "text_generation",
        "code_generation",
        "reasoning"
      ],
      "contextWindow": 128000,
      "costProfile": "low"
    }
  ]
}

````

---
### 📊 最终统计汇总
- **文件总数:** 71
- **代码总行数:** 10750
- **物理总大小:** 353.68 KB
