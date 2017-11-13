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

import MDCComponent from '@material/base/component';

import MDCTextFieldBottomLineAdapter from './adapter';
import MDCTextFieldBottomLineFoundation from './foundation';

/**
 * @extends {MDCComponent<!MDCTextFieldBottomLineFoundation>}
 * @final
 */
class MDCTextFieldBottomLine extends MDCComponent {
  /**
   * @param {!Element} root
   * @return {!MDCTextFieldBottomLine}
   */
  static attachTo(root) {
    return new MDCTextFieldBottomLine(root);
  }

  /**
   * @return {MDCTextFieldBottomLineFoundation}
   */
  get foundation() {
    return this.foundation_;
  }

  /**
   * @return {!MDCTextFieldBottomLineFoundation}
   */
  getDefaultFoundation() {
    return new MDCTextFieldBottomLineFoundation(/** @type {!MDCTextFieldBottomLineAdapter} */ (Object.assign({
      addClassToBottomLine: (className) => this.root_.classList.add(className),
      removeClassFromBottomLine: (className) => this.root_.classList.remove(className),
      setBottomLineAttr: (attr, value) => this.root_.setAttribute(attr, value),
      registerTransitionEndHandler: (handler) => this.root_.addEventListener('transitionend', handler),
      deregisterTransitionEndHandler: (handler) => this.root_.removeEventListener('transitionend', handler),
      notifyOpacityTransitionEnd: () => {
        this.emit(MDCTextFieldBottomLineFoundation.strings.OPACITY_TRANSITION_END_EVENT, {});
      },
    })));
  }
}

export {MDCTextFieldBottomLine, MDCTextFieldBottomLineFoundation};
