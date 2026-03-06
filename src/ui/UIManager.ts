import { createLogger } from '../utils/Logger'
import { showScreen, hideScreen, type ScreenId } from './screens'
import type { PlayerSkinId } from '../models/SkinFactory'
import { SKIN_STORAGE_KEY } from '../game/constants'
import { initSkinPreviews } from '../models/SkinPreview'
import type { AudioManager } from '../game/AudioManager'

const log = createLogger('UIManager')

const SCREEN_IDS: Record<ScreenId, string> = {
  MAIN_MENU: 'screen-main-menu',
  SKIN_SELECT: 'screen-skin-select',
  HUD: 'screen-hud',
  GAME_OVER: 'screen-game-over',
}

export type UIManagerOptions = {
  getBestScore: () => number
  onPlay: () => void | Promise<void>
  onRestart: () => void
  onMenu: () => void
  onSkinApply: (skinId: PlayerSkinId) => void
  getCurrentSkinId: () => PlayerSkinId
  audio?: AudioManager | null
}

export class UIManager {
  private readonly screens: Record<ScreenId, HTMLElement>
  private currentScreen: ScreenId | null = null
  private readonly opts: UIManagerOptions
  private skinPreviewsInited = false

  private readonly el: {
    menuBest: HTMLElement
    hudScore: HTMLElement
    hudMultiplier: HTMLElement
    gameOverScore: HTMLElement
    gameOverBest: HTMLElement
    gameOverNew: HTMLElement
  }

  constructor(options: UIManagerOptions) {
    this.opts = options

    const mainMenu = document.getElementById(SCREEN_IDS.MAIN_MENU)
    const skinSelect = document.getElementById(SCREEN_IDS.SKIN_SELECT)
    const hud = document.getElementById(SCREEN_IDS.HUD)
    const gameOver = document.getElementById(SCREEN_IDS.GAME_OVER)

    if (!mainMenu || !skinSelect || !hud || !gameOver) {
      throw new Error('UIManager: required screen elements not found')
    }

    this.screens = {
      MAIN_MENU: mainMenu,
      SKIN_SELECT: skinSelect,
      HUD: hud,
      GAME_OVER: gameOver,
    }

    const menuBest = document.getElementById('main-menu-best')
    const hudScore = document.getElementById('hud-score')
    const hudMultiplier = document.getElementById('hud-multiplier')
    const gameOverScore = document.getElementById('game-over-score')
    const gameOverBest = document.getElementById('game-over-best')
    const gameOverNew = document.getElementById('game-over-new')

    if (
      !menuBest ||
      !hudScore ||
      !hudMultiplier ||
      !gameOverScore ||
      !gameOverBest ||
      !gameOverNew
    ) {
      throw new Error('UIManager: required HUD/menu elements not found')
    }

    this.el = {
      menuBest,
      hudScore,
      hudMultiplier,
      gameOverScore,
      gameOverBest,
      gameOverNew,
    }

    this.bindButtons()
    this.bindSkinCards()
    this.updateSkinSelection(this.opts.getCurrentSkinId())
    if (this.opts.audio) {
      this.updateMuteButton(this.opts.audio.isMuted())
    }
    this.showScreen('MAIN_MENU')
    this.updateMenuBestScore()
    log.info('UIManager initialized')
  }

  private bindSkinCards(): void {
    const grid = document.getElementById('skin-grid')
    if (!grid) return
    const cards = grid.querySelectorAll<HTMLButtonElement>('.skin-card[data-skin-id]')
    for (const card of cards) {
      const skinId = card.dataset.skinId as PlayerSkinId
      if (!skinId || !['runner', 'tank', 'slim', 'cube'].includes(skinId)) continue
      card.addEventListener('click', () => {
        this.opts.audio?.playSFX('ui_click')
        this.handleSkinSelect(skinId)
      })
    }
  }

  private handleSkinSelect(skinId: PlayerSkinId): void {
    try {
      localStorage.setItem(SKIN_STORAGE_KEY, skinId)
    } catch {
      /* ignore */
    }
    this.opts.onSkinApply(skinId)
    this.updateSkinSelection(skinId)
  }

  private updateSkinSelection(skinId: PlayerSkinId): void {
    const grid = document.getElementById('skin-grid')
    if (!grid) return
    const cards = grid.querySelectorAll<HTMLButtonElement>('.skin-card[data-skin-id]')
    for (const card of cards) {
      const isSelected = card.dataset.skinId === skinId
      card.classList.toggle('skin-card--selected', isSelected)
      card.setAttribute('aria-pressed', String(isSelected))
    }
  }

