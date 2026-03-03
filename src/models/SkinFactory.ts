import * as THREE from 'three'
import { createLogger } from '../utils/Logger'
import { Player } from '../game/Player'

const log = createLogger('SkinFactory')

export type PlayerSkinId = 'prisma-robot'

export const DEFAULT_PLAYER_SKIN_ID: PlayerSkinId = 'prisma-robot'

export const createPlayerSkin = (id: PlayerSkinId = DEFAULT_PLAYER_SKIN_ID): Player => {
  if (id !== 'prisma-robot') {
    log.warn('unknown player skin id, falling back to prisma-robot', { requested: id })
  }

  const player = new Player()

  let meshCount = 0
  player.group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      meshCount += 1
    }
  })

  log.debug('player skin created', {
    id: 'prisma-robot',
    meshes: meshCount,
  })

  return player
}

