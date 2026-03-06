import * as THREE from 'three'
import { createLogger } from '../utils/Logger'
import { JUMP_DURATION, LANE_SWITCH_DURATION, LANE_WIDTH } from './constants'
import type { LaneDirection } from './Player'
import { Player } from './Player'

export type PlayerLane = -1 | 0 | 1

export interface PlayerWorldPosition {
  x: number
  y: number
  z: number
  lane: PlayerLane
}

type PlayerState = 'RUNNING' | 'SWITCHING_LANE' | 'JUMPING'

const log = createLogger('PlayerController')

const laneIndexToName = (lane: PlayerLane): 'left' | 'center' | 'right' => {
  switch (lane) {
    case -1:
      return 'left'
    case 0:
      return 'center'
    case 1:
      return 'right'
  }
}

export class PlayerController {
  private readonly player: Player

  private currentLane: PlayerLane = 0
  private targetLane: PlayerLane = 0

  private laneFromX = 0
  private laneToX = 0
  private laneElapsed = 0

  private isJumping = false
  private jumpElapsed = 0

  private readonly baseZ: number

  private state: PlayerState = 'RUNNING'

  constructor(player: Player, options?: { z?: number }) {
    this.player = player
    this.baseZ = options?.z ?? 0

    this.player.group.position.set(0, 0, this.baseZ)
  }

  /** Reset position and state for new game. */
  reset(): void {
    this.player.group.position.set(0, 0, this.baseZ)
    this.currentLane = 0
    this.targetLane = 0
    this.laneFromX = 0
    this.laneToX = 0
    this.laneElapsed = 0
    this.isJumping = false
    this.jumpElapsed = 0
    this.state = 'RUNNING'
  }

  update(delta: number, speed: number): void {
    this.player.updateRun(delta, speed)

    this.updateLane(delta)
    this.updateJump(delta)
  }

  requestMoveLeft(): boolean {
    return this.requestLaneChange(-1)
  }

  requestMoveRight(): boolean {
    return this.requestLaneChange(1)
  }

  requestJump(): boolean {
    if (this.isJumping) {
      return false
    }

    this.isJumping = true
    this.jumpElapsed = 0
    this.state = 'JUMPING'

    log.debug('jump start')

    return true
  }

  getWorldPosition(): PlayerWorldPosition {
    const { x, y, z } = this.player.group.position
    return {
      x,
      y,
      z,
      lane: this.currentLane,
    }
  }

  private requestLaneChange(direction: LaneDirection): boolean {
    if (this.state === 'SWITCHING_LANE' || this.isJumping) {
      return false
    }

    const nextLane = THREE.MathUtils.clamp(this.currentLane + direction, -1, 1) as PlayerLane
    if (nextLane === this.currentLane) {
      return false
    }

    const fromName = laneIndexToName(this.currentLane)
    const toName = laneIndexToName(nextLane)

    this.targetLane = nextLane
    this.laneFromX = this.player.group.position.x
    this.laneToX = this.laneToWorldX(this.targetLane)
    this.laneElapsed = 0
    this.state = 'SWITCHING_LANE'

    log.debug(`lane change: ${fromName} → ${toName}`)

    return true
  }

  private updateLane(delta: number): void {
    if (this.state !== 'SWITCHING_LANE') {
      this.player.applyLaneTilt(0, 1)
      return
    }

    this.laneElapsed += delta
    const t = THREE.MathUtils.clamp(this.laneElapsed / LANE_SWITCH_DURATION, 0, 1)

    const easeOut = 1 - (1 - t) * (1 - t)
    const x = THREE.MathUtils.lerp(this.laneFromX, this.laneToX, easeOut)

    this.player.group.position.x = x

    const direction: LaneDirection = this.laneToX > this.laneFromX ? 1 : -1
    this.player.applyLaneTilt(direction, t)

    if (t >= 1) {
      this.currentLane = this.targetLane
      this.state = this.isJumping ? 'JUMPING' : 'RUNNING'
      this.player.applyLaneTilt(0, 1)
    }
  }

  private updateJump(delta: number): void {
    if (!this.isJumping) {
      return
    }

    this.jumpElapsed += delta
    const t = THREE.MathUtils.clamp(this.jumpElapsed / JUMP_DURATION, 0, 1)

    this.player.updateJump(t)

    if (t >= 1) {
      this.isJumping = false
      const y = 0
      this.player.group.position.y = y
      this.state = 'RUNNING'

      log.debug('jump land')
    }
  }

  private laneToWorldX(lane: PlayerLane): number {
    return lane * LANE_WIDTH
  }
}

