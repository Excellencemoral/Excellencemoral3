/**
 * @license
 * Copyright 2020 Google Inc.
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

import {setUpFoundationTest} from '../../../testing/helpers/setup';
import {MDCTabScrollerFoundation} from '../foundation';
import {MDCTabScrollerRTLNegative} from '../rtl-negative-scroller';

const setupTest =
    ({rootWidth, contentWidth, scrollLeft}:
         {rootWidth: number, contentWidth: number, scrollLeft: number}) => {
      const {mockAdapter} = setUpFoundationTest(MDCTabScrollerFoundation);
      const scroller = new MDCTabScrollerRTLNegative(mockAdapter);
      mockAdapter.getScrollAreaOffsetWidth.and.returnValue(rootWidth);
      mockAdapter.getScrollContentOffsetWidth.and.returnValue(contentWidth);
      mockAdapter.getScrollAreaScrollLeft.and.returnValue(scrollLeft);
      return {scroller, mockAdapter};
    };

describe('MDCTabScrollerRTLNegative', () => {
  it('#getScrollPositionRTL() returns the current scroll distance when translateX is 0',
     () => {
       const {scroller} =
           setupTest({rootWidth: 200, contentWidth: 1000, scrollLeft: -123});
       expect(scroller.getScrollPositionRTL(0) === 123).toBe(true);
     });

  it('#getScrollPositionRTL() returns the current scroll distance minus translateX',
     () => {
       const {scroller} =
           setupTest({rootWidth: 200, contentWidth: 1000, scrollLeft: -123});
       expect(scroller.getScrollPositionRTL(11) === 134).toBe(true);
     });

  it('#scrollToRTL() returns a normalized scrollX property', () => {
    const {scroller} =
        setupTest({rootWidth: 200, contentWidth: 1000, scrollLeft: -111});
    expect(scroller.scrollToRTL(123).finalScrollPosition === -123).toBe(true);
  });

  it('#scrollToRTL() returns a normalized translateX property', () => {
    const {scroller} =
        setupTest({rootWidth: 200, contentWidth: 1000, scrollLeft: -111});
    expect(scroller.scrollToRTL(123).scrollDelta === -12).toBe(true);
  });

  it('#scrollToRTL() returns 0 for scrollX property when scrollLeft would be too far right',
     () => {
       const {scroller} =
           setupTest({rootWidth: 200, contentWidth: 1000, scrollLeft: -500});
       expect(scroller.scrollToRTL(-1).finalScrollPosition === 0).toBe(true);
     });

  it('#scrollToRTL() returns 0 for translateX property when scrollLeft would be the same',
     () => {
       const {scroller} =
           setupTest({rootWidth: 200, contentWidth: 1000, scrollLeft: -123});
       expect(scroller.scrollToRTL(123).scrollDelta === 0).toBe(true);
     });

  it('#scrollToRTL() returns min scroll value for scrollX property when scrollLeft would be too far left',
     () => {
       const {scroller} =
           setupTest({rootWidth: 200, contentWidth: 1000, scrollLeft: -677});
       expect(scroller.scrollToRTL(801).finalScrollPosition === -800)
           .toBe(true);
     });

  it('#incrementScrollRTL() returns a normalized scrollX property', () => {
    const {scroller} =
        setupTest({rootWidth: 200, contentWidth: 1000, scrollLeft: -111});
    expect(scroller.incrementScrollRTL(17).finalScrollPosition === -128)
        .toBe(true);
  });

  it('#incrementScrollRTL() returns a normalized translateX property', () => {
    const {scroller} =
        setupTest({rootWidth: 200, contentWidth: 1000, scrollLeft: -111});
    expect(scroller.incrementScrollRTL(50).scrollDelta === -50).toBe(true);
  });

  it('#incrementScrollRTL() returns 0 for scrollX property when scrollLeft would be too far right',
     () => {
       const {scroller} =
           setupTest({rootWidth: 200, contentWidth: 1000, scrollLeft: -45});
       expect(scroller.incrementScrollRTL(-46).finalScrollPosition === 0)
           .toBe(true);
     });

  it('#incrementScrollRTL() returns 0 for translateX property when scrollLeft would be the same',
     () => {
       const {scroller} =
           setupTest({rootWidth: 200, contentWidth: 1000, scrollLeft: -123});
       expect(scroller.incrementScrollRTL(0).scrollDelta === 0).toBe(true);
     });

  it('#incrementScrollRTL() returns min scroll value for scrollX property when scrollLeft would be too far left',
     () => {
       const {scroller} =
           setupTest({rootWidth: 200, contentWidth: 1000, scrollLeft: -677});
       expect(scroller.incrementScrollRTL(124).finalScrollPosition === -800)
           .toBe(true);
     });

  it('#getAnimatingScrollPosition() returns the difference between the scrollX value and the translateX value',
     () => {
       const {scroller} =
           setupTest({rootWidth: 200, contentWidth: 1000, scrollLeft: 677});
       expect(scroller.getAnimatingScrollPosition(123, 11) === 112).toBe(true);
     });
});
