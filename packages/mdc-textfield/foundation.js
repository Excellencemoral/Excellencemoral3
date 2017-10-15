/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

import MDCFoundation from '@material/base/foundation';
import {MDCTextFieldAdapter, NativeInputType} from './adapter';
import {cssClasses, strings} from './constants';


/**
 * @extends {MDCFoundation<!MDCTextFieldAdapter>}
 * @final
 */
class MDCTextFieldFoundation extends MDCFoundation {
  /** @return enum {string} */
  static get cssClasses() {
    return cssClasses;
  }

  /** @return enum {string} */
  static get strings() {
    return strings;
  }

  /**
   * {@see MDCTextFieldAdapter} for typing information on parameters and return
   * types.
   * @return {!MDCTextFieldAdapter}
   */
  static get defaultAdapter() {
    return /** @type {!MDCTextFieldAdapter} */ ({
      addClass: () => {},
      removeClass: () => {},
      addClassToLabel: () => {},
      removeClassFromLabel: () => {},
      setIconAttr: () => {},
      eventTargetHasClass: () => {},
      registerTextFieldInteractionHandler: () => {},
      deregisterTextFieldInteractionHandler: () => {},
      notifyIconAction: () => {},
      addClassToBottomLine: () => {},
      removeClassFromBottomLine: () => {},
      addClassToHelperText: () => {},
      removeClassFromHelperText: () => {},
      helperTextHasClass: () => false,
      registerInputInteractionHandler: () => {},
      deregisterInputInteractionHandler: () => {},
      registerTransitionEndHandler: () => {},
      deregisterTransitionEndHandler: () => {},
      setBottomLineAttr: () => {},
      setHelperTextAttr: () => {},
      removeHelperTextAttr: () => {},
      getNativeInput: () => {},
    });
  }

  /**
   * @param {!MDCTextFieldAdapter=} adapter
   */
  constructor(adapter = /** @type {!MDCTextFieldAdapter} */ ({})) {
    super(Object.assign(MDCTextFieldFoundation.defaultAdapter, adapter));

    /** @private {boolean} */
    this.isFocused_ = false;
    /** @private {boolean} */
    this.receivedUserInput_ = false;
    /** @private {boolean} */
    this.useCustomValidityChecking_ = false;
    /** @private {function(): undefined} */
    this.inputFocusHandler_ = () => this.activateFocus();
    /** @private {function(): undefined} */
    this.inputBlurHandler_ = () => this.deactivateFocus();
    /** @private {function(): undefined} */
    this.inputInputHandler_ = () => this.autoCompleteFocus();
    /** @private {function(!Event): undefined} */
    this.setPointerXOffset_ = (evt) => this.animateBottomLine(evt);
    /** @private {function(!Event): undefined} */
    this.textFieldInteractionHandler_ = (evt) => this.handleTextFieldInteraction(evt);
    /** @private {function(!Event): undefined} */
    this.transitionEndHandler_ = (evt) => this.handleBottomLineAnimationEnd(evt);
  }

  init() {
    this.adapter_.addClass(MDCTextFieldFoundation.cssClasses.UPGRADED);
    // Ensure label does not collide with any pre-filled value.
    if (this.getNativeInput_().value) {
      this.adapter_.addClassToLabel(MDCTextFieldFoundation.cssClasses.LABEL_FLOAT_ABOVE);
    }

    this.adapter_.registerInputInteractionHandler('focus', this.inputFocusHandler_);
    this.adapter_.registerInputInteractionHandler('blur', this.inputBlurHandler_);
    this.adapter_.registerInputInteractionHandler('input', this.inputInputHandler_);
    ['mousedown', 'touchstart'].forEach((evtType) => {
      this.adapter_.registerInputInteractionHandler(evtType, this.setPointerXOffset_);
    });
    ['click', 'keydown'].forEach((evtType) => {
      this.adapter_.registerTextFieldInteractionHandler(evtType, this.textFieldInteractionHandler_);
    });
    this.adapter_.registerTransitionEndHandler(this.transitionEndHandler_);
    this.installPropertyChangeHooks_();
  }

  destroy() {
    this.adapter_.removeClass(MDCTextFieldFoundation.cssClasses.UPGRADED);
    this.adapter_.deregisterInputInteractionHandler('focus', this.inputFocusHandler_);
    this.adapter_.deregisterInputInteractionHandler('blur', this.inputBlurHandler_);
    this.adapter_.deregisterInputInteractionHandler('input', this.inputInputHandler_);
    ['mousedown', 'touchstart'].forEach((evtType) => {
      this.adapter_.deregisterInputInteractionHandler(evtType, this.setPointerXOffset_);
    });
    ['click', 'keydown'].forEach((evtType) => {
      this.adapter_.deregisterTextFieldInteractionHandler(evtType, this.textFieldInteractionHandler_);
    });
    this.adapter_.deregisterTransitionEndHandler(this.transitionEndHandler_);
    this.uninstallPropertyChangeHooks_();
  }

