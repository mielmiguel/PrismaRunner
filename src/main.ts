import './style.css'
import { Game } from './game/Game'
import { UIManager } from './ui/UIManager'
import { AudioManager } from './game/AudioManager'

const bootstrap = () => {
  const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')
  if (!canvas) {
    console.error('[Bootstrap] #game-canvas not found')
    return
  }

  const audio = new AudioManager()
  const game = new Game(canvas, undefined, audio)
  ;(window as unknown as { __prGame?: Game }).__prGame = game

  const ui = new UIManager({
    getBestScore: () => game.getBestScore(),
    onPlay: async () => {
      await audio.playMusic()
      game.startGame()
      ui.goToPlaying()
    },
    onRestart: () => {
      game.restartGame()
      ui.goToPlaying()
    },
    onMenu: () => {
      game.goToMenu()
      ui.goToMenu()
    },
    onSkinApply: (skinId) => game.applySkin(skinId),
    getCurrentSkinId: () => game.getCurrentSkinId(),
    audio,
  })

  game.setOnGameOverScreenRequested(() => {
    ui.setGameOverScore(game.getScore())
    ui.showGameOver(game.getScore(), game.getBestScore(), game.wasRecordBeatenThisGame())
  })

  game.setOnHUDUpdate((score, multiplierRemaining) => {
    ui.updateHUD(score, multiplierRemaining)
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap)
} else {
  bootstrap()
}
