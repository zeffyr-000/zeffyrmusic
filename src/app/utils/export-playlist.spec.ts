import { describe, it, expect } from 'vitest';
import { formatPlaylistAsCsv, formatPlaylistAsText } from './export-playlist';
import { Video } from '../models/video.model';

function makeVideo(overrides: Partial<Video> = {}): Video {
  return {
    id_video: '1',
    artiste: 'Artist Name',
    artists: [],
    duree: '210',
    id_playlist: 'p1',
    key: 'dQw4w9WgXcQ',
    ordre: '1',
    titre: 'Song Title',
    titre_album: 'Album',
    ...overrides,
  };
}

describe('formatPlaylistAsCsv', () => {
  it('should generate CSV with BOM and correct headers', () => {
    const tracks = [makeVideo()];
    const csv = formatPlaylistAsCsv(tracks);

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('Title,Artist,Duration,YouTube URL');
  });

  it('should format track data correctly', () => {
    const tracks = [
      makeVideo({ titre: 'My Song', artiste: 'My Artist', duree: '125', key: 'abc123' }),
    ];
    const csv = formatPlaylistAsCsv(tracks);
    const lines = csv.split('\n');

    expect(lines[1]).toBe('My Song,My Artist,2:05,https://www.youtube.com/watch?v=abc123');
  });

  it('should escape fields containing commas', () => {
    const tracks = [makeVideo({ titre: 'Hello, World', artiste: 'Artist' })];
    const csv = formatPlaylistAsCsv(tracks);

    expect(csv).toContain('"Hello, World"');
  });

  it('should escape fields containing double quotes', () => {
    const tracks = [makeVideo({ titre: 'Say "Hi"', artiste: 'Artist' })];
    const csv = formatPlaylistAsCsv(tracks);

    expect(csv).toContain('"Say ""Hi"""');
  });

  it('should handle empty playlist', () => {
    const csv = formatPlaylistAsCsv([]);

    expect(csv).toBe('\uFEFFTitle,Artist,Duration,YouTube URL');
  });

  it('should handle multiple tracks', () => {
    const tracks = [
      makeVideo({ titre: 'Song A', key: 'aaa' }),
      makeVideo({ titre: 'Song B', key: 'bbb' }),
    ];
    const csv = formatPlaylistAsCsv(tracks);
    const lines = csv.split('\n');

    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('Song A');
    expect(lines[2]).toContain('Song B');
  });

  it('should neutralize formula injection prefixes', () => {
    const tracks = [makeVideo({ titre: '=SUM(A1)', artiste: '+cmd' })];
    const csv = formatPlaylistAsCsv(tracks);

    expect(csv).not.toContain(',=SUM');
    expect(csv).not.toContain(',+cmd');
    expect(csv).toContain("'=SUM(A1)");
    expect(csv).toContain("'+cmd");
  });

  it('should neutralize - and @ formula prefixes', () => {
    const tracks = [makeVideo({ titre: '-1+1', artiste: '@import' })];
    const csv = formatPlaylistAsCsv(tracks);

    expect(csv).toContain("'-1+1");
    expect(csv).toContain("'@import");
  });

  it('should neutralize formula prefix even when field also contains comma', () => {
    const tracks = [makeVideo({ titre: '=SUM(1,2)' })];
    const csv = formatPlaylistAsCsv(tracks);

    expect(csv).toContain('"\'=SUM(1,2)"');
    expect(csv).not.toMatch(/[^']=[A-Z]/);
  });

  it('should escape fields containing carriage return', () => {
    const tracks = [makeVideo({ titre: 'Line1\r\nLine2' })];
    const csv = formatPlaylistAsCsv(tracks);

    expect(csv).toContain('"Line1\r\nLine2"');
  });
});

describe('formatPlaylistAsText', () => {
  it('should format as "Artist - Title" per line', () => {
    const tracks = [
      makeVideo({ artiste: 'Daft Punk', titre: 'Around the World' }),
      makeVideo({ artiste: 'Gorillaz', titre: 'Feel Good Inc.' }),
    ];
    const text = formatPlaylistAsText(tracks);

    expect(text).toBe('Daft Punk - Around the World\nGorillaz - Feel Good Inc.');
  });

  it('should return empty string for empty playlist', () => {
    expect(formatPlaylistAsText([])).toBe('');
  });

  it('should handle single track', () => {
    const tracks = [makeVideo({ artiste: 'Artist', titre: 'Title' })];

    expect(formatPlaylistAsText(tracks)).toBe('Artist - Title');
  });
});
