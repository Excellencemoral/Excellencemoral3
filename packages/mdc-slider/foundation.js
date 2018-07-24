/**
 * @license
 * Copyright 2018 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 *you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {strings, cssClasses} from './constants';
import MDCSliderAdapter from './adapter';

import MDCFoundation from '@material/base/foundation';

/** @enum {string} */
const KEY_IDS = {
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
};

/** @enum {string} */
const MOVE_EVENT_MAP = {
  'mousedown': 'mousemove',
  'touchstart': 'touchmove',
  'pointerdown': 'pointermove',
};

const DOWN_EVENTS = ['mousedown', 'pointerdown', 'touchstart'];
const UP_EVENTS = ['mouseup', 'pointerup', 'touchend'];

/**
 * @extends {MDCFoundation<!MDCSliderAdapter>}
 */
class MDCSliderFoundation extends MDCFoundation {
  /** @return enum {string} */
  static get strings() {
    return strings;
  }

  /** @return enum {string} */
  static get cssClasses() {
    return cssClasses;
  }

  /** @return {!MDCSliderAdapter} */
  static get defaultAdapter() {
    return /** @type {!MDCSliderAdapter} */ ({
      hasClass: () => {},
      addClass: () => {},
      removeClass: () => {},
      setThumbAttribute: () => {},
      computeBoundingRect: () => {},
      eventTargetHasClass: () => {},
      registerEventHandler: () => {},
      deregisterEventHandler: () => {},
      registerBodyEventHandler: () => {},
      deregisterBodyEventHandler: () => {},
      registerWindowResizeHandler: () => {},
      deregisterWindowResizeHandler: () => {},
      notifyInput: () => {},
      notifyChange: () => {},
      setThumbStyleProperty: () => {},
      setTrackFillStyleProperty: () => {},
      focusThumb: () => {},
      activateRipple: () => {},
      deactivateRipple: () => {},
      isRTL: () => false,
    });
  }

  /**
   * Creates a new instance of MDCSliderFoundation
   * @param {?MDCSliderAdapter} adapter
   */
  constructor(adapter) {
    super(Object.assign(MDCSliderFoundation.defaultAdapter, adapter));
    /** @private {?ClientRect} */
    this.rect_ = null;
    /** @private {boolean} */
    this.active_ = false;
    /** @private {boolean} */
    this.inTransit_ = false;
    /** @private {number} */
    this.min_ = 0;
    /** @private {number} */
    this.max_ = 100;
    /** @private {number} */
    this.value_ = 0;
    /** @private {number} */
    this.step_ = 0;
    /** @private {function(!Event): undefined} */
    this.transitionEndHandler_ = (evt) => this.handleTransitionEnd(evt);
    /** @private {function(!Event): undefined} */
    this.interactionStartHandler_ = (evt) => this.handleInteractionStart(evt);
    /** @private {function(!Event): undefined} */
    this.interactionMoveHandler_ = (evt) => this.handleInteractionMove(evt);
    /** @private {function(): undefined} */
    this.interactionEndHandler_ = () => this.handleInteractionEnd();
    /** @private {function(!Event): undefined} */
    this.keydownHandler_ = (evt) => this.handleKeydown(evt);
    /** @private {function(): undefined} */
    this.windowResizeHandler_ = () => this.layout();
  }

  init() {
    DOWN_EVENTS.forEach((evtName) => this.adapter_.registerEventHandler(evtName, this.interactionStartHandler_));
    this.adapter_.registerEventHandler('keydown', this.keydownHandler_);
    this.adapter_.registerEventHandler('keyup', this.interactionEndHandler_);
    this.adapter_.registerEventHandler('transitionend', this.transitionEndHandler_);
    this.adapter_.registerWindowResizeHandler(this.windowResizeHandler_);
    this.layout();
  }

  destroy() {
    DOWN_EVENTS.forEach((evtName) => {
      this.adapter_.deregisterEventHandler(evtName, this.interactionStartHandler_);
    });
    this.adapter_.deregisterEventHandler('keydown', this.keydownHandler_);
    this.adapter_.deregisterEventHandler('keyup', this.interactionEndHandler_);
    this.adapter_.deregisterEventHandler('transitionend', this.transitionEndHandler_);
    this.adapter_.deregisterWindowResizeHandler(this.windowResizeHandler_);
  }

