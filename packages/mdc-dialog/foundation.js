/**
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

import {MDCFoundation} from '@material/base';
import {cssClasses, strings} from './constants';

export default class MDCDialogFoundation extends MDCFoundation {
  static get cssClasses() {
    return cssClasses;
  }

  static get strings() {
    return strings;
  }

  static get defaultAdapter() {
    return {
      hasClass: (/* className: string */) => {},
      addClass: (/* className: string */) => {},
      removeClass: (/* className: string */) => {},
      addScrollLockClass: (/* className: string */) => {},
      removeScrollLockClass: (/* className: string */) => {},
      registerInteractionHandler: (/* evt: string, handler: EventListener */) => {},
      deregisterInteractionHandler: (/* evt: string, handler: EventListener */) => {},
      registerDialogSurfaceInteractionHandler: (/* evt: string, handler: EventListener */) => {},
      deregisterDialogSurfaceInteractionHandler: (/* evt: string, handler: EventListener */) => {},
      registerDocumentKeydownHandler: (/* handler: EventListener */) => {},
      deregisterDocumentKeydownHandler: (/* handler: EventListener */) => {},
      registerAcceptHandler: (/* handler: EventListener */) => {},
      deregisterAcceptHandler: (/* handler: EventListener */) => {},
      registerCancelHandler: (/* handler: EventListener */) => {},
      deregisterCancelHandler: (/* handler: EventListener */) => {},
      registerFocusTrappingHandler: (/* handler: EventListener */) => {},
      deregisterFocusTrappingHandler: (/* handler: EventListener */) => {},
      numFocusableElements: () => {/* number of focusable elements */},
      setDialogFocusFirstTarget: () => {/* sets focus on first element in dialog */},
      setInitialFocus: () => /* sets focus on the accept button when dialog opens */ {},
      getFocusableElements: (/* handler: EventListener */) => /* NodeList */ {},
      saveElementTabState: (/* el: Element */) => {},
      restoreElementTabState: (/* el: Element */) => {},
      makeElementUntabbable: (/* el: Element */) => {},
      setBackgroundAttr: (/* attr: String, val: Boolean */) => {},
      setDialogAttr: (/* attr: String, val: Boolean */) => {},
      getFocusedElement: () => /* gets the element used to open the dialog */ {},
      setFocusedElement: (/* target: Element */) => /*  */ {},
      acceptAction: () => {/* accept function */},
      cancelAction: () => {/* cancel function */},
    };
  }

  constructor(adapter) {
    super(Object.assign(MDCDialogFoundation.defaultAdapter, adapter));

    this.lastFocusedElement_ = null;
    this.currentFocusedElIndex_ = -1;
    this.inert_ = true;
    this.isOpen_ = false;
    this.componentClickHandler_ = () => this.cancel();
    this.dialogClickHandler_ = (evt) => evt.stopPropagation();
    this.acceptHandler_ = () => this.accept();
    this.cancelHandler_ = () => this.cancel();
    this.focusHandler_ = () => this.setFocus_();
    this.documentKeydownHandler_ = (evt) => {
      if (evt.key && evt.key === 'Escape' || evt.keyCode === 27) {
        this.cancel();
      }
    };
  }

  init() {
    const {OPEN} = MDCDialogFoundation.cssClasses;

    if (this.adapter_.hasClass(OPEN)) {
      this.isOpen_ = true;
    } else {
      this.makeUntabbable_();
      this.isOpen_ = false;
    }
  }

  getLastFocusTarget() {
    return this.lastFocusedElement_;
  }

  open() {
    this.lastFocusedElement_ = this.adapter_.getFocusedElement();
    this.makeTabbable_();
    this.adapter_.registerAcceptHandler(this.acceptHandler_);
    this.adapter_.registerCancelHandler(this.cancelHandler_);
    this.adapter_.registerDocumentKeydownHandler(this.documentKeydownHandler_);
    this.adapter_.registerDialogSurfaceInteractionHandler('click', this.dialogClickHandler_);
    this.adapter_.registerInteractionHandler('click', this.componentClickHandler_);
    this.adapter_.registerFocusTrappingHandler(this.focusHandler_);
    this.adapter_.setInitialFocus();
    this.disableScroll_();
    this.adapter_.setBackgroundAttr('aria-hidden', true);
    this.adapter_.setDialogAttr('aria-hidden', false);
    this.adapter_.addClass(MDCDialogFoundation.cssClasses.OPEN);
    this.isOpen_ = true;
  }

  close() {
    this.makeUntabbable_();
    this.adapter_.deregisterAcceptHandler(this.acceptHandler_);
    this.adapter_.deregisterCancelHandler(this.cancelHandler_);
    this.adapter_.deregisterDialogSurfaceInteractionHandler(this.dialogClickHandler_);
    this.adapter_.deregisterDocumentKeydownHandler(this.documentKeydownHandler_);
    this.adapter_.deregisterInteractionHandler(this.componentClickHandler_);
    this.adapter_.deregisterFocusTrappingHandler(this.focusHandler_);
    this.adapter_.removeClass(MDCDialogFoundation.cssClasses.OPEN);
    this.enableScroll_();
    this.adapter_.setBackgroundAttr('aria-hidden', false);
    this.adapter_.setDialogAttr('aria-hidden', true);
    this.isOpen_ = false;
    this.adapter_.setFocusedElement(this.lastFocusedElement_);
  }

  accept() {
    this.adapter_.acceptAction();
    this.close();
  }

  cancel() {
    this.adapter_.cancelAction();
    this.close();
  }

  /**
   *  Render all children of the dialog inert when it's closed.
   *  Since there is no implied order of elements there is no need
   *  to keep track of their indexes.
   */
  makeUntabbable_() {
    if (this.inert_) {
      return;
    }

    const elements = this.adapter_.getFocusableElements();
    if (elements) {
      for (let i = 0; i < elements.length; i++) {
        this.adapter_.saveElementTabState(elements[i]);
        this.adapter_.makeElementUntabbable(elements[i]);
      }
    }

    this.inert_ = true;
  }

  /**
   *  Make all children of the dialog tabbable again when it's open.
   */
  makeTabbable_() {
    if (!this.inert_) {
      return;
    }

    const elements = this.adapter_.getFocusableElements();
    if (elements) {
      for (let i = 0; i < elements.length; i++) {
        this.adapter_.restoreElementTabState(elements[i]);
      }
    }

    this.inert_ = false;
  }

  setFocus_() {
    const numTabbable = this.adapter_.numFocusableElements();

    if (this.currentFocusedElIndex_ > -1) {
      this.currentFocusedElIndex_++;

      if (this.currentFocusedElIndex_ >= numTabbable) {
        this.adapter_.setDialogFocusFirstTarget();
        this.currentFocusedElIndex_ = 0;
      }
    } else {
      this.currentFocusedElIndex_ = numTabbable;
    }
  }

  disableScroll_() {
    this.adapter_.addScrollLockClass();
  }

  enableScroll_() {
    this.adapter_.removeScrollLockClass();
  }

  isOpen() {
    return this.isOpen_;
  }
}
