/**
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

import {assert} from 'chai';
import td from 'testdouble';

import {setupFoundationTest} from '../helpers/setup';
import MDCPersistentDrawerFoundation from '../../../packages/mdc-drawer/persistent/foundation';
import {cssClasses, strings} from '../../../packages/mdc-drawer/persistent/constants';

function setupTest() {
  const {foundation, mockAdapter} = setupFoundationTest(MDCPersistentDrawerFoundation);
  td.when(mockAdapter.hasClass('mdc-persistent-drawer')).thenReturn(true);
  td.when(mockAdapter.hasNecessaryDom()).thenReturn(true);
  return {foundation, mockAdapter};
}

suite('MDCPersistentDrawerFoundation');

test('exports strings', () => {
  assert.deepEqual(MDCPersistentDrawerFoundation.strings, strings);
});

test('exports cssClasses', () => {
  assert.deepEqual(MDCPersistentDrawerFoundation.cssClasses, cssClasses);
});

test('defaultAdapter returns a complete adapter implementation', () => {
  const {defaultAdapter} = MDCPersistentDrawerFoundation;
  const methods = Object.keys(defaultAdapter).filter((k) => typeof defaultAdapter[k] === 'function');

  assert.equal(methods.length, Object.keys(defaultAdapter).length, 'Every adapter key must be a function');
  assert.deepEqual(methods, [
    'addClass', 'removeClass', 'hasClass', 'hasNecessaryDom', 'registerInteractionHandler',
    'deregisterInteractionHandler', 'registerDrawerInteractionHandler', 'deregisterDrawerInteractionHandler',
    'registerTransitionEndHandler', 'deregisterTransitionEndHandler', 'registerDocumentKeydownHandler',
    'deregisterDocumentKeydownHandler', 'setTranslateX', 'getFocusableElements',
    'saveElementTabState', 'restoreElementTabState', 'makeElementUntabbable', 'isRtl', 'getDrawerWidth', 'isRoot',
  ]);
  // Test default methods
  methods.forEach((m) => assert.doesNotThrow(defaultAdapter[m]));
});

test('#init is super.init', () => {
  const {foundation, mockAdapter} = setupTest();
  const {isA} = td.matchers;

  foundation.init();
  td.verify(mockAdapter.registerDrawerInteractionHandler('click', isA(Function)));
});

test('#isRootTransitioningElement_ returns true if the element is the root element', () => {
  const {foundation, mockAdapter} = setupTest();

  foundation.init();
  const fakeEl = 'fake element';
  td.when(mockAdapter.isRoot(fakeEl)).thenReturn(true);
  assert.isTrue(foundation.isRootTransitioningElement_(fakeEl));
});

