import { createLogger } from '../utils/Logger'

const log = createLogger('screens')

export type ScreenId = 'MAIN_MENU' | 'SKIN_SELECT' | 'HUD' | 'GAME_OVER'

const TRANSITION_MS = 280

/**
 * Show a screen (visibility + opacity/transform for transition).
 * Logs: screen transition: {from} → {to}
 */
export function showScreen(
  element: HTMLElement,
  fromScreen: ScreenId | null,
  toScreen: ScreenId,
  onTransitionEnd?: () => void,
): void {
  if (fromScreen !== toScreen) {
    log.info(`screen transition: ${fromScreen ?? 'none'} → ${toScreen}`)
  }
  element.classList.remove('screen--hidden')
  element.classList.add('screen--visible')
  if (onTransitionEnd) {
    setTimeout(onTransitionEnd, TRANSITION_MS + 50)
  }
}

/**
 * Hide a screen (opacity/transform then .screen--hidden).
 */
export function hideScreen(element: HTMLElement): void {
  element.classList.remove('screen--visible')
  element.classList.add('screen--hidden')
}

export const SCREEN_TRANSITION_MS = TRANSITION_MS
