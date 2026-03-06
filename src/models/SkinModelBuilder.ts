import * as THREE from 'three'
import { SKIN_COLORS } from '../game/constants'
import type { PlayerSkinId } from './SkinFactory'

export interface SkinConfig {
  headType: 'sphere' | 'box'
  torsoWidth: number
  torsoHeight: number
  torsoDepth: number
  legHeight: number
  legWidth: number
  legDepth: number
  armHeight: number
  armWidth: number
  headSize: number
  color: number
  secondaryColor: number
}

export function getSkinConfig(id: PlayerSkinId): SkinConfig {
  const color = SKIN_COLORS[id]
  const dark = 0x020617
  switch (id) {
    case 'runner':
      return {
        headType: 'sphere',
        torsoWidth: 0.9,
        torsoHeight: 1,
        torsoDepth: 0.4,
        legHeight: 0.8,
        legWidth: 0.22,
        legDepth: 0.32,
        armHeight: 0.7,
        armWidth: 0.18,
        headSize: 0.6,
        color,
        secondaryColor: dark,
      }
    case 'tank':
      return {
        headType: 'sphere',
        torsoWidth: 1.2,
        torsoHeight: 1.1,
        torsoDepth: 0.55,
        legHeight: 0.5,
        legWidth: 0.32,
        legDepth: 0.4,
        armHeight: 0.55,
        armWidth: 0.28,
        headSize: 0.55,
        color,
        secondaryColor: dark,
      }
    case 'slim':
      return {
        headType: 'sphere',
        torsoWidth: 0.6,
        torsoHeight: 1.1,
        torsoDepth: 0.3,
        legHeight: 1.0,
        legWidth: 0.14,
        legDepth: 0.24,
        armHeight: 0.9,
        armWidth: 0.12,
        headSize: 0.5,
        color,
        secondaryColor: dark,
      }
    case 'cube':
      return {
        headType: 'box',
        torsoWidth: 0.7,
        torsoHeight: 0.9,
        torsoDepth: 0.35,
        legHeight: 0.7,
        legWidth: 0.2,
        legDepth: 0.28,
        armHeight: 0.6,
        armWidth: 0.16,
        headSize: 0.5,
        color,
        secondaryColor: dark,
      }
    default:
      return getSkinConfig('runner')
  }
}

export interface BuiltModel {
  group: THREE.Group
  torso: THREE.Mesh
  head: THREE.Mesh
  hat: THREE.Mesh
  leftArm: THREE.Group
  rightArm: THREE.Group
  leftLeg: THREE.Group
  rightLeg: THREE.Group
}

