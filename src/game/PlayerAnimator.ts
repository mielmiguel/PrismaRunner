import * as THREE from 'three'
import {
  BASE_SPEED,
  GAME_OVER_CRASH_DELAY_MS,
  JUMP_ARM_RAISE_ANGLE,
  JUMP_BEND_LEG_ANGLE,
  JUMP_HEIGHT,
  LANE_TILT_MAX_DEG,
  PICKUP_PULSE_DURATION_MS,
  RUN_CYCLE_AMP_ARM,
  RUN_CYCLE_AMP_LEG,
  RUN_CYCLE_BASE_FREQ,
} from './constants'
import { createLogger } from '../utils/Logger'
import type { LaneDirection, PlayerRig } from './Player'

const log = createLogger('PlayerAnimator')

const degToRad = THREE.MathUtils.degToRad

const CRASH_DURATION_S = GAME_OVER_CRASH_DELAY_MS / 1000
const PICKUP_PULSE_DURATION_S = PICKUP_PULSE_DURATION_MS / 1000

export class PlayerAnimator {
  private readonly rig: PlayerRig

  private runPhase = 0
  private crashElapsed = -1
  private crashParticles: THREE.Mesh[] = []
  private crashParticleGeom: THREE.BufferGeometry | null = null
  private crashParticleMat: THREE.Material | null = null

  private pickupElapsed = -1

  constructor(rig: PlayerRig) {
    this.rig = rig
    log.info('PlayerAnimator created')
  }

  updateRun(delta: number, speed: number): void {
    this.updatePickup(delta)

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
    this.rig.root.position.y = jumpCurve * JUMP_HEIGHT

    const bendFactor = Math.sin(clamped * Math.PI)

    const legBend = bendFactor * JUMP_BEND_LEG_ANGLE
    const armRaise = bendFactor * JUMP_ARM_RAISE_ANGLE

    this.rig.leftLeg.rotation.x -= legBend
    this.rig.rightLeg.rotation.x -= legBend

    this.rig.leftArm.rotation.x -= armRaise
    this.rig.rightArm.rotation.x -= armRaise
  }

  /** S4 [Designer]: short scale pulse on pickup (coin/multiplier). */
  playPickup(): void {
    this.pickupElapsed = 0
    log.debug('pickup pulse started')
  }

  private updatePickup(delta: number): void {
    if (this.pickupElapsed < 0) return
    this.pickupElapsed += delta
    const t = THREE.MathUtils.clamp(this.pickupElapsed / PICKUP_PULSE_DURATION_S, 0, 1)
    const scale = t < 0.5
      ? 1 + 0.15 * (t * 2)
      : 1 + 0.15 * (2 - t * 2)
    this.rig.root.scale.setScalar(scale)
    if (t >= 1) {
      this.rig.root.scale.setScalar(1)
      this.pickupElapsed = -1
    }
  }

  /** S3 [Designer]: start crash animation (throwback, limb scatter, particles). */
  playCrash(): void {
    this.crashElapsed = 0
    this.spawnCrashParticles()
    log.debug('crash animation started')
  }

  /** Reset after game over (clear crash state, reset transform). */
  reset(): void {
    this.crashElapsed = -1
    this.rig.root.position.set(0, 0, 0)
    this.rig.root.rotation.set(0, 0, 0)
    this.rig.root.scale.setScalar(1)
    this.runPhase = 0
  }

  /** Call each frame while in GAME_OVER to advance crash animation. Returns true while animating. */
  updateCrash(delta: number): boolean {
    if (this.crashElapsed < 0) return false
    this.crashElapsed += delta
    const t = THREE.MathUtils.clamp(this.crashElapsed / CRASH_DURATION_S, 0, 1)
    const easeOut = 1 - (1 - t) * (1 - t)

    this.rig.root.position.z -= easeOut * 2
    this.rig.root.rotation.x = easeOut * (Math.PI / 2)

    const scatter = easeOut * 0.8
    this.rig.leftArm.rotation.set(
      -scatter * 1.2,
      scatter * 0.5,
      scatter * 0.3,
    )
    this.rig.rightArm.rotation.set(
      scatter * 1.1,
      -scatter * 0.4,
      -scatter * 0.4,
    )
    this.rig.leftLeg.rotation.set(scatter * 0.9, scatter * 0.2, 0)
    this.rig.rightLeg.rotation.set(-scatter * 0.85, -scatter * 0.2, 0)

    this.updateCrashParticles(delta)

    return t < 1
  }

  private spawnCrashParticles(): void {
    const parent = this.rig.root.parent
    if (!parent) return
    this.crashParticleGeom = new THREE.SphereGeometry(0.08, 6, 4)
    this.crashParticleMat = new THREE.MeshBasicMaterial({ color: 0x8899aa })
    const origin = new THREE.Vector3()
    this.rig.root.getWorldPosition(origin)
    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(this.crashParticleGeom, this.crashParticleMat)
      mesh.position.copy(origin)
      parent.add(mesh)
      this.crashParticles.push(mesh)
    }
  }

  private updateCrashParticles(delta: number): void {
    const t = this.crashElapsed / CRASH_DURATION_S
    for (let i = 0; i < this.crashParticles.length; i++) {
      const p = this.crashParticles[i]
      const angle = (i / this.crashParticles.length) * Math.PI * 2
      p.position.x += Math.cos(angle) * delta * 4
      p.position.y += (0.5 + (i % 3) * 0.2) * delta * 6
      p.position.z -= delta * 3
      const scale = 1 - t
      p.scale.setScalar(scale)
    }
    if (t >= 1) {
      for (const p of this.crashParticles) {
        p.parent?.remove(p)
      }
      this.crashParticles.length = 0
      this.crashParticleGeom?.dispose()
      this.crashParticleGeom = null
      if (this.crashParticleMat) {
        this.crashParticleMat.dispose()
        this.crashParticleMat = null
      }
    }
  }
}

