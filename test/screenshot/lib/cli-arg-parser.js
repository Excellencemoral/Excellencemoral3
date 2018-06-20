/*
 * Copyright 2018 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const GitRepo = require('./git-repo');
const argparse = require('argparse');
const fs = require('mz/fs');
const path = require('path');

const HTTP_URL_REGEX = new RegExp('^https?://');

class CliArgParser {
  constructor() {
    /**
     * @type {!GitRepo}
     * @private
     */
    this.gitRepo_ = new GitRepo();

    /**
     * @type {!ArgumentParser}
     * @private
     */
    this.rootParser_ = new argparse.ArgumentParser({
      // argparse throws an error if `process.argv[1]` is undefined, which happens when you run `node --interactive`.
      prog: process.argv[1] || 'node',
    });

    /**
     * @type {!ActionSubparsers}
     * @private
     */
    this.commandParsers_ = this.rootParser_.addSubparsers({
      title: 'Commands',
    });

    this.initRootArgs_();
    this.initApproveCommand_();
    this.initBuildCommand_();
    this.initCleanCommand_();
    this.initDemoCommand_();
    this.initServeCommand_();
    this.initTestCommand_();

    this.args_ = this.rootParser_.parseArgs();
  }

  /**
   * @param {!ArgumentParser|!ActionContainer} parser
   * @param {!CliOptionConfig} config
   * @private
   */
  addArg_(parser, config) {
    parser.addArgument(config.optionNames, {
      help: config.description.trim(),
      dest: config.optionNames[config.optionNames.length - 1],
      type: config.type === 'integer' ? 'int' : undefined,
      action: config.type === 'array' ? 'append' : (config.type === 'boolean' ? 'storeTrue' : 'store'),
      required: config.isRequired || false,
      defaultValue: config.defaultValue,
      metavar: config.valuePlaceholder || config.defaultValue,
    });
  }

  addGcsBucketArg_(parser) {
    this.addArg_(parser, {
      optionNames: ['--mdc-gcs-bucket'],
      defaultValue: 'mdc-web-screenshot-tests',
      description: `
Name of the Google Cloud Storage bucket to use for public file uploads.
`,
    });
  }

  addGoldenPathArg_(parser) {
    this.addArg_(parser, {
      optionNames: ['--mdc-golden-path'],
      defaultValue: 'test/screenshot/golden.json',
      description: `
Relative path to a local 'golden.json' file that will be written to when the golden screenshots are updated.
Relative to $PWD.
`,
    });
  }

  addSkipBuildArg_(parser) {
    this.addArg_(parser, {
      optionNames: ['--mdc-skip-build'],
      type: 'boolean',
      description: `
If this flag is present, JS and CSS files will not be compiled prior to running screenshot tests.
The default behavior is to always build assets before running the tests.
`,
    });
  }

  initRootArgs_() {
    this.addArg_(this.rootParser_, {
      optionNames: ['--mdc-test-dir'],
      defaultValue: 'test/screenshot/',
      description: `
Relative path to a local directory containing static test assets (HTML/CSS/JS files) to be captured and diffed.
Relative to $PWD.
`,
    });
  }

  initApproveCommand_() {
    const subparser = this.commandParsers_.addParser('approve', {
      description: 'Approves screenshots from a previous `npm run screenshot:test` report. ' +
        'Updates your local `golden.json` file with the new screenshots.',
    });

    this.addGoldenPathArg_(subparser);

    this.addArg_(subparser, {
      optionNames: ['--report'],
      valuePlaceholder: 'URL',
      isRequired: true,
      description: 'Public URL of a `report.json` file generated by a previous `npm run screenshot:test` run.',
    });

    this.addArg_(subparser, {
      optionNames: ['--diffs'],
      valuePlaceholder: 'mdc-foo/baseline.html:desktop_windows_chrome@latest,...',
      type: 'array',
      description: 'Comma-separated list of screenshot diffs to approve.',
    });

    this.addArg_(subparser, {
      optionNames: ['--added'],
      valuePlaceholder: 'mdc-foo/baseline.html:desktop_windows_chrome@latest,...',
      type: 'array',
      description: 'Comma-separated list of added screenshots to approve.',
    });

    this.addArg_(subparser, {
      optionNames: ['--removed'],
      valuePlaceholder: 'mdc-foo/baseline.html:desktop_windows_chrome@latest,...',
      type: 'array',
      description: 'Comma-separated list of removed screenshots to approve.',
    });

    this.addArg_(subparser, {
      optionNames: ['--all-diffs'],
      type: 'boolean',
      description: 'Approve all screenshot diffs.',
    });

    this.addArg_(subparser, {
      optionNames: ['--all-added'],
      type: 'boolean',
      description: 'Approve all added screenshots.',
    });

    this.addArg_(subparser, {
      optionNames: ['--all-removed'],
      type: 'boolean',
      description: 'Approve all removed screenshots.',
    });

    this.addArg_(subparser, {
      optionNames: ['--all'],
      type: 'boolean',
      description: 'Approve all diffs, additions, and removals.',
    });
  }

  initBuildCommand_() {
    const subparser = this.commandParsers_.addParser('build', {
      description: 'Compiles source files and writes output files to disk.',
    });

    this.addArg_(subparser, {
      optionNames: ['--watch'],
      type: 'boolean',
      description: 'Recompile source files whenever they change.',
    });
  }

  initCleanCommand_() {
    this.commandParsers_.addParser('clean', {
      description: 'Deletes all output files generated by the build.',
    });
  }

  initDemoCommand_() {
    const subparser = this.commandParsers_.addParser('demo', {
      description: 'Uploads compiled screenshot test assets to a unique public URL.',
    });

    this.addSkipBuildArg_(subparser);
    this.addGcsBucketArg_(subparser);
  }

  initServeCommand_() {
    const subparser = this.commandParsers_.addParser('serve', {
      description: 'Starts an HTTP server for local development.',
    });

    this.addArg_(subparser, {
      optionNames: ['--port'],
      type: 'integer',
      defaultValue: '8080',
      description: 'TCP port number for the HTTP server.',
    });
  }

  initTestCommand_() {
    const subparser = this.commandParsers_.addParser('test', {
      description: 'Captures screenshots of test pages and compares them to a set of "golden" images.',
    });

    this.addSkipBuildArg_(subparser);
    this.addGcsBucketArg_(subparser);
    this.addGoldenPathArg_(subparser);

    this.addArg_(subparser, {
      optionNames: ['--mdc-diff-base'],
      defaultValue: 'origin/master',
      description: `
File path, URL, or Git ref of a 'golden.json' file to diff against.
Typically a branch name or commit hash, but may also be a local file path or public URL.
Git refs may optionally be suffixed with ':path/to/golden.json' (the default is to use '--mdc-golden-path').
E.g., 'origin/master' (default), 'HEAD', 'feat/foo/bar', 'fad7ed3:path/to/golden.json',
'/tmp/golden.json', 'https://storage.googleapis.com/.../test/screenshot/golden.json'.
`,
    });

    this.addArg_(subparser, {
      optionNames: ['--mdc-include-url'],
      valuePlaceholder: 'URL_REGEX',
      type: 'array',
      description: `
Regular expression pattern. Only HTML files that match the pattern will be tested.
Multiple patterns can be 'OR'-ed together by passing more than one '--mdc-include-url'.
Can be overridden by '--mdc-exclude-url'.
`,
    });

    this.addArg_(subparser, {
      optionNames: ['--mdc-exclude-url'],
      valuePlaceholder: 'URL_REGEX',
      type: 'array',
      description: `
Regular expression pattern. HTML files that match the pattern will be excluded from testing.
Multiple patterns can be 'OR'-ed together by passing more than one '--mdc-exclude-url'.
Takes precedence over '--mdc-include-url'.
`,
    });

    this.addArg_(subparser, {
      optionNames: ['--mdc-include-browser'],
      valuePlaceholder: 'BROWSER_ALIAS_REGEX',
      type: 'array',
      description: `
Regular expression pattern. Only browser aliases that match the pattern will be tested.
See 'test/screenshot/browser.json' for examples.
Multiple patterns can be 'OR'-ed together by passing more than one '--mdc-include-browser'.
Can be overridden by '--mdc-exclude-browser'.
`,
    });

    this.addArg_(subparser, {
      optionNames: ['--mdc-exclude-browser'],
      valuePlaceholder: 'BROWSER_ALIAS_REGEX',
      type: 'array',
      description: `
Regular expression pattern. Browser aliases that match the pattern will be excluded from testing.
See 'test/screenshot/browser.json' for examples.
Multiple patterns can be 'OR'-ed together by passing more than one '--mdc-exclude-browser'.
Takes precedence over '--mdc-include-browser'.
`,
    });
  }

  /** @return {string} */
  get command() {
    return process.argv[2];
  }

  /** @return {!Array<!RegExp>} */
  get includeUrlPatterns() {
    return (this.args_['--mdc-include-url'] || []).map((pattern) => new RegExp(pattern));
  }

  /** @return {!Array<!RegExp>} */
  get excludeUrlPatterns() {
    return (this.args_['--mdc-exclude-url'] || []).map((pattern) => new RegExp(pattern));
  }

  /** @return {!Array<!RegExp>} */
  get includeBrowserPatterns() {
    return (this.args_['--mdc-include-browser'] || []).map((pattern) => new RegExp(pattern));
  }

  /** @return {!Array<!RegExp>} */
  get excludeBrowserPatterns() {
    return (this.args_['--mdc-exclude-browser'] || []).map((pattern) => new RegExp(pattern));
  }

  /** @return {string} */
  get testDir() {
    // Ensure that the path has a trailing slash
    return path.format(path.parse(this.args_['--mdc-test-dir'])) + path.sep;
  }

  /** @return {string} */
  get goldenPath() {
    return this.args_['--mdc-golden-path'];
  }

  /** @return {string} */
  get diffBase() {
    return this.args_['--mdc-diff-base'];
  }

  /** @return {boolean} */
  get skipBuild() {
    return this.args_['--mdc-skip-build'];
  }

  /** @return {string} */
  get gcsBucket() {
    return this.args_['--mdc-gcs-bucket'];
  }

  /** @return {string} */
  get gcsBaseUrl() {
    return `https://storage.googleapis.com/${this.gcsBucket}/`;
  }

  /** @return {string} */
  get runReportJsonUrl() {
    return this.args_['--report'];
  }

  /** @return {!Set<string>} */
  get diffs() {
    return this.parseApprovedChangeTargets_(this.args_['--diffs']);
  }

  /** @return {!Set<string>} */
  get added() {
    return this.parseApprovedChangeTargets_(this.args_['--added']);
  }

  /** @return {!Set<string>} */
  get removed() {
    return this.parseApprovedChangeTargets_(this.args_['--removed']);
  }

  /** @return {boolean} */
  get allDiffs() {
    return this.args_['--all-diffs'];
  }

  /** @return {boolean} */
  get allAdded() {
    return this.args_['--all-added'];
  }

  /** @return {boolean} */
  get allRemoved() {
    return this.args_['--all-removed'];
  }

  /** @return {boolean} */
  get all() {
    return this.args_['--all'];
  }

  /** @return {boolean} */
  get watch() {
    return this.args_['--watch'];
  }

  /** @return {number} */
  get port() {
    return this.args_['--port'];
  }

  /**
   * @param {!Array<string>} list
   * @return {!Set<string>}
   * @private
   */
  parseApprovedChangeTargets_(list) {
    list = list || [];
    return new Set([].concat(...list.map((value) => value.split(','))));
  }

  /**
   * @param {string} rawDiffBase
   * @param {string} defaultGoldenPath
   * @return {!Promise<!DiffSource>}
   */
  async parseDiffBase({
    rawDiffBase = this.diffBase,
    defaultGoldenPath = this.goldenPath,
  } = {}) {
    // Diff against a public `golden.json` URL.
    // E.g.: `--mdc-diff-base=https://storage.googleapis.com/.../golden.json`
    const isUrl = HTTP_URL_REGEX.test(rawDiffBase);
    if (isUrl) {
      return this.createPublicUrlDiffSource_(rawDiffBase);
    }

    // Diff against a local `golden.json` file.
    // E.g.: `--mdc-diff-base=/tmp/golden.json`
    const isLocalFile = await fs.exists(rawDiffBase);
    if (isLocalFile) {
      return this.createLocalFileDiffSource_(rawDiffBase);
    }

    const [inputGoldenRef, inputGoldenPath] = rawDiffBase.split(':');
    const goldenFilePath = inputGoldenPath || defaultGoldenPath;
    const fullGoldenRef = await this.gitRepo_.getFullSymbolicName(inputGoldenRef);

    // Diff against a specific git commit.
    // E.g.: `--mdc-diff-base=abcd1234`
    if (!fullGoldenRef) {
      return this.createCommitDiffSource_(inputGoldenRef, goldenFilePath);
    }

    const {remoteRef, localRef, tagRef} = this.getRefType_(fullGoldenRef);

    // Diff against a remote git branch.
    // E.g.: `--mdc-diff-base=origin/master` or `--mdc-diff-base=origin/feat/button/my-fancy-feature`
    if (remoteRef) {
      return this.createRemoteBranchDiffSource_(remoteRef, goldenFilePath);
    }

    // Diff against a remote git tag.
    // E.g.: `--mdc-diff-base=v0.34.1`
    if (tagRef) {
      return this.createRemoteTagDiffSource_(tagRef, goldenFilePath);
    }

    // Diff against a local git branch.
    // E.g.: `--mdc-diff-base=master` or `--mdc-diff-base=HEAD`
    return this.createLocalBranchDiffSource_(localRef, goldenFilePath);
  }

  /**
   * @param {string} publicUrl
   * @return {!DiffSource}
   * @private
   */
  createPublicUrlDiffSource_(publicUrl) {
    return {
      publicUrl,
      localFilePath: null,
      gitRevision: null,
    };
  }

  /**
   * @param {string} localFilePath
   * @return {!DiffSource}
   * @private
   */
  createLocalFileDiffSource_(localFilePath) {
    return {
      publicUrl: null,
      localFilePath,
      gitRevision: null,
    };
  }

  /**
   * @param {string} commit
   * @param {string} snapshotFilePath
   * @return {!DiffSource}
   * @private
   */
  createCommitDiffSource_(commit, snapshotFilePath) {
    return {
      publicUrl: null,
      localFilePath: null,
      gitRevision: {
        commit,
        snapshotFilePath,
        remote: null,
        branch: null,
        tag: null,
      },
    };
  }

  /**
   * @param {string} remoteRef
   * @param {string} snapshotFilePath
   * @return {!DiffSource}
   * @private
   */
  async createRemoteBranchDiffSource_(remoteRef, snapshotFilePath) {
    const allRemoteNames = await this.gitRepo_.getRemoteNames();
    const remote = allRemoteNames.find((curRemoteName) => remoteRef.startsWith(curRemoteName + '/'));
    const branch = remoteRef.substr(remote.length + 1); // add 1 for forward-slash separator
    const commit = await this.gitRepo_.getShortCommitHash(remoteRef);

    return {
      publicUrl: null,
      localFilePath: null,
      gitRevision: {
        snapshotFilePath,
        commit,
        remote,
        branch,
        tag: null,
      },
    };
  }

  /**
   * @param {string} tagRef
   * @param {string} snapshotFilePath
   * @return {!DiffSource}
   * @private
   */
  async createRemoteTagDiffSource_(tagRef, snapshotFilePath) {
    const commit = await this.gitRepo_.getShortCommitHash(tagRef);
    return {
      publicUrl: null,
      localFilePath: null,
      gitRevision: {
        snapshotFilePath,
        commit,
        remote: 'origin',
        branch: null,
        tag: tagRef,
      },
    };
  }

  /**
   * @param {string} branch
   * @param {string} snapshotFilePath
   * @return {!DiffSource}
   * @private
   */
  async createLocalBranchDiffSource_(branch, snapshotFilePath) {
    const commit = await this.gitRepo_.getShortCommitHash(branch);
    return {
      publicUrl: null,
      localFilePath: null,
      gitRevision: {
        snapshotFilePath,
        commit,
        remote: null,
        branch,
        tag: null,
      },
    };
  }

  /**
   * @param {string} fullRef
   * @return {{remoteRef: string, localRef: string, tagRef: string}}
   * @private
   */
  getRefType_(fullRef) {
    const getShortGoldenRef = (type) => {
      const regex = new RegExp(`^refs/${type}s/(.+)$`);
      const match = regex.exec(fullRef) || [];
      return match[1];
    };

    const remoteRef = getShortGoldenRef('remote');
    const localRef = getShortGoldenRef('head');
    const tagRef = getShortGoldenRef('tag');

    return {remoteRef, localRef, tagRef};
  }
}

module.exports = CliArgParser;
