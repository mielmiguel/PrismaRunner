import { SceneManager } from './SceneManager'
import { ChunkGenerator } from './ChunkGenerator'
import { BASE_SPEED, LANE_WIDTH } from './constants'
import { createLogger } from '../utils/Logger'
import { InputManager, type InputCommand } from './InputManager'
import { PlayerController } from './PlayerController'
import { createPlayerSkin } from '../models/SkinFactory'

type GameState = 'BOOTING' | 'PLAYING'

const log = createLogger('Game')

export class Game {
  private readonly sceneManager: SceneManager
  private readonly chunks: ChunkGenerator

  private readonly input: InputManager
  private readonly playerController: PlayerController

  private state: GameState = 'BOOTING'
  private lastTime = performance.now()
  private distance = 0
  private speed = BASE_SPEED

  private fpsAccumTime = 0
  private fpsFrames = 0

  constructor(canvas: HTMLCanvasElement) {
    this.sceneManager = new SceneManager(canvas)
    this.chunks = new ChunkGenerator(this.sceneManager.scene, LANE_WIDTH)

    const player = createPlayerSkin()
    player.addToScene(this.sceneManager.scene)
    this.playerController = new PlayerController(player)

    this.input = new InputManager(canvas)

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

    this.processInput()
    this.playerController.update(delta, this.speed)

    this.trackFps(delta)
  }

  private processInput(): void {
    const buffered = this.input.getBufferedCommand()
    if (buffered) {
      if (this.applyCommand(buffered)) {
        this.input.clearBufferedCommand()
        log.debug('buffered action executed', { command: buffered })
      }
    }

    let cmd: InputCommand | null
    // consume all commands from this frame
    while ((cmd = this.input.pollCommand())) {
      if (!this.applyCommand(cmd)) {
        this.input.bufferCommand(cmd)
      }
    }
  }

  private applyCommand(cmd: InputCommand): boolean {
    switch (cmd) {
      case 'moveLeft':
        return this.playerController.requestMoveLeft()
      case 'moveRight':
        return this.playerController.requestMoveRight()
      case 'jump':
        return this.playerController.requestJump()
      default:
        return false
    }
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

