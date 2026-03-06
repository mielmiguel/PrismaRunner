import * as THREE from 'three'
import { createLogger } from '../utils/Logger'
import { Player } from '../game/Player'
import { buildPlayerModel } from './SkinModelBuilder'

const log = createLogger('SkinFactory')

export type PlayerSkinId = 'runner' | 'tank' | 'slim' | 'cube'

export const DEFAULT_PLAYER_SKIN_ID: PlayerSkinId = 'runner'

export const PLAYER_SKIN_IDS: readonly PlayerSkinId[] = ['runner', 'tank', 'slim', 'cube'] as const

export function createPlayerSkin(id: PlayerSkinId = DEFAULT_PLAYER_SKIN_ID): Player {
  if (!PLAYER_SKIN_IDS.includes(id)) {
    log.warn('unknown player skin id, falling back to runner', { requested: id })
    id = DEFAULT_PLAYER_SKIN_ID
  }

  const player = new Player(id)

  let meshCount = 0
  player.group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      meshCount += 1
    }
  })

  log.debug('player skin created', { id, meshes: meshCount })

  return player
}

/** Build a preview model group (same rig structure). Used by SkinPreview. */
export function buildPreviewModel(id: PlayerSkinId): THREE.Group {
  const root = new THREE.Group()
  root.name = `Preview_${id}`
  buildPlayerModel(id, root)
  return root
}
