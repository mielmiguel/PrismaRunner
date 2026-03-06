import * as THREE from 'three'
import { createLogger } from '../utils/Logger'
import { PlayerAnimator } from './PlayerAnimator'
import { buildPlayerModel } from '../models/SkinModelBuilder'
import type { PlayerSkinId } from '../models/SkinFactory'

const log = createLogger('Player')

export type LaneDirection = -1 | 0 | 1

export interface PlayerRig {
  root: THREE.Group
  torso: THREE.Object3D
  head: THREE.Object3D
  leftArm: THREE.Object3D
  rightArm: THREE.Object3D
  leftLeg: THREE.Object3D
  rightLeg: THREE.Object3D
}

export class Player {
  public readonly group: THREE.Group

  public readonly torso: THREE.Mesh
  public readonly head: THREE.Mesh
  public readonly hat: THREE.Mesh

  public readonly leftArm: THREE.Object3D
  public readonly rightArm: THREE.Object3D

  public readonly leftLeg: THREE.Object3D
  public readonly rightLeg: THREE.Object3D

  public readonly animator: PlayerAnimator

  constructor(skinId: PlayerSkinId = 'runner') {
    this.group = new THREE.Group()
    this.group.name = 'PlayerRoot'

    const { torso, head, hat, leftArm, rightArm, leftLeg, rightLeg } = buildPlayerModel(skinId, this.group)

    this.torso = torso
    this.head = head
    this.hat = hat
    this.leftArm = leftArm
    this.rightArm = rightArm
    this.leftLeg = leftLeg
    this.rightLeg = rightLeg

    const rig: PlayerRig = {
      root: this.group,
      torso: this.torso,
      head: this.head,
      leftArm: this.leftArm,
      rightArm: this.rightArm,
      leftLeg: this.leftLeg,
      rightLeg: this.rightLeg,
    }

    this.animator = new PlayerAnimator(rig)

    log.info('player model created', { skinId, heightApprox: 2.4, widthApprox: 1.0 })
  }

  addToScene(scene: THREE.Scene): void {
    scene.add(this.group)
  }

  updateRun(delta: number, speed: number): void {
    this.animator.updateRun(delta, speed)
  }

  applyLaneTilt(direction: LaneDirection, t: number): void {
    this.animator.applyLaneTilt(direction, t)
  }

  updateJump(progress: number): void {
    this.animator.updateJump(progress)
  }

  /** S4 [Designer]: trigger pickup scale pulse (coin/multiplier). */
  playPickup(): void {
    this.animator.playPickup()
  }

  /** S3 [Designer]: trigger crash animation. */
  playCrash(): void {
    this.animator.playCrash()
  }

  /** Advance crash animation; call each frame in GAME_OVER. Returns true while animating. */
  updateCrash(delta: number): boolean {
    return this.animator.updateCrash(delta)
  }

  /** Reset animator/visual state after game over (for restart). */
  resetAfterGameOver(): void {
    this.animator.reset()
  }
}

