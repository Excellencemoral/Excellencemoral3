<!--docs:
title: "Sliders"
layout: detail
section: components
excerpt: "A select over a range of values by moving the slider thumb."
iconId: slider
path: /catalog/input-controls/sliders/
-->

# Slider

<!--<div class="article__asset">
  <a class="article__asset-link"
     href="https://material-components.github.io/material-components-web-catalog/#/component/slider">
    <img src="{{ site.rootpath }}/images/mdc_web_screenshots/slider.png" width="400" alt="Select screenshot">
  </a>
</div>-->

Sliders allow users to make selections from a range of values.

## Design and API Documentation

<ul class="icon-list">
  <li class="icon-list-item icon-list-item--spec">
    <a href="https://material.io/go/design-sliders">Material Design guidelines: Sliders</a>
  </li>
  <li class="icon-list-item icon-list-item--link">
    <a href="https://material-components.github.io/material-components-web-catalog/#/component/slider">Demo</a>
  </li>
</ul>

## Installation

```
npm install @material/slider
```

## Basic Usage

### HTML Structure

```html
<div class="mdc-slider" tabindex="0" role="slider"
     aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"
     aria-label="Select Value">
  <div class="mdc-slider__track">
    <div class="mdc-slider__track-fill"></div>
  </div>
  <div class="mdc-slider__thumb">
    <svg class="mdc-slider__thumb-handle" width="24" height="24">
      <circle cx="12" cy="12" r="6"></circle>
    </svg>
  </div>
</div>
```

### Styles

```scss
@import "@material/slider/mdc-slider";
```

### JavaScript Instantiation

```js
import {MDCSlider} from '@material/slider';

const slider = new MDCSlider(document.querySelector('.mdc-slider'));
```

## Variants

### Continuous Slider

Use continuous sliders allow users to make meaningful selections that don’t require a specific value. Continuous Slider is the default variant.

### Initializing the slider with custom ranges/values

When `MDCSlider` is initialized, it reads the element's `aria-valuemin`, `aria-valuemax`, and
`aria-valuenow` values if present and uses them to set the component's `min`, `max`, and `value`
properties. This means you can use these attributes to set these values for the slider within the
DOM.

```html
<div class="mdc-slider" tabindex="0" role="slider"
     aria-valuemin="-5" aria-valuemax="50" aria-valuenow="10"
     aria-label="Select Value">
  <!-- ... -->
</div>
```

## Style Customization

### CSS Classes

CSS Class | Description
--- | ---
`mdc-slider` | Mandatory.
`mdc-slider__track` | Mandatory. Element containing the track-fill.
`mdc-slider__track-fill` | Mandatory. The fill element to display where the value is.
`mdc-slider__thumb` | Mandatory. Element containing the thumb-handle.
`mdc-slider__thumb-handle` | Mandatory. The handle element to display where the value is.

### Sass Mixins

Mixin | Description
--- | ---
`mdc-slider-track-color($color)` | Customizes the color of the track for the slider
`mdc-slider-track-fill-color($color)` | Customizes the color of the track-fill for the slider
`mdc-slider-thumb-color($color)` | Customizes the color of the thumb for the slider

## `MDCSlider` Properties and Methods

| Property | Value Type | Description |
| --- | --- | --- |
| `value` | `number` | The current value of the slider. Changing this will update the slider's value. |
| `min` | `number` | The minimum value a slider can have. Values set programmatically will be clamped to this minimum value. Changing this property will update the slider's value if it is lower than the new minimum |
| `max` | `number` | The maximum value a slider can have. Values set programmatically will be clamped to this maximum value. Changing this property will update the slider's value if it is greater than the new maximum |
| `step` | `number` | The current step value of the slider. Changing this will update the slider's layout. |

| Method Signature | Description |
| --- | --- |
| `layout() => void` | Recomputes the dimensions and re-lays out the component. This should be called if the dimensions of the slider itself or any of its parent elements change programmatically (it is called automatically on resize). |

