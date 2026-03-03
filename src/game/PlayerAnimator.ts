import * as THREE from 'three'
import {
  BASE_SPEED,
  JUMP_ARM_RAISE_ANGLE,
  JUMP_BEND_LEG_ANGLE,
  LANE_TILT_MAX_DEG,
  RUN_CYCLE_AMP_ARM,
  RUN_CYCLE_AMP_LEG,
  RUN_CYCLE_BASE_FREQ,
} from './constants'
import { createLogger } from '../utils/Logger'
import type { LaneDirection, PlayerRig } from './Player'

const log = createLogger('PlayerAnimator')

const degToRad = THREE.MathUtils.degToRad

export class PlayerAnimator {
  private readonly rig: PlayerRig

  private runPhase = 0

  constructor(rig: PlayerRig) {
    this.rig = rig
    log.info('PlayerAnimator created')
  }

  updateRun(delta: number, speed: number): void {
    const speedFactor = Math.max(0.25, speed / BASE_SPEED)
    this.runPhase += delta * RUN_CYCLE_BASE_FREQ * speedFactor

    const legSwing = Math.sin(this.runPhase) * RUN_CYCLE_AMP_LEG
    const armSwing = Math.sin(this.runPhase + Math.PI) * RUN_CYCLE_AMP_ARM

    this.rig.leftLeg.rotation.x = legSwing
    this.rig.rightLeg.rotation.x = -legSwing

    this.rig.leftArm.rotation.x = -armSwing
    this.rig.rightArm.rotation.x = armSwing

    const bob = Math.abs(Math.sin(this.runPhase)) * 0.08
    this.rig.root.position.y = bob
  }

  applyLaneTilt(direction: LaneDirection, t: number): void {
    const clampedT = THREE.MathUtils.clamp(t, 0, 1)

    if (direction === 0) {
      // ease-out back to 0 when lane switch finished
      const ease = 1 - (1 - clampedT) * (1 - clampedT)
      this.rig.root.rotation.z *= 1 - ease
      return
    }

    const maxTiltRad = degToRad(LANE_TILT_MAX_DEG)
    const easeOut = 1 - (1 - clampedT) * (1 - clampedT)
    const tilt = direction * maxTiltRad * easeOut

    this.rig.root.rotation.z = tilt
  }

  updateJump(progress: number): void {
    const clamped = THREE.MathUtils.clamp(progress, 0, 1)

    const jumpCurve = 4 * clamped * (1 - clamped)
    const jumpHeight = jumpCurve * 2.6
    this.rig.root.position.y += jumpHeight

    const bendFactor = Math.sin(clamped * Math.PI)

    const legBend = bendFactor * JUMP_BEND_LEG_ANGLE
    const armRaise = bendFactor * JUMP_ARM_RAISE_ANGLE

    this.rig.leftLeg.rotation.x -= legBend
    this.rig.rightLeg.rotation.x -= legBend

    this.rig.leftArm.rotation.x -= armRaise
    this.rig.rightArm.rotation.x -= armRaise
  }
}

