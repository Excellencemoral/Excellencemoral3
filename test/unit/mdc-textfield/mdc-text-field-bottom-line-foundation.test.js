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

import {assert} from 'chai';
import td from 'testdouble';

import {verifyDefaultAdapter} from '../helpers/foundation';
import {setupFoundationTest} from '../helpers/setup';
import MDCTextFieldBottomLineFoundation from '../../../packages/mdc-textfield/bottom-line/foundation';

const {cssClasses} = MDCTextFieldBottomLineFoundation;

suite('MDCTextFieldBottomLineFoundation');

test('exports cssClasses', () => {
  assert.isOk('cssClasses' in MDCTextFieldBottomLineFoundation);
});

test('defaultAdapter returns a complete adapter implementation', () => {
  verifyDefaultAdapter(MDCTextFieldBottomLineFoundation, [
    'addClassToBottomLine', 'removeClassFromBottomLine', 'setBottomLineAttr',
    'registerTransitionEndHandler', 'deregisterTransitionEndHandler',
    'notifyOpacityTransitionEnd',
  ]);
});

const setupTest = () => setupFoundationTest(MDCTextFieldBottomLineFoundation);

test('#init adds event listeners', () => {
  const {foundation, mockAdapter} = setupTest();
  foundation.init();

  td.verify(mockAdapter.registerTransitionEndHandler(td.matchers.isA(Function)));
});

test('#destroy removes event listeners', () => {
  const {foundation, mockAdapter} = setupTest();
  foundation.destroy();

  td.verify(mockAdapter.deregisterTransitionEndHandler(td.matchers.isA(Function)));
});

test('activate adds mdc-text-field__bottom-line--active class', () => {
  const {foundation, mockAdapter} = setupTest();
  foundation.init();
  foundation.activate();
  td.verify(mockAdapter.addClassToBottomLine(cssClasses.BOTTOM_LINE_ACTIVE));
});

test('deactivate removes mdc-text-field__bottom-line--active class', () => {
  const {foundation, mockAdapter} = setupTest();
  foundation.init();
  foundation.deactivate();
  td.verify(mockAdapter.removeClassFromBottomLine(cssClasses.BOTTOM_LINE_ACTIVE));
});

test('animate the bottom line', () => {
  const {foundation, mockAdapter} = setupTest();
  const mockEvt = {
    target: {
      getBoundingClientRect: () => {
        return {};
      },
    },
    clientX: 200,
    clientY: 200,
  };

  foundation.init();
  foundation.animate(mockEvt);

  td.verify(mockAdapter.setBottomLineAttr('style', td.matchers.isA(String)));
});

test('on opacity transition end, emit custom event', () => {
  const {foundation, mockAdapter} = setupTest();
  const mockEvt = {
    propertyName: 'opacity',
  };
  let transitionEnd;

  td.when(mockAdapter.registerTransitionEndHandler(td.matchers.isA(Function))).thenDo((handler) => {
    transitionEnd = handler;
  });

  foundation.init();
  transitionEnd(mockEvt);

  td.verify(mockAdapter.notifyOpacityTransitionEnd());
});
