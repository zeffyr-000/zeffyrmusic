Write a Vitest unit test for a `VolumeControlComponent` that manages audio volume.

The component has:

- `readonly playerStore = inject(PlayerStore)` — Signal Store with `volume()`, `isMuted()`, `isSilent()` signals
- `readonly playerService = inject(PlayerService)` — service with `updateVolume(n)` and `toggleMute()` methods
- A `volumeIcon` computed signal that returns 'volume_off' if muted, 'volume_down' if < 50, 'volume_up' otherwise
- An `onVolumeChange(event: Event)` method that reads the input range value and calls `playerService.updateVolume()`
- A `toggleMute()` method that calls `playerService.toggleMute()`

Requirements:

- Use Vitest (`describe`, `it`, `expect`, `vi`)
- Use `vi.fn()` for mocking service methods
- Test signal values with function call syntax: `expect(component.volumeIcon()).toBe('volume_up')`
- Mock the Signal Store signals as functions returning values
- Test all volume icon states (off, down, up)
- Test that `onVolumeChange` calls the service with correct value
- Test that `toggleMute` delegates to the service
- Do NOT use Jasmine or Jest syntax
