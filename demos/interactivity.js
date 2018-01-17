/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
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

import * as dom from './dom.js';
import * as util from './util.js';

const classes = {
  TOOLBAR_PROGRESS_BAR_ACTIVE: 'demo-toolbar-progress-bar--active',
};

const attributes = {
  HOT_SWAP: 'data-hot',
};

const ids = {
  TOOLBAR_PROGRESS_BAR: 'demo-toolbar-progress-bar',
};

/** @abstract */
export class InteractivityProvider {
  constructor(root) {
    /** @protected {!Element|!Document} */
    this.root_ = root;

    /** @protected {!Document} */
    this.document_ = this.root_.ownerDocument || this.root_;

    /** @protected {!Window} */
    this.window_ = this.document_.defaultView || this.document_.parentWindow;
  }

  initialize() {}

  /**
   * @param {string} id
   * @param {!Element|!Document=} opt_root
   * @return {?Element}
   * @protected
   */
  getElementById_(id, opt_root) {
    const root = opt_root || this.root_;
    return root.querySelector(`#${id}`);
  }

  /**
   * @param {string} selector
   * @param {!Element|!Document=} opt_root
   * @return {!Array<!Element>}
   * @protected
   */
  querySelectorAll_(selector, opt_root) {
    const root = opt_root || this.root_;
    return dom.getAll(selector, root);
  }
}

export class ToolbarProvider extends InteractivityProvider {
  /** @param {!Element|!Document} root */
  static attachTo(root) {
    const instance = new ToolbarProvider(root);
    instance.initialize();
    return instance;
  }

  /** @override */
  initialize() {
    /** @type {?Element} */
    this.progressBarEl_ = this.getElementById_(ids.TOOLBAR_PROGRESS_BAR);
  }

  /** @param {boolean} isLoading */
  setIsLoading(isLoading) {
    if (!this.progressBarEl_) {
      return;
    }

    if (isLoading) {
      this.progressBarEl_.classList.add(classes.TOOLBAR_PROGRESS_BAR_ACTIVE);
    } else {
      this.progressBarEl_.classList.remove(classes.TOOLBAR_PROGRESS_BAR_ACTIVE);
    }
  }
}

export class HotSwapper extends InteractivityProvider {
  constructor(root) {
    super(root);

    /** @type {number} */
    this.numPending_ = 0;
  }

  /**
   * @param {!Element|!Document} root
   * @param {!ToolbarProvider} toolbarProvider
   */
  static attachTo(root, toolbarProvider) {
    const instance = new HotSwapper(root);
    instance.initialize(toolbarProvider);
    return instance;
  }

  /** @private {number} */
  static get hotUpdateWaitPeriodMs_() {
    return 250;
  }

  /**
   * @param {!ToolbarProvider} toolbarProvider
   * @override
   */
  initialize(toolbarProvider) {
    /** @type {!ToolbarProvider} */
    this.toolbarProvider_ = toolbarProvider;

    this.registerHotUpdateHandler_();
  }

  /** @private */
  registerHotUpdateHandler_() {
    const hotSwapAllStylesheets = util.debounce(() => {
      this.hotSwapAllStylesheets_();
    }, HotSwapper.hotUpdateWaitPeriodMs_);

    this.window_.addEventListener('message', (evt) => {
      if (this.isWebpackRecompileStart_(evt)) {
        this.toolbarProvider_.setIsLoading(true);
      } else if (this.isWebpackRecompileEnd_(evt)) {
        hotSwapAllStylesheets();
      }
    });
  }

  /**
   * @param {!Event} evt
   * @return {boolean}
   * @private
   */
  isWebpackRecompileStart_(evt) {
    return Boolean(evt.data) && evt.data.type === 'webpackInvalid';
  }

  /**
   * @param {!Event} evt
   * @return {boolean}
   * @private
   */
  isWebpackRecompileEnd_(evt) {
    return typeof evt.data === 'string' && evt.data.indexOf('webpackHotUpdate') === 0;
  }

  /** @private */
  hotSwapAllStylesheets_() {
    dom.getAll(`link[${attributes.HOT_SWAP}]`, this.document_.head).forEach((link) => {
      this.hotSwapStylesheet_(link);
    });
  }