export function buildPlayerModel(skinId: PlayerSkinId, root: THREE.Group): BuiltModel {
  const cfg = getSkinConfig(skinId)
  const footHeight = 0.18

  const mat = new THREE.MeshStandardMaterial({
    color: cfg.color,
    roughness: 0.4,
    metalness: 0.2,
    emissive: cfg.color,
    emissiveIntensity: 0.1,
  })
  const darkMat = new THREE.MeshStandardMaterial({
    color: cfg.secondaryColor,
    roughness: 0.6,
    metalness: 0.1,
  })

  const torsoGeom = new THREE.BoxGeometry(cfg.torsoWidth, cfg.torsoHeight, cfg.torsoDepth)
  const torso = new THREE.Mesh(torsoGeom, mat)
  torso.position.set(0, cfg.legHeight + footHeight + cfg.torsoHeight / 2, 0)
  torso.castShadow = true
  torso.name = 'Torso'
  root.add(torso)

  const headGeom =
    cfg.headType === 'sphere'
      ? new THREE.SphereGeometry(cfg.headSize * 0.5, 12, 10)
      : new THREE.BoxGeometry(cfg.headSize, cfg.headSize * 0.9, cfg.headSize)
  const head = new THREE.Mesh(headGeom, mat)
  head.position.set(0, torso.position.y + cfg.torsoHeight / 2 + cfg.headSize * 0.55, 0)
  head.castShadow = true
  head.name = 'Head'
  root.add(head)

  const hatGeom = new THREE.BoxGeometry(0, 0, 0)
  const hat = new THREE.Mesh(hatGeom, mat)
  hat.name = 'Hat'

  const armGeom = new THREE.BoxGeometry(cfg.armWidth, cfg.armHeight, cfg.legDepth * 0.8)
  const leftArmGroup = new THREE.Group()
  leftArmGroup.position.set(-(cfg.torsoWidth / 2 + cfg.armWidth * 0.25), torso.position.y + cfg.torsoHeight * 0.15, 0)
  leftArmGroup.name = 'LeftArm'
  const leftArmMesh = new THREE.Mesh(armGeom, mat)
  leftArmMesh.position.set(0, -cfg.armHeight / 2, 0)
  leftArmMesh.castShadow = true
  leftArmGroup.add(leftArmMesh)
  const handGeom = new THREE.BoxGeometry(cfg.armWidth * 0.9, cfg.armHeight * 0.25, cfg.legDepth * 0.7)
  const leftHand = new THREE.Mesh(handGeom, darkMat)
  leftHand.position.set(0, -cfg.armHeight * 0.9, 0)
  leftHand.castShadow = true
  leftArmGroup.add(leftHand)
  root.add(leftArmGroup)

  const rightArmGroup = new THREE.Group()
  rightArmGroup.position.set(cfg.torsoWidth / 2 + cfg.armWidth * 0.25, torso.position.y + cfg.torsoHeight * 0.15, 0)
  rightArmGroup.name = 'RightArm'
  const rightArmMesh = new THREE.Mesh(armGeom, mat)
  rightArmMesh.position.set(0, -cfg.armHeight / 2, 0)
  rightArmMesh.castShadow = true
  rightArmGroup.add(rightArmMesh)
  const rightHand = new THREE.Mesh(handGeom, darkMat)
  rightHand.position.set(0, -cfg.armHeight * 0.9, 0)
  rightHand.castShadow = true
  rightArmGroup.add(rightHand)
  root.add(rightArmGroup)

  const legGeom = new THREE.BoxGeometry(cfg.legWidth, cfg.legHeight, cfg.legDepth)
  const footGeom = new THREE.BoxGeometry(cfg.legWidth * 1.2, footHeight, cfg.legDepth * 1.1)
  const hipsY = cfg.legHeight + footHeight

  const leftLegGroup = new THREE.Group()
  leftLegGroup.position.set(-cfg.torsoWidth * 0.22, hipsY, 0)
  leftLegGroup.name = 'LeftLeg'
  const leftLegMesh = new THREE.Mesh(legGeom, mat)
  leftLegMesh.position.set(0, -cfg.legHeight / 2, 0)
  leftLegMesh.castShadow = true
  leftLegGroup.add(leftLegMesh)
  const leftFoot = new THREE.Mesh(footGeom, darkMat)
  leftFoot.position.set(0, -cfg.legHeight - footHeight / 2, cfg.legDepth * 0.05)
  leftFoot.castShadow = true
  leftLegGroup.add(leftFoot)
  root.add(leftLegGroup)

  const rightLegGroup = new THREE.Group()
  rightLegGroup.position.set(cfg.torsoWidth * 0.22, hipsY, 0)
  rightLegGroup.name = 'RightLeg'
  const rightLegMesh = new THREE.Mesh(legGeom, mat)
  rightLegMesh.position.set(0, -cfg.legHeight / 2, 0)
  rightLegMesh.castShadow = true
  rightLegGroup.add(rightLegMesh)
  const rightFoot = new THREE.Mesh(footGeom, darkMat)
  rightFoot.position.set(0, -cfg.legHeight - footHeight / 2, cfg.legDepth * 0.05)
  rightFoot.castShadow = true
  rightLegGroup.add(rightFoot)
  root.add(rightLegGroup)

  return {
    group: root,
    torso,
    head,
    hat,
    leftArm: leftArmGroup,
    rightArm: rightArmGroup,
    leftLeg: leftLegGroup,
    rightLeg: rightLegGroup,
  }
}
