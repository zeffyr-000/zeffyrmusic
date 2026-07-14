/**
 * Shared test data fixtures.
 *
 * Prefer these factories over inline object literals repeated across specs.
 * Each factory returns a fresh object so tests cannot mutate shared state.
 */
import type { Video } from '../models/video.model';

export function createMockVideo(overrides: Partial<Video> = {}): Video {
  return {
    id_video: 'v1',
    key: 'k1',
    titre: 'Song 1',
    duree: '180',
    artiste: 'A1',
    artists: [{ label: 'A1', id_artist: '' }],
    id_playlist: 'p1',
    ordre: '1',
    titre_album: 'Album 1',
    ...overrides,
  };
}

export function createMockVideos(count: number): Video[] {
  return Array.from({ length: count }, (_, i) =>
    createMockVideo({
      id_video: `v${i + 1}`,
      key: `k${i + 1}`,
      titre: `Song ${i + 1}`,
      artiste: `A${i + 1}`,
      artists: [{ label: `A${i + 1}`, id_artist: '' }],
      ordre: `${i + 1}`,
    })
  );
}
