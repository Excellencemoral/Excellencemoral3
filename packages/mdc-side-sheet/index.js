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

import {MDCComponent} from '@material/base/index';
import MDCDismissibleSideSheetFoundation from './dismissible/foundation';
import MDCModalSideSheetFoundation from './modal/foundation';
import MDCSideSheetAdapter from './adapter';
import {strings} from './constants';
import * as util from './util';
import createFocusTrap from 'focus-trap';

/**
 * @extends {MDCComponent<!MDCDismissibleSideSheetFoundation>}
 * @final
 */
class MDCSideSheet extends MDCComponent {
  /**
   * @param {...?} args
   */
  constructor(...args) {
    super(...args);

    /** @private {!Element} */
    this.previousFocus_;

    /** @private {!Function} */
    this.handleKeydown_;

    /** @private {!Function} */
    this.handleTransitionEnd_;

    /** @private {!Function} */
    this.focusTrapFactory_;

    /** @private {!FocusTrapInstance} */
    this.focusTrap_;

    /** @private {?Element} */
    this.scrim_;

    /** @private {?Function} */
    this.handleScrimClick_;
  }

  /**
   * @param {!Element} root
   * @return {!MDCSideSheet}
   */
  static attachTo(root) {
    return new MDCSideSheet(root);
  }

  /**
   * Returns true if side-sheet is in the open position.
   * @return {boolean}
   */
  get open() {
    return this.foundation_.isOpen();
  }

  /**
   * Toggles the side-sheet open and closed.
   * @param {boolean} isOpen
   */
  set open(isOpen) {
    if (isOpen) {
      this.foundation_.open();
    } else {
      this.foundation_.close();
    }
  }

  initialize(focusTrapFactory = createFocusTrap) {
    this.focusTrapFactory_ = focusTrapFactory;
  }

  initialSyncWithDOM() {
    const {MODAL} = MDCDismissibleSideSheetFoundation.cssClasses;

    if (this.root_.classList.contains(MODAL)) {
      const {SCRIM_SELECTOR} = MDCDismissibleSideSheetFoundation.strings;
      this.scrim_ = /** @type {!Element} */ (this.root_.parentElement.querySelector(SCRIM_SELECTOR));
      this.handleScrimClick_ = () => /** @type {!MDCModalSideSheetFoundation} */ (this.foundation_).handleScrimClick();
      this.scrim_.addEventListener('click', this.handleScrimClick_);
      this.focusTrap_ = util.createFocusTrapInstance(this.root_, this.focusTrapFactory_);
    }

    this.handleKeydown_ = (evt) => this.foundation_.handleKeydown(evt);
    this.handleTransitionEnd_ = (evt) => this.foundation_.handleTransitionEnd(evt);

    this.root_.addEventListener('keydown', this.handleKeydown_);
    this.root_.addEventListener('transitionend', this.handleTransitionEnd_);
  }

  destroy() {
    this.root_.removeEventListener('keydown', this.handleKeydown_);
    this.root_.removeEventListener('transitionend', this.handleTransitionEnd_);

    const {MODAL} = MDCDismissibleSideSheetFoundation.cssClasses;
    if (this.root_.classList.contains(MODAL)) {
      this.scrim_.removeEventListener('click', /** @type {!Function} */ (this.handleScrimClick_));
      // Ensure side-sheet is closed to hide scrim and release focus
      this.open = false;
    }
  }

  getDefaultFoundation() {
    /** @type {!MDCSideSheetAdapter} */
    const adapter = /** @type {!MDCSideSheetAdapter} */ (Object.assign({
      addClass: (className) => this.root_.classList.add(className),
      removeClass: (className) => this.root_.classList.remove(className),
      hasClass: (className) => this.root_.classList.contains(className),
      elementHasClass: (element, className) => element.classList.contains(className),
      saveFocus: () => {
        this.previousFocus_ = document.activeElement;
      },
      restoreFocus: () => {
        const previousFocus = this.previousFocus_ && this.previousFocus_.focus;
        if (this.root_.contains(document.activeElement) && previousFocus) {
          this.previousFocus_.focus();
        }
      },
      focusActiveNavigationItem: () => {
        const firstFocusableEl = this.root_.querySelector('a, button, input'); // TODO(acdvorak): Use `tabbable`
        if (firstFocusableEl) {
          firstFocusableEl.focus();
        }
      },
      notifyClose: () => this.emit(strings.CLOSE_EVENT, {}, true /* shouldBubble */),
      notifyOpen: () => this.emit(strings.OPEN_EVENT, {}, true /* shouldBubble */),
      trapFocus: () => this.focusTrap_.activate(),
      releaseFocus: () => this.focusTrap_.deactivate(),
    }));

    const {DISMISSIBLE, MODAL} = MDCDismissibleSideSheetFoundation.cssClasses;
    if (this.root_.classList.contains(DISMISSIBLE)) {
      return new MDCDismissibleSideSheetFoundation(adapter);
    } else if (this.root_.classList.contains(MODAL)) {
      return new MDCModalSideSheetFoundation(adapter);
    } else {
      throw new Error(
        `MDCSideSheet: Failed to instantiate component. Supported variants are ${DISMISSIBLE} and ${MODAL}.`);
    }
  }
}

export {MDCSideSheet, MDCDismissibleSideSheetFoundation, MDCModalSideSheetFoundation, util};
