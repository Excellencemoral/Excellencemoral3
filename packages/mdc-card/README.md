<!--docs:
title: "Cards"
layout: detail
section: components
excerpt: "Cards for displaying content composed of different elements."
iconId: card
path: /catalog/cards/
-->

# Cards

<!--<div class="article__asset">
  <a class="article__asset-link"
     href="https://material-components-web.appspot.com/card.html">
    <img src="{{ site.rootpath }}/images/mdc_web_screenshots/cards.png" width="328" alt="Cards screenshot">
  </a>
</div>-->

MDC Card is a component that implements the
[Material Design card component](https://material.io/guidelines/components/cards.html), and makes it available to
developers as a set of CSS classes.

## Design & API Documentation

<ul class="icon-list">
  <li class="icon-list-item icon-list-item--spec">
    <a href="https://material.io/guidelines/components/cards.html">Material Design guidelines: Cards</a>
  </li>
  <li class="icon-list-item icon-list-item--link">
    <a href="https://material-components-web.appspot.com/card.html">Demo</a>
  </li>
</ul>

## Installation

```
npm install --save @material/card
```

## Usage

### HTML Structure

```html
<div class="mdc-card">
  Simple
</div>
```

Fully-featured:

```html
<div class="mdc-card">
  <div class="mdc-card__media mdc-card__media--square">
    <div class="mdc-card__media-content">Title</div>
  </div>
  <div class="mdc-card__action-bar">
    <div class="mdc-card__action-buttons">
      <div class="mdc-button mdc-card__action">Action 1</div>
      <div class="mdc-button mdc-card__action">Action 2</div>
    </div>
    <div class="mdc-card__action-icons">
      <i class="material-icons mdc-card__action" role="button" title="Share">share</i>
      <i class="material-icons mdc-card__action" role="button" title="More">more_vert</i>
    </div>
  </div>
</div>
```

Cards don't come with a predefined width, height, padding, or margin. In its simplest form (just a single element with
`mdc-card`), a card is basically just `mdc-elevation` + `border-radius`.

Cards expand horizontally to fill all available space, and vertically to fit their contents.

If you'd like to maintain a consistent width and height across cards, you'll need to set it in your styles:

```css
.my-card {
  height: 350px;
  width: 350px;
}
```

#### Content blocks

Cards are composed of different content blocks, which are typically laid out vertically.

Because every app is different, there are no "standard" layouts for card content; each app should define their own.

However, MDC Card _does_ provide styles for two common card elements: _rich media_ (images or video) and _action bars_.

##### Rich media

```css
.my-card__media {
  background-image: url("pretty.jpg");
}
```

```html
<section class="my-card__media mdc-card__media mdc-card__media--16-9">
  <div class="mdc-card__media-content">Title</div>
</section>
```

This area is used for showing rich media in cards, and optionally as a container. Use the `mdc-card__media` CSS class
and the optional modifier classes shown below.

##### Actions

```html
<section class="mdc-card__action-bar">
  <button class="mdc-button mdc-card__action">Action 1</button>
  <button class="mdc-button mdc-card__action">Action 2</button>
</section>
```

This area is used for showing different actions the user can take. It's typically used with buttons, as in the example
above, or with icon buttons, as below:

```html
<div class="mdc-card__action-bar">
  <div class="mdc-card__action-buttons">
    <button class="mdc-button mdc-card__action">Read</button>
    <button class="mdc-button mdc-card__action">Bookmark</button>
  </div>
  <div class="mdc-card__action-icons">
    <i class="mdc-icon-toggle material-icons mdc-card__action mdc-card__action--icon"
       tabindex="0"
       role="button"
       aria-pressed="false"
       aria-label="Add to favorites"
       title="Add to favorites"
       data-toggle-on='{"content": "favorite", "label": "Remove from favorites"}'
       data-toggle-off='{"content": "favorite_border", "label": "Add to favorites"}'>
      favorite_border
    </i>
    <button class="mdc-button mdc-card__action mdc-card__action--icon" title="Share">
      <i class="material-icons" role="presentation">share</i>
    </button>
    <button class="mdc-button mdc-card__action mdc-card__action--icon" title="More options">
      <i class="material-icons" role="presentation">more_vert</i>
    </button>
  </div>
</div>
```

Be sure to include the `mdc-card__action` class on every action for correct positioning. In addition, icon actions
should use the `mdc-card__action--icon` class.

To have a single action button take up the entire width of the action bar, use the `--full-bleed` modifier:

```html
<div class="mdc-card__action-bar mdc-card__action-bar--full-bleed">
  <a class="mdc-button mdc-card__action" href="javascript:">
    <span>All Business Headlines</span>
    <i class="material-icons">arrow_forward</i>
  </a>
</div>
```

### CSS Classes

CSS Class | Description
--- | ---
`mdc-card` | A card
`mdc-card__media` | Media area that displays a custom `background-image` with `background-size: cover`
`mdc-card__media--square` | Automatically scales the media area's height to equal its width
`mdc-card__media--16-9` | Automatically scales the media area's height according to its width, maintaining a 16:9 aspect ratio
`mdc-card__media-content` | An absolutely-positioned box the same size as the media area, for displaying a title or icon on top of the `background-image`
`mdc-card__action-bar` | Row of primary and supplemental actions
`mdc-card__action-bar--full-bleed` | Eliminates the action bar's padding padding, and causes its child `mdc-card__action` to consume 100% of the action bar's width
`mdc-card__action-buttons` | A group of action buttons, displayed on the left side of the card (in LTR), adjacent to `mdc-card__action-icons`
`mdc-card__action-icons` | A group of supplemental action icons, displayed on the right side of the card (in LTR), adjacent to `__action-buttons`
`mdc-card__action` | An individual action button or icon
`mdc-card__action--icon` | An icon action

### Sass Mixins


Mixin | Description
--- | ---
`mdc-card-fill-color($color)` | Sets the fill color of a `mdc-card`
`mdc-card-media-aspect-ratio($width-unitless, $height-unitless)` | Automatically sets the height of the `mdc-card__media` subelement to maintain a given aspect ratio based on its width
`mdc-card-corner-radius($radius)` | Sets the corner radius of a card

