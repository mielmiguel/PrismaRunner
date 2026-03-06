import { Howl, Howler } from 'howler'
import { createLogger } from '../utils/Logger'
import { MUTE_STORAGE_KEY } from './constants'
import { AUDIO_VOLUMES, MUSIC_SRC, SFX_PATHS as SFX_PATHS_CONFIG } from './audioConfig'

const log = createLogger('AudioManager')

export type SFXName = 'jump' | 'coin' | 'multiplier' | 'crash' | 'ui_click'

function loadMuted(): boolean {
  try {
    const s = localStorage.getItem(MUTE_STORAGE_KEY)
    return s === 'true'
  } catch {
    return false
  }
}

function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_STORAGE_KEY, String(muted))
  } catch {
    /* ignore */
  }
}

/** Resume suspended AudioContext on first user gesture. Call before playMusic(). */
async function resumeAudioContext(): Promise<void> {
  const ctx = (Howler as unknown as { ctx?: AudioContext }).ctx
  if (ctx?.state === 'suspended') {
    await ctx.resume()
    log.info('audio context: suspended → running')
  }
}

export class AudioManager {
  private music: Howl | null = null
  private sfx: Map<SFXName, Howl> = new Map()
  private muted = loadMuted()
  private musicStarted = false

  constructor() {
    this.initMusic()
    this.initSFX()
  }

  private initMusic(): void {
    this.music = new Howl({
      src: MUSIC_SRC,
      loop: true,
      volume: AUDIO_VOLUMES.music,
      mute: this.muted,
      onloaderror: (_id, err) => {
        log.error('audio load error: music', err)
      },
    })
  }

  private initSFX(): void {
    for (const [name, src] of Object.entries(SFX_PATHS_CONFIG)) {
      const howl = new Howl({
        src,
        volume: AUDIO_VOLUMES.sfx,
        mute: this.muted,
        onloaderror: (_id, err) => {
          log.error(`audio load error: ${name}`, err)
        },
      })
      this.sfx.set(name as SFXName, howl)
    }
  }

  /** Call on first user gesture (e.g. Play click). Resumes AudioContext then starts music. */
  async playMusic(): Promise<void> {
    if (this.muted) return
    await resumeAudioContext()
    if (!this.music) return
    if (this.musicStarted) {
      this.music.play()
      return
    }
    this.music.play()
    this.musicStarted = true
    log.info('music started')
  }

  stopMusic(): void {
    this.music?.stop()
  }

  playSFX(name: SFXName): void {
    if (this.muted) return
    const howl = this.sfx.get(name)
    if (!howl) return
    howl.play()
    log.info(`sfx played: ${name}`)
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    saveMuted(muted)
    if (this.music) {
      this.music.mute(muted)
    }
    for (const howl of this.sfx.values()) {
      howl.mute(muted)
    }
  }

  isMuted(): boolean {
    return this.muted
  }
}
