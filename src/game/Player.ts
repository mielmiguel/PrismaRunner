import * as THREE from 'three'
import { PALETTE } from './constants'
import { createLogger } from '../utils/Logger'
import { PlayerAnimator } from './PlayerAnimator'

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

  constructor() {
    this.group = new THREE.Group()
    this.group.name = 'PlayerRoot'

    const {
      torso,
      head,
      hat,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
    } = this.createPrismaRobotModel()

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

    log.info('player model created', {
      heightApprox: 2.4,
      widthApprox: 1.0,
    })
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

  /** S3 [Designer]: trigger crash animation. */
  playCrash(): void {
    this.animator.playCrash()
  }

  /** Advance crash animation; call each frame in GAME_OVER. Returns true while animating. */
  updateCrash(delta: number): boolean {
    return this.animator.updateCrash(delta)
  }

  private createPrismaRobotModel() {
    const torsoHeight = 1
    const torsoWidth = 0.9
    const torsoDepth = 0.4

    const legHeight = 0.8
    const legWidth = 0.22
    const legDepth = 0.32
    const footHeight = 0.18

    const armHeight = 0.7
    const armWidth = 0.18
    const armDepth = 0.26

    const headSize = 0.6

    const whiteMat = new THREE.MeshStandardMaterial({
      color: PALETTE.playerWhite,
      roughness: 0.4,
      metalness: 0.1,
    })
    const blueMat = new THREE.MeshStandardMaterial({
      color: PALETTE.playerBlue,
      roughness: 0.35,
      metalness: 0.35,
      emissive: PALETTE.playerBlue,
      emissiveIntensity: 0.15,
    })
    const darkMat = new THREE.MeshStandardMaterial({
      color: PALETTE.playerDark,
      roughness: 0.6,
      metalness: 0.1,
    })

    // torso with vertical blue stripes
    const torsoGeom = new THREE.BoxGeometry(torsoWidth, torsoHeight, torsoDepth)
    const torso = new THREE.Mesh(torsoGeom, whiteMat)
    torso.position.set(0, legHeight + footHeight + torsoHeight / 2, 0)
    torso.castShadow = true
    torso.name = 'Torso'
    this.group.add(torso)

    const stripeWidth = torsoWidth * 0.18
    const stripeDepth = torsoDepth * 1.01
    const stripeGeom = new THREE.BoxGeometry(stripeWidth, torsoHeight * 0.96, stripeDepth)

    const leftStripe = new THREE.Mesh(stripeGeom, blueMat)
    leftStripe.position.set(-torsoWidth * 0.25, 0, torsoDepth * 0.51)
    const centerStripe = new THREE.Mesh(stripeGeom, blueMat)
    centerStripe.position.set(0, 0, torsoDepth * 0.51)
    const rightStripe = new THREE.Mesh(stripeGeom, blueMat)
    rightStripe.position.set(torsoWidth * 0.25, 0, torsoDepth * 0.51)

    leftStripe.castShadow = centerStripe.castShadow = rightStripe.castShadow = true

    const chestGroup = new THREE.Group()
    chestGroup.position.copy(torso.position)
    chestGroup.add(leftStripe, centerStripe, rightStripe)
    chestGroup.name = 'TorsoStripes'
    this.group.add(chestGroup)

    // head — rounded box approximation (no facial features)
    const headGeom = new THREE.BoxGeometry(headSize, headSize * 0.9, headSize)
    const head = new THREE.Mesh(headGeom, whiteMat)
    head.position.set(0, torso.position.y + torsoHeight / 2 + headSize * 0.55, 0)
    head.castShadow = true
    head.name = 'Head'
    this.group.add(head)

    // hat removed per new art direction; keep placeholder mesh for API compatibility,
    // but do not add it to the scene graph so it is not visible
    const hatGeom = new THREE.BoxGeometry(0, 0, 0)
    const hat = new THREE.Mesh(hatGeom, whiteMat)
    hat.name = 'Hat'

    // arms — pivot groups at the shoulders
    const armGeom = new THREE.BoxGeometry(armWidth, armHeight, armDepth)

    const leftArmGroup = new THREE.Group()
    leftArmGroup.position.set(-(torsoWidth / 2 + armWidth * 0.25), torso.position.y + torsoHeight * 0.15, 0)
    leftArmGroup.name = 'LeftArm'
    const leftArmMesh = new THREE.Mesh(armGeom, blueMat)
    leftArmMesh.position.set(0, -armHeight / 2, 0)
    leftArmMesh.castShadow = true
    leftArmGroup.add(leftArmMesh)
    this.group.add(leftArmGroup)

    const rightArmGroup = new THREE.Group()
    rightArmGroup.position.set(torsoWidth / 2 + armWidth * 0.25, torso.position.y + torsoHeight * 0.15, 0)
    rightArmGroup.name = 'RightArm'
    const rightArmMesh = new THREE.Mesh(armGeom, blueMat)
    rightArmMesh.position.set(0, -armHeight / 2, 0)
    rightArmMesh.castShadow = true
    rightArmGroup.add(rightArmMesh)
    this.group.add(rightArmGroup)

    // hands / grips — dark blocks at the end of the arms
    const handGeom = new THREE.BoxGeometry(armWidth * 0.9, armHeight * 0.25, armDepth * 0.9)

    const leftHand = new THREE.Mesh(handGeom, darkMat)
    leftHand.position.set(0, -armHeight * 0.9, 0)
    leftHand.castShadow = true
    leftArmGroup.add(leftHand)

    const rightHand = new THREE.Mesh(handGeom, darkMat)
    rightHand.position.set(0, -armHeight * 0.9, 0)
    rightHand.castShadow = true
    rightArmGroup.add(rightHand)

    // legs — pivot groups at the hips
    const legGeom = new THREE.BoxGeometry(legWidth, legHeight, legDepth)
    const footGeom = new THREE.BoxGeometry(legWidth * 1.2, footHeight, legDepth * 1.1)

    const hipsY = legHeight + footHeight

    const leftLegGroup = new THREE.Group()
    leftLegGroup.position.set(-torsoWidth * 0.22, hipsY, 0)
    leftLegGroup.name = 'LeftLeg'
    const leftLegMesh = new THREE.Mesh(legGeom, whiteMat)
    leftLegMesh.position.set(0, -legHeight / 2, 0)
    leftLegMesh.castShadow = true
    leftLegGroup.add(leftLegMesh)
    this.group.add(leftLegGroup)

    const rightLegGroup = new THREE.Group()
    rightLegGroup.position.set(torsoWidth * 0.22, hipsY, 0)
    rightLegGroup.name = 'RightLeg'
    const rightLegMesh = new THREE.Mesh(legGeom, whiteMat)
    rightLegMesh.position.set(0, -legHeight / 2, 0)
    rightLegMesh.castShadow = true
    rightLegGroup.add(rightLegMesh)
    this.group.add(rightLegGroup)

    // add blue knee/ankle blocks and dark feet
    const kneeHeight = legHeight * 0.4

    const leftKnee = new THREE.Mesh(
      new THREE.BoxGeometry(legWidth * 1.05, kneeHeight * 0.6, legDepth * 1.02),
      blueMat,
    )
    leftKnee.position.set(0, -legHeight * 0.45, 0)
    leftKnee.castShadow = true
    leftLegGroup.add(leftKnee)

    const rightKnee = leftKnee.clone()
    rightKnee.castShadow = true
    rightLegGroup.add(rightKnee)

    const leftFoot = new THREE.Mesh(footGeom, darkMat)
    leftFoot.position.set(0, -legHeight - footHeight / 2, legDepth * 0.05)
    leftFoot.castShadow = true
    leftLegGroup.add(leftFoot)

    const rightFoot = new THREE.Mesh(footGeom, darkMat)
    rightFoot.position.set(0, -legHeight - footHeight / 2, legDepth * 0.05)
    rightFoot.castShadow = true
    rightLegGroup.add(rightFoot)

    // ensure root stands on y=0
    this.group.position.set(0, 0, 0)

    return {
      torso,
      head,
      hat,
      leftArm: leftArmGroup,
      rightArm: rightArmGroup,
      leftLeg: leftLegGroup,
      rightLeg: rightLegGroup,
    }
  }
}