### Additional Information

`MDCSlider` emits a `MDCSlider:input` custom event from its root element whenever the slider value
is changed by way of a user event, e.g. when a user is dragging the slider or changing the value
using the arrow keys. The `detail` property of the event is set to the slider instance that was
affected.

`MDCSlider` emits a `MDCSlider:change` custom event from its root element whenever the slider value
is changed _and committed_ by way of a user event, e.g. when a user stops dragging the slider or
changes the value using the arrow keys. The `detail` property of the event is set to the slider
instance that was affected.

## Usage within Web Frameworks

### `MDCSliderAdapter`

| Method Signature | Description |
| --- | --- |
| `hasClass(className: string) => boolean` | Checks if `className` exists on the root element |
| `addClass(className: string) => void` | Adds a class `className` to the root element |
| `removeClass(className: string) => void` | Removes a class `className` from the root element |
| `setThumbAttribute(name: string, value: string) => void` | Sets an attribute `name` to the value `value` on the thumb element. |
| `computeBoundingRect() => ClientRect` | Computes and returns the bounding client rect for the root element. Our implementations calls `getBoundingClientRect()` for this. |
| `eventTargetHasClass(target: EventTarget, className: string) => boolean` | Returns true if target has className, false otherwise |
| `registerEventHandler(type: string, handler: EventListener) => void` | Adds an event listener `handler` for event type `type` to the slider's root element |
| `deregisterEventHandler(type: string, handler: EventListener) => void` | Removes an event listener `handler` for event type `type` from the slider's root element |
| `registerBodyEventHandler(type: string, handler: EventListener) => void` | Adds an event listener `handler` for event type `type` to the `<body>` element of the slider's document |
| `deregisterBodyEventHandler(type: string, handler: EventListener) => void` | Removes an event listener `handler` for event type `type` from the `<body>` element of the slider's document |
| `registerResizeHandler(handler: EventListener) => void` | Adds an event listener `handler` that is called when the component's viewport resizes, e.g. `window.onresize`. |
| `deregisterResizeHandler(handler: EventListener) => void` | Removes an event listener `handler` that was attached via `registerResizeHandler`. |
| `notifyInput() => void` | Broadcasts an "MDCSlider:input" event notifying clients that the slider's value is currently being changed. The implementation should choose to pass along any relevant information pertaining to this event. In our case we pass along the instance of the component for which the event is triggered for. |
| `notifyChange() => void` | Broadcasts a "MDCSlider:change" event notifying clients that a change to the slider's value has been committed by the user. Similar guidance applies here as for `notifyInput()`. |
| `setThumbStyleProperty(propertyName: string, value: string) => void` | Sets a dash-cased style property `propertyName` to the given `value` on the thumb element. |
| `setTrackFillStyleProperty(propertyName: string, value: string) => void` | Sets a dash-cased style property `propertyName` to the given `value` on the track-fill element. |
| `focusThumb() => void` | Sets the document focus to the thumb. |
| `activateRipple() => void` | Activates the ripple on the thumb element. |
| `deactivateRipple() => void` | Deativates the ripple on the thumb element. |
| `isRTL() => boolean` | True if the slider is within an RTL context, false otherwise. |

### `MDCSliderFoundation`

| Method Signature | Description |
| --- | --- |
| `layout() => void` | Same as layout() detailed within the component methods table. Does the majority of the work; the component's layout method simply proxies to this. |
| `getValue() => number` | Returns the current value of the slider |
| `setValue(value: number) => void` | Sets the current value of the slider |
| `getMax() => number` | Returns the max value the slider can have |
| `setMax(max: number) => void` | Sets the max value the slider can have |
| `getMin() => number` | Returns the min value the slider can have |
| `setMin(min: number) => number` | Sets the min value the slider can have |
| `getStep() => number` | Returns the step value of the slider |
| `setStep(step: number) => number` | Sets the step value of the slider |