  /**
   * Handles all user interactions with the Text Field.
   * @param {!Event} evt
   */
  handleTextFieldInteraction(evt) {
    if (this.adapter_.getNativeInput().disabled) {
      return;
    }

    this.receivedUserInput_ = true;

    const {target, type} = evt;
    const {TEXT_FIELD_ICON} = MDCTextFieldFoundation.cssClasses;
    const targetIsIcon = this.adapter_.eventTargetHasClass(target, TEXT_FIELD_ICON);
    const eventTriggersNotification = type === 'click' || evt.key === 'Enter' || evt.keyCode === 13;

    if (targetIsIcon && eventTriggersNotification) {
      this.adapter_.notifyIconAction();
    }
  }

  /**
   * Activates the text field focus state.
   */
  activateFocus() {
    const {BOTTOM_LINE_ACTIVE, FOCUSED, LABEL_FLOAT_ABOVE, LABEL_SHAKE} = MDCTextFieldFoundation.cssClasses;
    this.adapter_.addClass(FOCUSED);
    this.adapter_.addClassToBottomLine(BOTTOM_LINE_ACTIVE);
    this.adapter_.addClassToLabel(LABEL_FLOAT_ABOVE);
    this.adapter_.removeClassFromLabel(LABEL_SHAKE);
    this.showHelperText_();
    this.isFocused_ = true;
  }

  /**
   * Animates the bottom line out from the user's click location.
   * @param {!Event} evt
   */
  animateBottomLine(evt) {
    const targetClientRect = evt.target.getBoundingClientRect();
    const evtCoords = {x: evt.clientX, y: evt.clientY};
    const normalizedX = evtCoords.x - targetClientRect.left;
    const attributeString =
      `transform-origin: ${normalizedX}px center`;

    this.adapter_.setBottomLineAttr('style', attributeString);
  }

  /**
   * Activates the Text Field's focus state in cases when the input value
   * changes without user input (e.g. programatically).
   */
  autoCompleteFocus() {
    if (!this.receivedUserInput_) {
      this.activateFocus();
    }
  }

  /**
   * Changes the floating label's state
   * @private
   */
  updateLabelFloat_() {
    // Don't do anything if the input is focused.
    if (!this.isFocused_) {
      const {LABEL_FLOAT_ABOVE, LABEL_SHAKE} = MDCTextfieldFoundation.cssClasses;
      const input = this.getNativeInput_();

      if (input.value) {
        this.adapter_.addClassToLabel(LABEL_FLOAT_ABOVE);
      } else {
        this.adapter_.removeClassFromLabel(LABEL_FLOAT_ABOVE);
      }

      if (!this.useCustomValidityChecking_) {
        this.adapter_.removeClassFromLabel(LABEL_SHAKE);
        this.showHelptext_();
        this.changeValidity_(input.checkValidity());
      }
    }
  }

  /**
   * Makes the helper text visible to screen readers.
   * @private
   */
  showHelperText_() {
    const {ARIA_HIDDEN} = MDCTextFieldFoundation.strings;
    this.adapter_.removeHelperTextAttr(ARIA_HIDDEN);
  }

  /**
   * Executes when the bottom line's transition animation ends, performing
   * actions that must wait for animations to finish.
   * @param {!Event} evt
   */
  handleBottomLineAnimationEnd(evt) {
    const {BOTTOM_LINE_ACTIVE} = MDCTextFieldFoundation.cssClasses;

    // We need to wait for the bottom line to be entirely transparent
    // before removing the class. If we do not, we see the line start to
    // scale down before disappearing
    if (evt.propertyName === 'opacity' && !this.isFocused_) {
      this.adapter_.removeClassFromBottomLine(BOTTOM_LINE_ACTIVE);
    }
  }

  /**
   * Deactives the Text Field's focus state.
   */
  deactivateFocus() {
    const {FOCUSED, LABEL_FLOAT_ABOVE, LABEL_SHAKE} = MDCTextFieldFoundation.cssClasses;
    const input = this.getNativeInput_();

    this.isFocused_ = false;
    this.adapter_.removeClass(FOCUSED);
    this.adapter_.removeClassFromLabel(LABEL_SHAKE);

    if (!input.value && !this.isBadInput_()) {
      this.adapter_.removeClassFromLabel(LABEL_FLOAT_ABOVE);
      this.receivedUserInput_ = false;
    }

    if (!this.useCustomValidityChecking_) {
      this.changeValidity_(input.checkValidity());
    }
  }

  /**
   * Updates the Text Field's valid state based on the supplied validity.
   * @param {boolean} isValid
   * @private
   */
  changeValidity_(isValid) {
    const {INVALID, LABEL_SHAKE} = MDCTextFieldFoundation.cssClasses;
    if (isValid) {
      this.adapter_.removeClass(INVALID);
    } else {
      this.adapter_.addClassToLabel(LABEL_SHAKE);
      this.adapter_.addClass(INVALID);
    }
    this.updateHelperText_(isValid);
  }

