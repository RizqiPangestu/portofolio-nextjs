/**
 * Background audio config.
 *
 * The track URL (`src`) is configurable at runtime from the Google Sheet
 * "Config" tab via the `audio.src` key — see `NiaConfig.audio.src` in
 * `./config.ts`. Everything else stays here as a build-time constant.
 *
 * Autoplay strategy
 * -----------------
 * Modern browsers block unmuted autoplay, so playback only starts after the
 * user taps the loading screen (that tap is the required user gesture). There's
 * no play/pause/mute UI by design.
 *
 * Set `enabled: false` while developing if the music is in the way.
 */
/** A playable audio source with optional volume/loop settings. */
export type AudioConfig = {
  src: string;
  volume?: number;
  loop?: boolean;
};

/** Public folder that holds the audio files. */
export const AUDIO_DIR = "/untuk-nia/audio/";

/**
 * Resolve a configured `audio.src` into a full public path.
 *
 * The config stores a file name only (e.g. "main-sound.mp3"); this prepends
 * `AUDIO_DIR`. Absolute paths ("/...") and full URLs ("http(s)://...") are
 * passed through unchanged so overrides can still point elsewhere if needed.
 */
function resolveAudioSrc(src: string): string {
  const s = (src ?? "").trim();
  if (!s) return s;
  if (/^https?:\/\//i.test(s) || s.startsWith("/")) return s;
  return `${AUDIO_DIR}${s.replace(/^\.?\/+/, "")}`;
}

/**
 * Build an `AudioConfig` from a raw file name (e.g. from a Sheet cell),
 * appending ".mp3" when no extension is present and resolving the full path via
 * `resolveAudioSrc`. Returns `undefined` for empty input.
 */
export function audioSrcFrom(
  raw: unknown,
  volume: number,
): AudioConfig | undefined {
  const file = String(raw ?? "").trim();
  if (!file) return undefined;
  const fileName = /\.[a-z0-9]+$/i.test(file) ? file : `${file}.mp3`;
  return { src: resolveAudioSrc(fileName), volume, loop: true };
}
