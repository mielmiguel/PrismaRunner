import { SceneManager } from './SceneManager'
import { ChunkGenerator } from './ChunkGenerator'
import {
  BASE_SPEED,
  BEST_SCORE_KEY,
  COIN_COLLECT_RADIUS,
  COIN_POINTS,
  GAME_OVER_CRASH_DELAY_MS,
  LANE_WIDTH,
  MAX_SPEED,
  MULTIPLIER_FACTOR,
  SPEED_RAMP_PER_10S,
} from './constants'
import { createLogger } from '../utils/Logger'
import { InputManager, type InputCommand } from './InputManager'
import { PlayerController } from './PlayerController'
import { createPlayerSkin } from '../models/SkinFactory'
import { checkCollision } from './CollisionDetector'
import { BonusManager, collectCoins } from './BonusManager'
import { CoinCollectParticles } from './CoinCollectParticles'
import type { Player } from './Player'

type GameState = 'BOOTING' | 'PLAYING' | 'GAME_OVER'

const log = createLogger('Game')

function loadBestScore(): number {
  try {
    const s = localStorage.getItem(BEST_SCORE_KEY)
    if (s != null) {
      const n = parseInt(s, 10)
      if (Number.isFinite(n) && n >= 0) return n
    }
  } catch {
    /* ignore */
  }
  return 0
}

function saveBestScore(score: number): void {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(Math.floor(score)))
  } catch {
    /* ignore */
  }
}

export class Game {
  private readonly sceneManager: SceneManager
  private readonly chunks: ChunkGenerator
  private readonly bonusManager: BonusManager

  private readonly input: InputManager
  private readonly playerController: PlayerController
  private readonly player: Player
  private readonly coinParticles: CoinCollectParticles

  private state: GameState = 'BOOTING'
  private lastTime = performance.now()
  private distance = 0
  private speed = BASE_SPEED
  private gameElapsedTime = 0
  /** Log speed only when it crosses 0.5 steps (15.0 → 15.5 → 16.0). */
  private lastSpeedStep = Math.floor(BASE_SPEED * 2) / 2

  private fpsAccumTime = 0
  private fpsFrames = 0

  private gameOverAt = 0
  private gameOverLogged = false
  private bestScore = 0
  private lastLoggedScore = -1
  private lastLoggedDist = -1
  private lastLoggedCoins = -1
  private lastLoggedMult = false

  constructor(canvas: HTMLCanvasElement) {
    this.sceneManager = new SceneManager(canvas)
    this.chunks = new ChunkGenerator(this.sceneManager.scene, LANE_WIDTH)
    this.bonusManager = new BonusManager()
    this.bestScore = loadBestScore()

    const player = createPlayerSkin()
    this.player = player
    player.addToScene(this.sceneManager.scene)
    this.playerController = new PlayerController(player)

    this.input = new InputManager(canvas)
    this.coinParticles = new CoinCollectParticles(this.sceneManager.scene)

    log.info('game constructed')
    this.start()
  }

  getScore(): number {
    const distPart = Math.floor(this.distance)
    const coinPart = this.bonusManager.getTotalCoinsCollected() * COIN_POINTS
    const mult = this.bonusManager.isMultiplierActive() ? MULTIPLIER_FACTOR : 1
    return Math.floor((distPart + coinPart) * mult)
  }

  getBestScore(): number {
    return this.bestScore
  }

  /** For HUD (S5): whether multiplier is active. */
  getMultiplierActive(): boolean {
    return this.bonusManager.isMultiplierActive()
  }

  /** For HUD (S5): seconds remaining on multiplier. */
  getMultiplierRemaining(): number {
    return this.bonusManager.getMultiplierRemaining()
  }

  private start(): void {
    this.state = 'PLAYING'
    this.lastTime = performance.now()
    this.gameElapsedTime = 0
    this.distance = 0
    this.speed = BASE_SPEED
    this.lastSpeedStep = Math.floor(BASE_SPEED * 2) / 2
    this.bonusManager.reset()
    log.info('state: BOOTING → PLAYING')
    requestAnimationFrame((t) => this.loop(t))
  }

