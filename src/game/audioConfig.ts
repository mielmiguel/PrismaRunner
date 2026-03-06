/**
 * S7 [Designer] — audio asset paths for AudioManager.
 * Placeholder: .wav from generate-audio-placeholders.
 * Production: replace with .mp3 + .ogg (add both to each src array).
 */
import { MUSIC_VOLUME, SFX_VOLUME } from './constants'

const AUDIO_BASE = '/audio'

/** Howler src array: prefers mp3/ogg, falls back to wav placeholder */
export const MUSIC_SRC: string[] = [
  `${AUDIO_BASE}/music.mp3`,
  `${AUDIO_BASE}/music.ogg`,
  `${AUDIO_BASE}/music.wav`,
]

/** SFX names for playSFX(name) — must match keys */
export type SFXName = 'jump' | 'coin' | 'multiplier' | 'crash' | 'ui_click'

export const SFX_PATHS: Record<SFXName, string[]> = {
  jump: [`${AUDIO_BASE}/sfx/jump.mp3`, `${AUDIO_BASE}/sfx/jump.ogg`, `${AUDIO_BASE}/sfx/jump.wav`],
  coin: [`${AUDIO_BASE}/sfx/coin.mp3`, `${AUDIO_BASE}/sfx/coin.ogg`, `${AUDIO_BASE}/sfx/coin.wav`],
  multiplier: [`${AUDIO_BASE}/sfx/multiplier.mp3`, `${AUDIO_BASE}/sfx/multiplier.ogg`, `${AUDIO_BASE}/sfx/multiplier.wav`],
  crash: [`${AUDIO_BASE}/sfx/crash.mp3`, `${AUDIO_BASE}/sfx/crash.ogg`, `${AUDIO_BASE}/sfx/crash.wav`],
  ui_click: [`${AUDIO_BASE}/sfx/ui_click.mp3`, `${AUDIO_BASE}/sfx/ui_click.ogg`, `${AUDIO_BASE}/sfx/ui_click.wav`],
}


export const AUDIO_VOLUMES = { music: MUSIC_VOLUME, sfx: SFX_VOLUME }
