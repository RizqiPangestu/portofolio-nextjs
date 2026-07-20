/**
 * Background audio config.
 *
 * Drop the main mp3 file into `public/untuk-nia/audio/` and point `src` to it.
 *
 * Autoplay strategy
 * -----------------
 * Modern browsers block unmuted autoplay. To play "automatically without user
 * interaction" the AudioProvider starts the main audio MUTED (allowed by every
 * browser), then unmutes on the very first pointer/key/touch event anywhere on
 * the page. There's no play/pause/mute UI by design — the user is not given a
 * way to silence it.
 *
 * Set `enabled: false` while developing if the music is in the way.
 */
export const audioConfig = {
  enabled: true,
  src: "/untuk-nia/audio/main-sound.mp3",
  volume: 1,
  loop: true,
};
