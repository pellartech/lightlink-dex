/**
 * LightLink address overrides for SDK address maps.
 * The SDK doesn't include LightLink, so we extend the address maps here.
 */
import { LIGHTLINK_CHAIN_ID, LIGHTLINK_ADDRESSES } from './chains'

/**
 * Extends an SDK address map with LightLink addresses.
 */
export function withLightLink<T extends { [chainId: number]: string }>(
  sdkMap: T,
  lightlinkAddress: string
): T & { [key: number]: string } {
  return {
    ...sdkMap,
    [LIGHTLINK_CHAIN_ID]: lightlinkAddress,
  }
}

// Pre-built extended maps
export const LIGHTLINK_MULTICALL_ADDRESS = LIGHTLINK_ADDRESSES.MULTICALL2
export const LIGHTLINK_NONFUNGIBLE_POSITION_MANAGER_ADDRESS = LIGHTLINK_ADDRESSES.NONFUNGIBLE_POSITION_MANAGER
export const LIGHTLINK_TICK_LENS_ADDRESS = LIGHTLINK_ADDRESSES.TICK_LENS