  layout() {
    this.rect_ = this.adapter_.computeBoundingRect();
    this.updateUIForCurrentValue_();
  }

  /** @return {number} */
  getValue() {
    return this.value_;
  }

  /** @param {number} value */
  setValue(value) {
    this.setValue_(value);
  }

  /** @return {number} */
  getMax() {
    return this.max_;
  }

  /** @param {number} max */
  setMax(max) {
    if (max < this.min_) {
      return;
    }
    this.max_ = max;
    this.setValue_(this.value_);
    this.adapter_.setThumbAttribute(strings.ARIA_VALUEMAX, String(this.max_));
  }

  /** @return {number} */
  getMin() {
    return this.min_;
  }

  /** @param {number} min */
  setMin(min) {
    if (min > this.max_) {
      return;
    }
    this.min_ = min;
    this.setValue_(this.value_);
    this.adapter_.setThumbAttribute(strings.ARIA_VALUEMIN, String(this.min_));
  }

  /** @return {number} */
  getStep() {
    return this.step_;
  }

  /** @param {number} step */
  setStep(step) {
    if (step < 0) {
      return;
    }
    this.step_ = step;
    this.setValue_(this.value_);
    this.adapter_.setThumbAttribute(strings.DATA_STEP, String(this.step_));
  }

  /**
   * Called when the inTransit transition ends
   * @param {!Event} evt
   */
  handleTransitionEnd(evt) {
    if (this.inTransit_ && this.adapter_.eventTargetHasClass(evt.target, cssClasses.TRACK_FILL)) {
      this.setInTransit_(false);
    }
  }

  /**
   * Called when the user starts interacting with the slider
   * @param {!Event} evt
   */
  handleInteractionStart(evt) {
    this.setActive_(true);
    this.adapter_.activateRipple();

    const shouldTransition =
      this.adapter_.eventTargetHasClass(evt.target, cssClasses.SLIDER) ||
      this.adapter_.eventTargetHasClass(evt.target, cssClasses.TRACK) ||
      this.adapter_.eventTargetHasClass(evt.target, cssClasses.TRACK_FILL);
    this.setInTransit_(shouldTransition);

    const moveHandler = (evt) => {
      this.interactionMoveHandler_(evt);
    };

    // Note: endHandler is [de]registered on ALL potential pointer-related release event types, since some browsers
    // do not always fire these consistently in pairs.
    // (See https://github.com/material-components/material-components-web/issues/1192)
    const endHandler = () => {
      this.interactionEndHandler_();
      this.adapter_.deregisterBodyEventHandler(MOVE_EVENT_MAP[evt.type], moveHandler);
      UP_EVENTS.forEach((evtName) => this.adapter_.deregisterBodyEventHandler(evtName, endHandler));
    };

    this.adapter_.registerBodyEventHandler(MOVE_EVENT_MAP[evt.type], moveHandler);
    UP_EVENTS.forEach((evtName) => this.adapter_.registerBodyEventHandler(evtName, endHandler));
    this.setValueFromEvt_(evt);
  }

  /**
   * Called when the user moves the slider
   * @param {!Event} evt
   */
  handleInteractionMove(evt) {
    evt.preventDefault();
    this.setValueFromEvt_(evt);
  }

  /**
   * Called when the user's interaction with the slider ends
   */
  handleInteractionEnd() {
    this.setActive_(false);
    this.adapter_.notifyChange();
    this.adapter_.deactivateRipple();
    this.adapter_.focusThumb();
  }

  /**
   * Handles keydown events
   * @param {!Event} evt
   */
  handleKeydown(evt) {
    const value = this.getKeyIdValue_(evt);
    if (isNaN(value)) {
      return;
    }

    this.setActive_(true);
    this.setInTransit_(true);

    // Prevent page from scrolling due to key presses that would normally scroll the page
    evt.preventDefault();
    this.setValue_(value);
    this.adapter_.notifyChange();
  }

