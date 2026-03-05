import { createLogger } from '../utils/Logger'
import { COIN_COLLECT_RADIUS, MULTIPLIER_DURATION_S } from './constants'

const log = createLogger('BonusManager')

export interface WorldPosition {
  x: number
  y: number
  z: number
}

export interface CoinRef {
  worldPos: WorldPosition
  chunkIndex: number
  coinIndex: number
}

export interface MultiplierRef {
  worldPos: WorldPosition
  chunkIndex: number
}

/** Returns indices (into coins array) of coins collected this frame. */
export function collectCoins(
  playerPos: WorldPosition,
  coins: CoinRef[],
): number[] {
  const collected: number[] = []
  const r2 = COIN_COLLECT_RADIUS * COIN_COLLECT_RADIUS
  for (let i = 0; i < coins.length; i++) {
    const c = coins[i].worldPos
    const dx = playerPos.x - c.x
    const dz = playerPos.z - c.z
    if (dx * dx + dz * dz <= r2) {
      collected.push(i)
    }
  }
  return collected
}

export class BonusManager {
  private multiplierActive = false
  private multiplierRemaining = 0
  private totalCoinsCollected = 0

  activateMultiplier(): void {
    this.multiplierActive = true
    this.multiplierRemaining = MULTIPLIER_DURATION_S
    log.info(`multiplier activated, expires in ${MULTIPLIER_DURATION_S}s`)
  }

  update(delta: number): void {
    if (!this.multiplierActive) return
    this.multiplierRemaining -= delta
    if (this.multiplierRemaining <= 0) {
      this.multiplierActive = false
      this.multiplierRemaining = 0
      log.info('multiplier expired')
    }
  }

  isMultiplierActive(): boolean {
    return this.multiplierActive
  }

  getMultiplierRemaining(): number {
    return this.multiplierRemaining
  }

  /** Call when coins are collected; logs and updates total. */
  onCoinsCollected(coins: CoinRef[], collectedIndices: number[]): number {
    for (const i of collectedIndices) {
      const pos = coins[i].worldPos
      this.totalCoinsCollected += 1
      log.info(`coin collected at (${pos.x.toFixed(2)}, ${pos.z.toFixed(2)}), total: ${this.totalCoinsCollected}`)
    }
    return this.totalCoinsCollected
  }

  getTotalCoinsCollected(): number {
    return this.totalCoinsCollected
  }

  reset(): void {
    this.multiplierActive = false
    this.multiplierRemaining = 0
    this.totalCoinsCollected = 0
  }
}
