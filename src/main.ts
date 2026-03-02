import './style.css'
import { Game } from './game/Game'

const bootstrap = () => {
  const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')
  if (!canvas) {
    console.error('[Bootstrap] #game-canvas not found')
    return
  }

  const game = new Game(canvas)
  ;(window as any).__prGame = game
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap)
} else {
  bootstrap()
}
