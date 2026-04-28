import { Video } from '../models/video.model';
import { formatTime } from './format-time';

const YOUTUBE_BASE_URL = 'https://www.youtube.com/watch?v=';

const FORMULA_PREFIXES = ['=', '+', '-', '@'];

/** Escapes a CSV field: handles commas, quotes, line breaks, and formula injection. */
function escapeCsvField(value: string): string {
  let escaped = FORMULA_PREFIXES.some(p => value.trimStart().startsWith(p)) ? `'${value}` : value;
  if (/[",\r\n]/.test(escaped)) {
    escaped = `"${escaped.replaceAll('"', '""')}"`;
  }
  return escaped;
}

/**
 * Formats a playlist as a CSV string with UTF-8 BOM for Excel compatibility.
 * Columns: Title, Artist, Duration, YouTube URL.
 * Compatible with TuneMyMusic and Soundiiz import.
 */
export function formatPlaylistAsCsv(tracks: Video[]): string {
  const header = 'Title,Artist,Duration,YouTube URL';
  const rows = tracks.map(track => {
    const title = escapeCsvField(track.titre);
    const artist = escapeCsvField(track.artiste);
    const duration = formatTime(+track.duree);
    const url = `${YOUTUBE_BASE_URL}${track.key}`;
    return `${title},${artist},${duration},${url}`;
  });
  const body = rows.length > 0 ? `\n${rows.join('\n')}` : '';
  return `\uFEFF${header}${body}`;
}

/**
 * Formats a playlist as a plain text list: "Artist - Title", one per line.
 * Useful for clipboard copy and TuneMyMusic free-text import.
 */
export function formatPlaylistAsText(tracks: Video[]): string {
  return tracks.map(track => `${track.artiste} - ${track.titre}`).join('\n');
}