  private loop(time: number): void {
    const now = time
    let delta = (now - this.lastTime) / 1000
    this.lastTime = now

    if (delta > 0.1) delta = 0.1

    if (this.state === 'PLAYING') {
      this.update(delta)
    } else if (this.state === 'GAME_OVER') {
      this.player.updateCrash(delta)
      if (!this.gameOverLogged && now - this.gameOverAt >= GAME_OVER_CRASH_DELAY_MS) {
        this.gameOverLogged = true
        const finalScore = this.getScore()
        if (finalScore > this.bestScore) {
          const prev = this.bestScore
          this.bestScore = finalScore
          saveBestScore(this.bestScore)
          log.info(`new best score: ${this.bestScore} (previous: ${prev})`)
        }
        log.info(`state: PLAYING → GAME_OVER, score: ${finalScore}`)
      }
    }

    this.sceneManager.render()
    requestAnimationFrame((t) => this.loop(t))
  }

  private update(delta: number): void {
    this.gameElapsedTime += delta
    this.speed = Math.min(
      BASE_SPEED + (this.gameElapsedTime / 10) * SPEED_RAMP_PER_10S,
      MAX_SPEED,
    )
    const speedStep = Math.floor(this.speed * 2) / 2
    if (speedStep > this.lastSpeedStep) {
      log.info(`speed increased: ${this.lastSpeedStep.toFixed(1)} → ${speedStep.toFixed(1)}`)
      this.lastSpeedStep = speedStep
    }

    this.distance += this.speed * delta

    const cameraZ = this.sceneManager.camera.position.z
    this.chunks.update(delta, this.speed, cameraZ)

    this.processInput()
    this.playerController.update(delta, this.speed)

    const pos = this.playerController.getWorldPosition()
    const obstacles = this.chunks.getActiveObstacles(cameraZ)
    if (checkCollision(pos.x, pos.y, pos.z, obstacles)) {
      this.state = 'GAME_OVER'
      this.gameOverAt = performance.now()
      this.gameOverLogged = false
      this.player.playCrash()
    }

    const coins = this.chunks.getActiveCoins()
    const collectedIndices = collectCoins(
      { x: pos.x, y: pos.y, z: pos.z },
      coins,
    )
    for (const i of collectedIndices) {
      this.chunks.markCoinCollected(coins[i].chunkIndex, coins[i].coinIndex)
    }
    if (collectedIndices.length > 0) {
      this.bonusManager.onCoinsCollected(coins, collectedIndices)
      this.player.playPickup()
      this.coinParticles.spawn(pos.x, pos.y, pos.z)
    }

    const multRefs = this.chunks.getActiveMultiplierRefs()
    for (const ref of multRefs) {
      const dx = pos.x - ref.worldPos.x
      const dz = pos.z - ref.worldPos.z
      if (dx * dx + dz * dz <= COIN_COLLECT_RADIUS * COIN_COLLECT_RADIUS) {
        this.bonusManager.activateMultiplier()
        this.chunks.markMultiplierCollected(ref.chunkIndex)
        this.player.playPickup()
        break
      }
    }

    this.bonusManager.update(delta)
    this.coinParticles.update(delta)

    const score = this.getScore()
    const distPart = Math.floor(this.distance)
    const coinPart = this.bonusManager.getTotalCoinsCollected() * COIN_POINTS
    const mult = this.bonusManager.isMultiplierActive()
    const changed =
      score !== this.lastLoggedScore ||
      distPart !== this.lastLoggedDist ||
      coinPart !== this.lastLoggedCoins ||
      mult !== this.lastLoggedMult
    if (changed) {
      this.lastLoggedScore = score
      this.lastLoggedDist = distPart
      this.lastLoggedCoins = coinPart
      this.lastLoggedMult = mult
      const multStr = mult ? 'active' : 'inactive'
      log.info(`score update: ${score} (dist: ${distPart}, coins: ${coinPart}, mult: ${multStr})`)
    }

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

