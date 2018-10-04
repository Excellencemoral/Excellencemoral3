/**
 * @license
 * Copyright 2018 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

const mdcProto = require('../proto/mdc.pb').mdc.proto;
const CaptureState = mdcProto.Screenshot.CaptureState;
const {ThrottleType, ShieldState} = require('../types/status-types');

const CloudDatastore = require('./cloud-datastore');
const GitHubApi = require('./github-api');

class StatusNotifier {
  constructor() {
    /**
     * @type {!CloudDatastore}
     * @private
     */
    this.cloudDatastore_ = new CloudDatastore();

    /**
     * @type {!GitHubApi}
     * @private
     */
    this.gitHubApi_ = new GitHubApi();

    /**
     * @type {?mdc.proto.ReportData}
     * @private
     */
    this.reportData_ = null;

    this.initThrottle_();
  }

  /** @private */
  initThrottle_() {
    const INTERVAL_MS = 2500;

    /** @type {!Array<!StatusInfo>} */
    const statusInfos = [];

    /** @type {?StatusInfo} */
    let prevStatusInfo = null;

    let isTimerActive = false;

    /**
     * @param {!StatusInfo} statusInfo
     * @return {boolean}
     */
    const isError = (statusInfo) => {
      return (
        statusInfo.shieldState === ShieldState.ERROR
      );
    };

    /**
     * @param {!StatusInfo} statusInfo
     * @return {boolean}
     */
    const isTerminal = (statusInfo) => {
      return (
        statusInfo.shieldState === ShieldState.ERROR ||
        statusInfo.shieldState === ShieldState.PASSED ||
        statusInfo.shieldState === ShieldState.FAILED
      );
    };

    const maybeNotify = () => {
      const newestStatusInfo = statusInfos[statusInfos.length - 1];
      if (isTimerActive || !newestStatusInfo || newestStatusInfo === prevStatusInfo) {
        return;
      }

      prevStatusInfo = newestStatusInfo;
      isTimerActive = true;

      this.notifyUnthrottled_(newestStatusInfo);

      setTimeout(() => {
        isTimerActive = false;
        maybeNotify();
      }, INTERVAL_MS);
    };

    /**
     * @param {!StatusInfo} newStatusInfo
     * @private
     */
    this.notifyThrottled_ = (newStatusInfo) => {
      if (prevStatusInfo) {
        // Prevent out-of-order status updates, which can happen due to async execution.
        if (isError(prevStatusInfo)) {
          return;
        }
        if (isTerminal(prevStatusInfo) && !isTerminal(newStatusInfo)) {
          return;
        }
      }

      statusInfos.push(newStatusInfo);
      maybeNotify();
    };
  }

  /**
   * @param {!mdc.proto.ReportData} reportData
   */
  initialize(reportData) {
    this.reportData_ = reportData;
  }

  starting() {
    this.notify_(ShieldState.STARTING, ThrottleType.UNTHROTTLED);
  }

  error() {
    this.notify_(ShieldState.ERROR, ThrottleType.UNTHROTTLED);
  }

  running() {
    this.notify_(ShieldState.RUNNING, ThrottleType.THROTTLED);
  }

  finished() {
    this.notify_(ShieldState.RUNNING, ThrottleType.UNTHROTTLED);
  }

  /**
   * @param {!mdc.proto.ShieldState} shieldState
   * @param {!ThrottleType} throttleType
   */
  notify_(shieldState, throttleType) {
    const runnableScreenshots = this.reportData_.screenshots.runnable_screenshot_list;
    const targetUrl = this.reportData_.meta.report_html_file ? this.reportData_.meta.report_html_file.public_url : null;

    /**
     * @param {!mdc.proto.Screenshot} screenshot
     * @return {boolean}
     */
    const hasDiffs = (screenshot) => Boolean(screenshot.diff_image_result && screenshot.diff_image_result.has_changed);

    /**
     * @param {!mdc.proto.Screenshot} screenshot
     * @return {boolean}
     */
    const isFinished = (screenshot) => screenshot.capture_state === CaptureState.DIFFED;

    const numScreenshotsTotal = runnableScreenshots.length;
    const numScreenshotsFinished = runnableScreenshots.filter(isFinished).length;
    const numChanged = runnableScreenshots.filter(hasDiffs).length;
    const isTerminal = numScreenshotsFinished === numScreenshotsTotal;
    const isPassed = isTerminal && numChanged === 0;
    const isFailed = isTerminal && numChanged > 0;

    if (isPassed) {
      shieldState = ShieldState.PASSED;
    } else if (isFailed) {
      shieldState = ShieldState.FAILED;
    }

    /** @type {!StatusInfo} */
    const statusInfo = {
      shieldState,
      numScreenshotsTotal,
      numScreenshotsFinished,
      numChanged,
      targetUrl,
    };

    if (throttleType === ThrottleType.UNTHROTTLED) {
      this.notifyUnthrottled_(statusInfo);
    } else {
      this.notifyThrottled_(statusInfo);
    }
  }

  /**
   * @param {!StatusInfo} statusInfo
   * @private
   */
  notifyUnthrottled_(statusInfo) {
    const travisJobId = process.env.TRAVIS_JOB_ID;
    const travisJobUrl =
      travisJobId ? `https://travis-ci.com/material-components/material-components-web/jobs/${travisJobId}` : null;
    const githubRepoUrl = 'https://github.com/material-components/material-components-web';

    const shieldState = statusInfo.shieldState;
    const numTotal = statusInfo.numScreenshotsTotal;
    const numDone = statusInfo.numScreenshotsFinished;
    const numChanged = statusInfo.numChanged;
    const numPercent = numTotal > 0 ? (100 * numDone / numTotal) : 0;
    const targetUrl = statusInfo.targetUrl || travisJobUrl || githubRepoUrl;

    const strDone = numDone.toLocaleString();
    const strTotal = numTotal.toLocaleString();
    const strPercent = `${numPercent.toFixed(1)}%`;
    const strChanged = numChanged.toLocaleString();
    const changedPlural = numChanged === 1 ? '' : 's';

    this.postToDatastore_({shieldState, numTotal, numDone, numChanged, targetUrl});
    this.postToGitHub_({shieldState, strTotal, strDone, strChanged, changedPlural, strPercent, targetUrl});
  }

  /**
   * @param {!mdc.proto.ShieldState} shieldState
   * @param {number} numTotal
   * @param {number} numDone
   * @param {number} numChanged
   * @param {string} targetUrl
   * @private
   */
  postToDatastore_({shieldState, numTotal, numDone, numChanged, targetUrl}) {
    this.cloudDatastore_.createScreenshotStatus({
      state: shieldState,
      numScreenshotsTotal: numTotal,
      numScreenshotsFinished: numDone,
      numDiffs: numChanged,
      numChanged,
      targetUrl,
      snapshotGitRev: this.reportData_.meta.snapshot_diff_base.git_revision,
    });
  }

  /**
   * @param {!mdc.proto.ShieldState} shieldState
   * @param {string} strTotal
   * @param {string} strDone
   * @param {string} strChanged
   * @param {string} changedPlural
   * @param {string} strPercent
   * @param {string} targetUrl
   * @private
   */
  postToGitHub_({shieldState, strTotal, strDone, strChanged, changedPlural, strPercent, targetUrl}) {
    if (shieldState === ShieldState.ERROR) {
      this.gitHubApi_.setPullRequestError();
    } else if (shieldState === ShieldState.PASSED) {
      this.gitHubApi_.setPullRequestStatus({
        state: GitHubApi.PullRequestState.SUCCESS,
        description: `All ${strTotal} screenshots match PR's golden.json`,
        targetUrl,
      });
    } else if (shieldState === ShieldState.FAILED) {
      this.gitHubApi_.setPullRequestStatus({
        state: GitHubApi.PullRequestState.SUCCESS,
        description: `${strChanged} screenshot${changedPlural} differ from PR's golden.json`,
        targetUrl,
      });
    } else {
      this.gitHubApi_.setPullRequestStatus({
        state: GitHubApi.PullRequestState.PENDING,
        description: `${strDone} of ${strTotal} (${strPercent}) - ${strChanged} diff${changedPlural}`,
        targetUrl,
      });
    }
  }
}

module.exports = StatusNotifier;
