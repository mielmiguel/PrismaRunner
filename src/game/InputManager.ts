import { createLogger } from '../utils/Logger'
import { SWIPE_MIN_DISTANCE_PX } from './constants'

export type InputCommand = 'moveLeft' | 'moveRight' | 'jump'

const log = createLogger('InputManager')

interface TouchPoint {
  x: number
  y: number
  time: number
}

export class InputManager {
  private readonly canvas: HTMLCanvasElement

  private readonly commands: InputCommand[] = []
  private buffered: InputCommand | null = null

  private touchStart: TouchPoint | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas

    window.addEventListener('keydown', this.handleKeyDown)
    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false })
    this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false })
  }

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown)
    this.canvas.removeEventListener('touchstart', this.handleTouchStart)
    this.canvas.removeEventListener('touchend', this.handleTouchEnd)
  }

  pollCommand(): InputCommand | null {
    return this.commands.shift() ?? null
  }

  getBufferedCommand(): InputCommand | null {
    return this.buffered
  }

  bufferCommand(cmd: InputCommand): void {
    const previous = this.buffered
    this.buffered = cmd
    if (previous && previous !== cmd) {
      log.debug('input: buffered command replaced', { previous, command: cmd })
    } else {
      log.debug('input: buffered command', { command: cmd })
    }
  }

  clearBufferedCommand(): void {
    this.buffered = null
  }

  private enqueue(cmd: InputCommand, source: string): void {
    this.commands.push(cmd)
    log.debug(`input: ${source}`, { command: cmd })
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) return

    switch (event.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.enqueue('moveLeft', 'key-left')
        event.preventDefault()
        break
      case 'ArrowRight':
      case 'KeyD':
        this.enqueue('moveRight', 'key-right')
        event.preventDefault()
        break
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        this.enqueue('jump', 'key-up')
        event.preventDefault()
        break
      default:
        break
    }
  }

  private readonly handleTouchStart = (event: TouchEvent): void => {
    if (event.touches.length !== 1) return

    const touch = event.touches[0]
    this.touchStart = {
      x: touch.clientX,
      y: touch.clientY,
      time: performance.now(),
    }

    // prevent scroll/zoom — canvas already has touch-action: none
    event.preventDefault()
  }

  private readonly handleTouchEnd = (event: TouchEvent): void => {
    if (!this.touchStart) return

    const touch = event.changedTouches[0]
    const dx = touch.clientX - this.touchStart.x
    const dy = touch.clientY - this.touchStart.y

    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (absDx < SWIPE_MIN_DISTANCE_PX && absDy < SWIPE_MIN_DISTANCE_PX) {
      this.touchStart = null
      return
    }

    if (absDx > absDy) {
      if (dx < 0) {
        this.enqueue('moveLeft', 'swipe-left')
      } else {
        this.enqueue('moveRight', 'swipe-right')
      }
    } else {
      if (dy < 0) {
        this.enqueue('jump', 'swipe-up')
      }
    }

    this.touchStart = null
    event.preventDefault()
  }
}