  /**
   * Updates the state of the Text Field's helper text based on validity and
   * the Text Field's options.
   * @param {boolean} isValid
   */
  updateHelperText_(isValid) {
    const {HELPER_TEXT_PERSISTENT, HELPER_TEXT_VALIDATION_MSG} = MDCTextFieldFoundation.cssClasses;
    const {ROLE} = MDCTextFieldFoundation.strings;
    const helperTextIsPersistent = this.adapter_.helperTextHasClass(HELPER_TEXT_PERSISTENT);
    const helperTextIsValidationMsg = this.adapter_.helperTextHasClass(HELPER_TEXT_VALIDATION_MSG);
    const validationMsgNeedsDisplay = helperTextIsValidationMsg && !isValid;

    if (validationMsgNeedsDisplay) {
      this.adapter_.setHelperTextAttr(ROLE, 'alert');
    } else {
      this.adapter_.removeHelperTextAttr(ROLE);
    }

    if (helperTextIsPersistent || validationMsgNeedsDisplay) {
      return;
    }
    this.hideHelperText_();
  }

  /**
   * Hides the helper text from screen readers.
   * @private
   */
  hideHelperText_() {
    const {ARIA_HIDDEN} = MDCTextFieldFoundation.strings;
    this.adapter_.setHelperTextAttr(ARIA_HIDDEN, 'true');
  }

  /**
   * @return {boolean} True if the Text Field input fails validity checks.
   * @private
   */
  isBadInput_() {
    const input = this.getNativeInput_();
    return input.validity ? input.validity.badInput : input.badInput;
  }

  /**
   * @return {boolean} True if the Text Field is disabled.
   */
  isDisabled() {
    return this.getNativeInput_().disabled;
  }

  /**
   * @param {boolean} disabled Sets the text-field disabled or enabled.
   */
  setDisabled(disabled) {
    const {DISABLED, INVALID} = MDCTextFieldFoundation.cssClasses;
    this.getNativeInput_().disabled = disabled;
    if (disabled) {
      this.adapter_.addClass(DISABLED);
      this.adapter_.removeClass(INVALID);
      this.adapter_.setIconAttr('tabindex', '-1');
    } else {
      this.adapter_.removeClass(DISABLED);
      this.adapter_.setIconAttr('tabindex', '0');
    }
  }

  /**
   * @return {!Element|!NativeInputType} The native text input from the
   * host environment, or a dummy if none exists.
   * @private
   */
  getNativeInput_() {
    return this.adapter_.getNativeInput() ||
    /** @type {!NativeInputType} */ ({
      checkValidity: () => true,
      value: '',
      disabled: false,
      badInput: false,
    });
  }

  /**
   * @param {boolean} isValid Sets the validity state of the Text Field.
   */
  setValid(isValid) {
    this.useCustomValidityChecking_ = true;
    this.changeValidity_(isValid);
  }

  /** @private */
  installPropertyChangeHooks_() {
    const {INPUT_PROTO_PROP} = MDCTextfieldFoundation.strings;
    const nativeInputElement = this.getNativeInput_();
    const inputElementProto = Object.getPrototypeOf(nativeInputElement);
    const desc = Object.getOwnPropertyDescriptor(inputElementProto, INPUT_PROTO_PROP);

    // We have to check for this descriptor, since some browsers (Safari) don't support its return.
    // See: https://bugs.webkit.org/show_bug.cgi?id=49739
    if (validDescriptor(desc)) {
      const nativeInputElementDesc = /** @type {!ObjectPropertyDescriptor} */ ({
        get: desc.get,
        set: (value) => {
          desc.set.call(nativeInputElement, value);
          this.updateLabelFloat_();
        },
        configurable: desc.configurable,
        enumerable: desc.enumerable,
      });
      Object.defineProperty(nativeInputElement, INPUT_PROTO_PROP, nativeInputElementDesc);
    }
  }

  /** @private */
  uninstallPropertyChangeHooks_() {
    const {INPUT_PROTO_PROP} = MDCTextfieldFoundation.strings;
    const nativeInputElement = this.getNativeInput_();
    const inputElementProto = Object.getPrototypeOf(nativeInputElement);
    const desc = /** @type {!ObjectPropertyDescriptor} */ (
      Object.getOwnPropertyDescriptor(inputElementProto, INPUT_PROTO_PROP));
    if (validDescriptor(desc)) {
      Object.defineProperty(nativeInputElement, INPUT_PROTO_PROP, desc);
    }
  }
}

/**
 * @param {ObjectPropertyDescriptor|undefined} inputPropDesc
 * @return {boolean}
 */
function validDescriptor(inputPropDesc) {
  return !!inputPropDesc && typeof inputPropDesc.set === 'function';
}

export default MDCTextFieldFoundation;
