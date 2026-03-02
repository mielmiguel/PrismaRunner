import { SceneManager } from './SceneManager'
import { ChunkGenerator } from './ChunkGenerator'
import { BASE_SPEED, LANE_WIDTH } from './constants'
import { createLogger } from '../utils/Logger'

type GameState = 'BOOTING' | 'PLAYING'

const log = createLogger('Game')

export class Game {
  private readonly sceneManager: SceneManager
  private readonly chunks: ChunkGenerator

  private state: GameState = 'BOOTING'
  private lastTime = performance.now()
  private distance = 0
  private speed = BASE_SPEED

  private fpsAccumTime = 0
  private fpsFrames = 0

  constructor(canvas: HTMLCanvasElement) {
    this.sceneManager = new SceneManager(canvas)
    this.chunks = new ChunkGenerator(this.sceneManager.scene, LANE_WIDTH)

    log.info('game constructed')
    this.start()
  }

  private start(): void {
    this.state = 'PLAYING'
    this.lastTime = performance.now()
    log.info('state: BOOTING → PLAYING')
    requestAnimationFrame((t) => this.loop(t))
  }

  private loop(time: number): void {
    const now = time
    let delta = (now - this.lastTime) / 1000
    this.lastTime = now

    // защитимся от подвисаний вкладки
    if (delta > 0.1) delta = 0.1

    if (this.state === 'PLAYING') {
      this.update(delta)
    }

    this.sceneManager.render()
    requestAnimationFrame((t) => this.loop(t))
  }

  private update(delta: number): void {
    this.distance += this.speed * delta

    const cameraZ = this.sceneManager.camera.position.z
    this.chunks.update(delta, this.speed, cameraZ)

    this.trackFps(delta)
  }

  private trackFps(delta: number): void {
    this.fpsAccumTime += delta
    this.fpsFrames += 1

    if (this.fpsAccumTime >= 2) {
      const fps = this.fpsFrames / this.fpsAccumTime
      log.debug('fps sample', { fps: Math.round(fps) })
      if (fps < 30) {
        log.warn('low fps', { fps: Math.round(fps) })
      }
      this.fpsAccumTime = 0
      this.fpsFrames = 0
    }
  }
}