  /**
   * @param {!Element} oldLink
   * @param {string|undefined=} newUri
   * @protected
   */
  hotSwapStylesheet_(oldLink, newUri) {
    const oldUri = oldLink.getAttribute('href');

    // Reload existing stylesheet
    if (!newUri) {
      newUri = oldUri;
    }

    // Force IE 11 and Edge to bypass the cache and request a fresh copy of the CSS.
    newUri = this.bustCache_(newUri);

    this.enqueuePendingRequest_(oldUri, newUri);

    // Ensure that oldLink has a unique ID so we can remove all stale stylesheets from the DOM after newLink loads.
    // This is a more robust approach than holding a reference to oldLink and removing it directly, because a user might
    // quickly switch themes several times before the first stylesheet finishes loading (especially over a slow network)
    // and each new stylesheet would try to remove the first one, leaving multiple conflicting stylesheets in the DOM.
    const newId = oldLink.id || `stylesheet-${Math.floor(Math.random() * Date.now())}`;
    oldLink.id = newId;

    const newLink = oldLink.cloneNode(false);
    newLink.setAttribute('href', newUri);

    // IE 11 and Edge fire the `load` event twice for `<link>` elements.
    newLink.addEventListener('load', util.debounce(() => {
      this.dequeuePendingRequest_(oldUri, newUri, newId);
    }, 50));

    oldLink.parentNode.insertBefore(newLink, oldLink);
  }

  /**
   * @param {string} oldUri
   * @param {string} newUri
   * @private
   */
  enqueuePendingRequest_(oldUri, newUri) {
    this.logHotSwap_('swapping', oldUri, newUri, '...');
    this.toolbarProvider_.setIsLoading(true);
    this.numPending_++;
  }

  /**
   * @param {string} oldUri
   * @param {string} newUri
   * @param {string} newId
   * @private
   */
  dequeuePendingRequest_(oldUri, newUri, newId) {
    this.logHotSwap_('swapped', oldUri, newUri, '!');
    this.numPending_--;
    if (this.numPending_ === 0) {
      this.toolbarProvider_.setIsLoading(false);
    }
    setTimeout(() => this.purgeOldStylesheets_(newId));
  }

  /**
   * @param {string} newId
   * @private
   */
  purgeOldStylesheets_(newId) {
    let oldLinks;

    // New links are inserted before old links in the DOM, so we skip the first matching ID because it is the newest.
    const getOldLinks = () => this.querySelectorAll_(`link[id="${newId}"]`).slice(1);

    while ((oldLinks = getOldLinks()).length > 0) {
      oldLinks.forEach((oldLink) => {
        // Link has already been detached from the DOM. I'm not sure what causes this to happen; I've only seen it in
        // IE 11 and/or Edge so far, and only occasionally.
        if (!oldLink.parentNode) {
          return;
        }
        oldLink.parentNode.removeChild(oldLink);
      });
    }
  }

  /**
   * Adds a timestamp to the given URI to force IE 11 and Edge to bypass the cache and request a fresh copy of the CSS.
   * @param oldUri
   * @return {string}
   * @private
   */
  bustCache_(oldUri) {
    const newUri = oldUri
      // Remove previous timestamp param (if present)
      .replace(/[?&]timestamp=\d+(&|$)/, '')
      // Remove trailing '?' or '&' char (if present)
      .replace(/[?&]$/, '');
    const separator = newUri.indexOf('?') === -1 ? '?' : '&';
    return `${newUri}${separator}timestamp=${Date.now()}`;
  }

  /**
   * @param {string} verb
   * @param {string} oldUri
   * @param {string} newUri
   * @param {string} trailingPunctuation
   * @private
   */
  logHotSwap_(verb, oldUri, newUri, trailingPunctuation) {
    const swapMessage = `"${oldUri}"${newUri ? ` with "${newUri}"` : ''}`;
    console.log(`Hot ${verb} stylesheet ${swapMessage}${trailingPunctuation}`);
  }
}

/** @param {!Element|!Document} root */
export function init(root) {
  HotSwapper.attachTo(root, ToolbarProvider.attachTo(root));
}
