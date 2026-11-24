# Editing campaigns in the canvas

Two ways to edit a Build campaign:

- **Preview in chat.** For a quick change: on a draft it opens the short field list in Chat, and on a ready campaign it opens the setup review. Fix links and the campaign title do the same.
- **Edit in canvas.** For a new campaign or a deeper edit, *Edit in canvas* (on each Build card, in the chat form and in the launch review) opens the full editor.
- **Launch campaign** is unchanged.

One editor renders every ad platform from a schema, so adding a platform is a data change, not a UI change.

## How the canvas editor is organized

Platform setup screens (LinkedIn Campaign Manager, Reddit Ads) are one long form where every field has the same weight. Mojo has already filled almost everything in, so the canvas is a review, not a form:

- **Each section is a card that reads as one sentence** ("Director, VP and CXO in Finance and IT at 412 accounts"). Only sections that need the marketer open by default.
- **The primary button names the next step**: "Fix 1 thing →" jumps to it. When nothing is left it becomes "Launch campaign →".
- **The readiness row** ("4 of 5 ready") doubles as section navigation.
- **"Mojo picked"** marks a default the marketer hasn't changed, with Mojo's reason on hover.
- **The preview is clickable.** Clicking the headline in the ad jumps to the headline field, and the focused field is outlined in the preview.
- **Budget math, not forecasts.** The budget summary does arithmetic on what was entered (per day, per account). It doesn't invent reach estimates.
- **Small moments.** A section's check pops when its last fix lands. "Ready to launch" appears once, and the Launch button arrives with a small bounce. All motion respects reduced-motion settings.

## Files

| File | Job |
| --- | --- |
| `mojo-ad-platforms.js` | Platform registry: shared fields, one `register({...})` per platform, validation, previews |
| `mojo-canvas-editor.js` / `.css` | Generic canvas editor. No platform-specific code |
| `mojo-build-journey.js` | Build list and the quick chat form. Adds the *Edit in canvas* entry points. Mojo QA includes each platform's rules |

Deep link: `CampaignLifecycle.html?view=build#edit=<campaign id>&field=<field key>`

## How it fits together

- **Carried-over fields** (accounts, creative concept, core message, assets, landing page, tracking, budget, flight, conversion, budget approval) are defined once in `core` and reused by every platform, sometimes relabeled (Google calls the landing page "Final URL"). They are stored on the campaign and carried over by **Copy to another platform**.
- **Platform fields** (LinkedIn job functions, Google headlines, Demandbase pacing...) are stored under `draft.platformFields[platformId]`.
- **Defaults** are Mojo's first pass. The marketer reviews and edits; nothing has to be typed from scratch.
- **QA** comes from the same field rules (`required`, `minItems`, `max`, `validate`). The editor, the Build list status and the "To finish QA" text all use them.
- **Saving** is automatic (debounced). Status flips between Draft and Ready as fields change.

## Add a platform

Add one `register` call at the end of `mojo-ad-platforms.js`. Example for Meta Ads:

```js
MojoAdPlatforms.register({
  id: 'meta',
  name: 'Meta Ads',
  match: /Meta|Facebook|Instagram/i,   // matched against the campaign's channel name
  logo: 'assets/meta.svg',
  structure: ['Campaign', 'Ad set', 'Ad'],
  structureValues: (draft, values, ctx) => [ctx.title, values.audience, values.meta_format],
  sections: [
    {id: 'audience', title: 'Audience', fields: [
      MojoAdPlatforms.use(MojoAdPlatforms.core.audience, {label: 'Custom audience'}),
      {key: 'meta_placements', label: 'Placements', kind: 'chips', required: true, minItems: 1,
       options: ['Facebook feed', 'Instagram feed', 'Stories', 'Reels'], default: ['Facebook feed', 'Instagram feed']}
    ]},
    {id: 'ad', title: 'Ad', fields: [
      {key: 'meta_format', label: 'Format', kind: 'select', required: true, options: ['Single image', 'Carousel', 'Video'], default: 'Single image'},
      MojoAdPlatforms.use(MojoAdPlatforms.core.assets, {maxItems: 1}),
      {key: 'meta_primary', label: 'Primary text', kind: 'textarea', required: true, recommend: 125,
       default: ({facts}) => facts.messaging},
      MojoAdPlatforms.use(MojoAdPlatforms.core.landing)
    ]},
    {id: 'budget', title: 'Budget and schedule', fields: [
      MojoAdPlatforms.core.budget, MojoAdPlatforms.core.flight, MojoAdPlatforms.core.budgetApproved
    ]},
    {id: 'tracking', title: 'Tracking and measurement', fields: [
      MojoAdPlatforms.core.tracking, MojoAdPlatforms.core.conversion
    ]}
  ],
  preview: (values, h) => `<div>${h.escape(values.meta_primary)}</div>`
});
```

The platform then appears in the editor, in **Run on another platform**, and in Mojo QA. No other file changes.

### Section and preview options

- `summary: (values, h) => html`: the sentence shown when the section is closed. `h` has `b()` (bold, escaped), `join()`, `host()`, `path()`, `spend()` and `escape()`.
- `why` on a field: Mojo's reason for its default, shown with the "Mojo picked" tag.
- In `preview`, add `data-edit-field="<field key>"` to any element to make it click-to-edit.

### Field kinds

`text`, `textarea`, `url`, `money`, `select`, `chips` (multi-select), `tags` (free-form list such as keywords), `list` (repeatable inputs with a per-item limit such as headlines), `toggle`, `assets` (creative picker).

### Field options

`required` (boolean or `values => boolean`), `showIf`, `max` (hard limit, blocks launch), `recommend` (soft guidance), `minItems`, `maxItems`, `itemMax`, `options`, `default` (value or `ctx => value`), `validate`, `help`, `placeholder`, `shared`.

## For the real build

- Field names and limits approximate each platform's setup. Confirm them against each platform's API before relying on them.
- Replace sample defaults with values from connected data: audience sizes from Audiences, assets from the brand library, conversions from the CRM.
- The registry shape maps to a server-side schema, which lets the agent, the editor and the launch API share one definition.
