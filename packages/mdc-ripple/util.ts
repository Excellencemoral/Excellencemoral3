/**
 * @license
 * Copyright 2016 Google Inc.
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
import {MsElement} from '@material/dom/ponyfill';
import {Point} from './adapter';

interface CssObject {
  supports(prop: string, value?: string): boolean;
}

interface CssWindow extends Window {
  CSS?: CssObject;
}

/**
 * Stores result from supportsCssVariables to avoid redundant processing to
 * detect CSS custom variable support.
 */
let supportsCssVariables_: boolean|undefined;

/**
 * Stores result from applyPassive to avoid redundant processing to detect
 * passive event listener support.
 */
let supportsPassive_: boolean|undefined;

function detectEdgePseudoVarBug(windowObj: Window): boolean {
  // Detect versions of Edge with buggy var() support
  // See: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/11495448/
  const document = windowObj.document;
  const node = document.createElement('div');
  node.className = 'mdc-ripple-surface--test-edge-var-bug';
  document.body.appendChild(node);

  // The bug exists if ::before style ends up propagating to the parent element.
  // Additionally, getComputedStyle returns null in iframes with display: "none" in Firefox,
  // but Firefox is known to support CSS custom properties correctly.
  // See: https://bugzilla.mozilla.org/show_bug.cgi?id=548397
  const computedStyle = windowObj.getComputedStyle(node);
  const hasPseudoVarBug = computedStyle !== null && computedStyle.borderTopStyle === 'solid';
  node.remove();
  return hasPseudoVarBug;
}

/** Checks whether the browser supports Css Variables. */
export function supportsCssVariables(windowObj: CssWindow, forceRefresh = false): boolean {
  let supportsCssVars = supportsCssVariables_;
  if (typeof supportsCssVariables_ === 'boolean' && !forceRefresh) {
    return Boolean(supportsCssVariables_);
  }

  const supportsFunctionPresent = windowObj.CSS && typeof windowObj.CSS.supports === 'function';
  if (!supportsFunctionPresent) {
    return false;
  }

  const {CSS} = windowObj;
  const explicitlySupportsCssVars = CSS
    && CSS.supports('--css-vars', 'yes');
  // See: https://bugs.webkit.org/show_bug.cgi?id=154669
  // See: README section on Safari
  const weAreFeatureDetectingSafari10plus = (
    CSS &&
    CSS.supports('(--css-vars: yes)') &&
    CSS.supports('color', '#00000000')
  );

  if (explicitlySupportsCssVars || weAreFeatureDetectingSafari10plus) {
    supportsCssVars = !detectEdgePseudoVarBug(windowObj);
  } else {
    supportsCssVars = false;
  }

  if (!forceRefresh) {
    supportsCssVariables_ = supportsCssVars;
  }
  return supportsCssVars;
}

/**
 * Determine whether the current browser supports passive event listeners, and
 * if so, use them.
 */
export function applyPassive(globalObj: Window = window, forceRefresh = false):
    boolean|EventListenerOptions {
  if (supportsPassive_ === undefined || forceRefresh) {
    let isSupported = false;
    try {
      globalObj.document.addEventListener('test', () => undefined, {get passive() {
        isSupported = true;
        return isSupported;
      }});
    // tslint:disable-next-line:no-empty cannot throw error because of tests. tslint also disables console.logs
    } catch (e) {}

    supportsPassive_ = isSupported;
  }

  return supportsPassive_ ? {passive: true} as EventListenerOptions : false;
}

/** Gets the matches function from an element. */
export function getMatchesFunction(htmlElementPrototype: HTMLElement): (selector: string) => boolean {
  if (htmlElementPrototype.webkitMatchesSelector) {
    return htmlElementPrototype.webkitMatchesSelector;
  } else if ((htmlElementPrototype as Element as MsElement).msMatchesSelector) {
    return htmlElementPrototype.webkitMatchesSelector;
  } else {
    return htmlElementPrototype.matches;
  }
}

export type VendorMatchesFunctionName = 'webkitMatchesSelector' | 'msMatchesSelector';
export type MatchesFunctionName = VendorMatchesFunctionName | 'matches';

export function getMatchesProperty(htmlElementPrototype: {}): MatchesFunctionName {
  /**
   * Order is important because we return the first existing method we find.
   * Do not change the order of the items in the below array.
   */

  const matchesMethods: MatchesFunctionName[] = ['matches', 'webkitMatchesSelector', 'msMatchesSelector'];
  let method: MatchesFunctionName = 'matches';
  for (const matchesMethod of matchesMethods) {
    if (matchesMethod in htmlElementPrototype) {
      method = matchesMethod;
      break;
    }
  }

  return method;
}

export function getNormalizedEventCoords(
    ev: Event | undefined, pageOffset: Point, clientRect: ClientRect): Point {
  if (!ev) {
    return {x: 0, y: 0};
  }
  const {x, y} = pageOffset;
  const documentX = x + clientRect.left;
  const documentY = y + clientRect.top;

  let normalizedX;
  let normalizedY;
  // Determine touch point relative to the ripple container.
  if (ev.type === 'touchstart') {
    const e = ev as TouchEvent;
    normalizedX = e.changedTouches[0].pageX - documentX;
    normalizedY = e.changedTouches[0].pageY - documentY;
  } else {
    const e = ev as MouseEvent;
    normalizedX = e.pageX - documentX;
    normalizedY = e.pageY - documentY;
  }
  if (normalizedX === undefined || normalizedY === undefined) {
    throw new Error('Event coordinates not defined');
  }

  return {x: normalizedX, y: normalizedY};
}