  private bindButtons(): void {
    const btnPlay = document.getElementById('btn-play')
    const btnSkinSelect = document.getElementById('btn-skin-select')
    const btnSkinBack = document.getElementById('btn-skin-back')
    const btnPlayAgain = document.getElementById('btn-play-again')
    const btnShareX = document.getElementById('btn-share-x')
    const btnMenu = document.getElementById('btn-menu')
    const btnMute = document.getElementById('btn-mute')

    const uiClick = () => this.opts.audio?.playSFX('ui_click')

    btnPlay?.addEventListener('click', async () => {
      uiClick()
      await this.opts.onPlay()
    })
    btnSkinSelect?.addEventListener('click', () => {
      uiClick()
      this.updateSkinSelection(this.opts.getCurrentSkinId())
      this.showScreen('SKIN_SELECT')
      if (!this.skinPreviewsInited) {
        const grid = document.getElementById('skin-grid')
        if (grid) {
          initSkinPreviews(grid)
          this.skinPreviewsInited = true
        }
      }
    })
    btnSkinBack?.addEventListener('click', () => {
      uiClick()
      this.showScreen('MAIN_MENU')
    })
    btnPlayAgain?.addEventListener('click', () => {
      uiClick()
      this.opts.onRestart()
    })
    btnShareX?.addEventListener('click', () => {
      uiClick()
      this.handleShareX()
    })
    btnMenu?.addEventListener('click', () => {
      uiClick()
      this.opts.onMenu()
    })
    btnMute?.addEventListener('click', () => {
      const audio = this.opts.audio
      if (audio) {
        audio.setMuted(!audio.isMuted())
        this.updateMuteButton(audio.isMuted())
      }
    })
  }

  private updateMuteButton(muted: boolean): void {
    const btn = document.getElementById('btn-mute')
    if (!btn) return
    btn.setAttribute('aria-label', muted ? 'Unmute' : 'Mute')
    btn.setAttribute('title', muted ? 'Unmute' : 'Mute')
    btn.textContent = muted ? '🔇' : '🔊'
    btn.classList.toggle('mute-btn--muted', muted)
  }

  showScreen(id: ScreenId, onTransitionEnd?: () => void): void {
    const el = this.screens[id]
    const from = this.currentScreen
    if (from) {
      hideScreen(this.screens[from])
    }
    showScreen(el, from, id, onTransitionEnd)
    this.currentScreen = id
    el.setAttribute('aria-hidden', 'false')
    if (from) {
      this.screens[from].setAttribute('aria-hidden', 'true')
    }
  }

  hideScreen(id: ScreenId): void {
    const el = this.screens[id]
    hideScreen(el)
    el.setAttribute('aria-hidden', 'true')
    if (this.currentScreen === id) {
      this.currentScreen = null
    }
  }

  /** Hide overlay screens and show HUD (transition to PLAYING). */
  goToPlaying(): void {
    const from = this.currentScreen
    if (from) {
      hideScreen(this.screens[from])
      this.screens[from].setAttribute('aria-hidden', 'true')
      this.currentScreen = null
    }
    this.showHUD(true)
  }

  /** Show main menu and hide HUD (from Game Over Menu button). */
  goToMenu(): void {
    this.showHUD(false)
    this.showScreen('MAIN_MENU')
    this.updateMenuBestScore()
  }

  showHUD(visible: boolean): void {
    const el = this.screens.HUD
    if (visible) {
      el.classList.remove('screen--hidden')
      el.classList.add('screen--visible')
      el.setAttribute('aria-hidden', 'false')
    } else {
      el.classList.remove('screen--visible')
      el.classList.add('screen--hidden')
      el.setAttribute('aria-hidden', 'true')
    }
  }

  updateHUD(score: number, multiplierRemaining?: number): void {
    this.el.hudScore.textContent = String(score)
    if (multiplierRemaining != null && multiplierRemaining > 0) {
      this.el.hudMultiplier.textContent = `x2 ${Math.ceil(multiplierRemaining)}s`
      this.el.hudMultiplier.style.display = ''
      this.el.hudMultiplier.removeAttribute('aria-hidden')
    } else {
      this.el.hudMultiplier.textContent = ''
      this.el.hudMultiplier.style.display = 'none'
      this.el.hudMultiplier.setAttribute('aria-hidden', 'true')
    }
  }

  updateMenuBestScore(): void {
    const best = this.opts.getBestScore()
    this.el.menuBest.textContent = best > 0 ? `Best: ${best}` : 'Best: 0'
  }

  showGameOver(score: number, bestScore: number, isNewRecord: boolean): void {
    this.setGameOverScore(score)
    this.el.gameOverScore.textContent = String(score)
    this.el.gameOverBest.textContent = `Best: ${bestScore}`
    this.el.gameOverNew.setAttribute('aria-hidden', isNewRecord ? 'false' : 'true')
    if (isNewRecord) {
      this.el.gameOverNew.style.display = 'inline-block'
    } else {
      this.el.gameOverNew.style.display = 'none'
    }
    this.showHUD(false)
    this.showScreen('GAME_OVER')
  }

  private lastShareScore = 0

  private handleShareX(): void {
    const score = this.lastShareScore
    const text = `I scored ${score} in PrismaRunner! Can you beat me?`
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const encodedText = encodeURIComponent(text)
    const encodedUrl = encodeURIComponent(url)
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
    log.info('share intent: score=' + score + ', url=' + url)
    window.open(shareUrl, '_blank', 'noopener,noreferrer')
  }

  /** Call before showing Game Over so Share uses the right score. */
  setGameOverScore(score: number): void {
    this.lastShareScore = score
  }

  getCurrentScreen(): ScreenId | null {
    return this.currentScreen
  }
}
