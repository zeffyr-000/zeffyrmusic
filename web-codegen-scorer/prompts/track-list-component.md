Create an Angular component called `TrackListComponent` that displays a list of music tracks.

Requirements:

- The component receives a `tracks` input (array of `Video` objects with fields: `id_video`, `titre`, `artiste`, `duree`, `key`)
- The component receives a `isLoading` input (boolean)
- When loading, show a skeleton loader placeholder
- When the list is empty and not loading, show an empty state with a Material Icon `queue_music` and a transloco-translated message
- Each track shows: title, artist, and duration formatted as "m:ss"
- Clicking a track emits an `onPlay` output with the track index
- Use OnPush change detection
- Use modern Angular control flow (`@if`, `@for`, `@empty`)
- Use `input()` and `output()` functions, not decorators
- Use Bootstrap utility classes for layout
- All static UI text (empty states, headings, aria-labels, button labels, etc.) must use the `transloco` pipe for i18n; dynamic track data (`titre`, `artiste`, `duree`) should be rendered directly without Transloco
