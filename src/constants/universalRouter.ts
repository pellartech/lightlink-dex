import { UNIVERSAL_ROUTER_ADDRESS as SDK_UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'
import { SupportedChainId } from './chains'

/**
 * LightLink's Universal Router is not in the SDK's CHAIN_CONFIGS.
 * Override it here so it resolves without patching node_modules at runtime.
 */
const UNIVERSAL_ROUTER_OVERRIDES: Partial<Record<number, string>> = {
  [SupportedChainId.LIGHTLINK]: '0x738fD6d10bCc05c230388B4027CAd37f82fe2AF2',
}

export function UNIVERSAL_ROUTER_ADDRESS(chainId: number): string {
  const override = UNIVERSAL_ROUTER_OVERRIDES[chainId]
  if (override) return override
  return SDK_UNIVERSAL_ROUTER_ADDRESS(chainId)
}