  /**
   * Returns the computed name of the event
   * @param {!Event} keyboardEvt
   * @return {number}
   * @private
   */
  getKeyIdValue_(keyboardEvt) {
    let delta = this.step_ || (this.max_ - this.min_) / 100;
    if (this.adapter_.isRTL() && (
      keyboardEvt.key === KEY_IDS.ARROW_LEFT || keyboardEvt.keyCode === 37 ||
      keyboardEvt.key === KEY_IDS.ARROW_RIGHT || keyboardEvt.keyCode === 39)) {
      delta = -delta;
    }

    if (keyboardEvt.key === KEY_IDS.ARROW_LEFT || keyboardEvt.keyCode === 37
      || keyboardEvt.key === KEY_IDS.ARROW_DOWN || keyboardEvt.keyCode === 40) {
      return this.value_ - delta;
    }
    if (keyboardEvt.key === KEY_IDS.ARROW_RIGHT || keyboardEvt.keyCode === 39
      || keyboardEvt.key === KEY_IDS.ARROW_UP || keyboardEvt.keyCode === 38) {
      return this.value_ + delta;
    }
    if (keyboardEvt.key === KEY_IDS.HOME || keyboardEvt.keyCode === 36) {
      return this.min_;
    }
    if (keyboardEvt.key === KEY_IDS.END || keyboardEvt.keyCode === 35) {
      return this.max_;
    }
    if (keyboardEvt.key === KEY_IDS.PAGE_UP || keyboardEvt.keyCode === 33) {
      return this.value_ + delta * 5;
    }
    if (keyboardEvt.key === KEY_IDS.PAGE_DOWN || keyboardEvt.keyCode === 34) {
      return this.value_ - delta * 5;
    }

    return NaN;
  }

  /**
   * Returns the pageX of the event
   * @param {!Event} evt
   * @return {number}
   * @private
   */
  getPageX_(evt) {
    if (evt.targetTouches && evt.targetTouches.length > 0) {
      return evt.targetTouches[0].pageX;
    }
    return evt.pageX;
  }

  /**
   * Sets the slider value from an event
   * @param {!Event} evt
   * @private
   */
  setValueFromEvt_(evt) {
    const pageX = this.getPageX_(evt);
    const value = this.computeValueFromPageX_(pageX);
    this.setValue_(value);
  }

  /**
   * Computes the new value from the pageX position
   * @param {number} pageX
   * @return {number}
   */
  computeValueFromPageX_(pageX) {
    const xPos = pageX - this.rect_.left;
    let pctComplete = xPos / this.rect_.width;
    if (this.adapter_.isRTL()) {
      pctComplete = 1 - pctComplete;
    }

    // Fit the percentage complete between the range [min,max]
    // by remapping from [0, 1] to [min, min+(max-min)].
    return this.min_ + pctComplete * (this.max_ - this.min_);
  }

  /**
   * Sets the value of the slider
   * @param {number} value
   */
  setValue_(value) {
    if (value < this.min_) {
      value = this.min_;
    } else if (value > this.max_) {
      value = this.max_;
    }
    this.value_ = value;
    this.adapter_.setThumbAttribute(strings.ARIA_VALUENOW, String(this.value_));
    this.updateUIForCurrentValue_();
    this.adapter_.notifyInput();
  }

  /**
   * Updates the track-fill and thumb style properties to reflect current value
   */
  updateUIForCurrentValue_() {
    const pctComplete = (this.value_ - this.min_) / (this.max_ - this.min_);
    const translatePx = pctComplete * this.rect_.width;

    requestAnimationFrame(() => {
      if (this.adapter_.isRTL()) {
        this.adapter_.setThumbStyleProperty('transform', `translateX(-${translatePx}px) translateX(50%)`);
      } else {
        this.adapter_.setThumbStyleProperty('transform', `translateX(${translatePx}px) translateX(-50%)`);
      }
      this.adapter_.setTrackFillStyleProperty('transform', `scaleX(${translatePx})`);
    });
  }

  /**
   * Toggles the active state of the slider
   * @param {boolean} active
   */
  setActive_(active) {
    this.active_ = active;
    this.toggleClass_(cssClasses.ACTIVE, this.active_);
  }

  /**
   * Toggles the inTransit state of the slider
   * @param {boolean} inTransit
   */
  setInTransit_(inTransit) {
    this.inTransit_ = inTransit;
    this.toggleClass_(cssClasses.IN_TRANSIT, this.inTransit_);
  }

  /**
   * Conditionally adds or removes a class based on shouldBePresent
   * @param {string} className
   * @param {boolean} shouldBePresent
   */
  toggleClass_(className, shouldBePresent) {
    if (shouldBePresent) {
      this.adapter_.addClass(className);
    } else {
      this.adapter_.removeClass(className);
    }
  }
}

export default MDCSliderFoundation;
