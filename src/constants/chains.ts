import { ChainId, SUPPORTED_CHAINS, SupportedChainsType } from '@uniswap/sdk-core'

// LightLink Phoenix Mainnet
export const LIGHTLINK_CHAIN_ID = 1891 as const

export const CHAIN_IDS_TO_NAMES = {
  [ChainId.MAINNET]: 'mainnet',
  [ChainId.GOERLI]: 'goerli',
  [ChainId.SEPOLIA]: 'sepolia',
  [ChainId.POLYGON]: 'polygon',
  [ChainId.POLYGON_MUMBAI]: 'polygon_mumbai',
  [ChainId.CELO]: 'celo',
  [ChainId.CELO_ALFAJORES]: 'celo_alfajores',
  [ChainId.ARBITRUM_ONE]: 'arbitrum',
  [ChainId.ARBITRUM_GOERLI]: 'arbitrum_goerli',
  [ChainId.OPTIMISM]: 'optimism',
  [ChainId.OPTIMISM_GOERLI]: 'optimism_goerli',
  [ChainId.BNB]: 'bnb',
  [ChainId.AVALANCHE]: 'avalanche',
  [ChainId.BASE]: 'base',
  [LIGHTLINK_CHAIN_ID]: 'lightlink',
} as const

// Include ChainIds in this array if they are not supported by the UX yet, but are already in the SDK.
const NOT_YET_UX_SUPPORTED_CHAIN_IDS: number[] = [ChainId.BASE_GOERLI]

// TODO: include BASE_GOERLI when routing is implemented
export type SupportedInterfaceChain = Exclude<SupportedChainsType, ChainId.BASE_GOERLI> | typeof LIGHTLINK_CHAIN_ID

export function isSupportedChain(
  chainId: number | null | undefined | ChainId,
  featureFlags?: Record<number, boolean>
): chainId is SupportedInterfaceChain {
  if (featureFlags && chainId && chainId in featureFlags) {
    return featureFlags[chainId]
  }
  // LightLink is always supported
  if (chainId === LIGHTLINK_CHAIN_ID) return true
  return !!chainId && SUPPORTED_CHAINS.indexOf(chainId) !== -1 && NOT_YET_UX_SUPPORTED_CHAIN_IDS.indexOf(chainId) === -1
}

export function asSupportedChain(
  chainId: number | null | undefined | ChainId,
  featureFlags?: Record<number, boolean>
): SupportedInterfaceChain | undefined {
  if (!chainId) return undefined
  if (featureFlags && chainId in featureFlags && !featureFlags[chainId]) {
    return undefined
  }
  return isSupportedChain(chainId) ? chainId : undefined
}

export const SUPPORTED_GAS_ESTIMATE_CHAIN_IDS = [
  ChainId.MAINNET,
  ChainId.POLYGON,
  ChainId.CELO,
  ChainId.OPTIMISM,
  ChainId.ARBITRUM_ONE,
  ChainId.BNB,
  ChainId.AVALANCHE,
  ChainId.BASE,
  LIGHTLINK_CHAIN_ID,
] as const

/**
 * Supported networks for V2 pool behavior.
 */
export const SUPPORTED_V2POOL_CHAIN_IDS = [ChainId.MAINNET, ChainId.GOERLI] as const

export const TESTNET_CHAIN_IDS = [
  ChainId.GOERLI,
  ChainId.SEPOLIA,
  ChainId.POLYGON_MUMBAI,
  ChainId.ARBITRUM_GOERLI,
  ChainId.OPTIMISM_GOERLI,
  ChainId.CELO_ALFAJORES,
] as const

/**
 * All the chain IDs that are running the Ethereum protocol.
 */
export const L1_CHAIN_IDS = [
  ChainId.MAINNET,
  ChainId.GOERLI,
  ChainId.SEPOLIA,
  ChainId.POLYGON,
  ChainId.POLYGON_MUMBAI,
  ChainId.CELO,
  ChainId.CELO_ALFAJORES,
  ChainId.BNB,
  ChainId.AVALANCHE,
  LIGHTLINK_CHAIN_ID,
] as const

export type SupportedL1ChainId = (typeof L1_CHAIN_IDS)[number]

/**
 * Controls some L2 specific behavior, e.g. slippage tolerance, special UI behavior.
 * The expectation is that all of these networks have immediate transaction confirmation.
 */
export const L2_CHAIN_IDS = [
  ChainId.ARBITRUM_ONE,
  ChainId.ARBITRUM_GOERLI,
  ChainId.OPTIMISM,
  ChainId.OPTIMISM_GOERLI,
  ChainId.BASE,
] as const

export type SupportedL2ChainId = (typeof L2_CHAIN_IDS)[number]

/**
 * Get the priority of a chainId based on its relevance to the user.
 * @param {ChainId} chainId - The chainId to determine the priority for.
 * @returns {number} The priority of the chainId, the lower the priority, the earlier it should be displayed, with base of MAINNET=0.
 */
export function getChainPriority(chainId: ChainId): number {
  switch (chainId) {
    case ChainId.MAINNET:
    case ChainId.GOERLI:
    case ChainId.SEPOLIA:
      return 0
    case ChainId.ARBITRUM_ONE:
    case ChainId.ARBITRUM_GOERLI:
      return 1
    case ChainId.OPTIMISM:
    case ChainId.OPTIMISM_GOERLI:
      return 2
    case ChainId.POLYGON:
    case ChainId.POLYGON_MUMBAI:
      return 3
    case ChainId.BASE:
      return 4
    case ChainId.BNB:
      return 5
    case ChainId.AVALANCHE:
      return 6
    case ChainId.CELO:
    case ChainId.CELO_ALFAJORES:
      return 7
    case LIGHTLINK_CHAIN_ID:
      return 0 // LightLink is highest priority (only chain)
    default:
      return 8
  }
}

export function isUniswapXSupportedChain(chainId: number) {
  return chainId === ChainId.MAINNET
}

/**
 * LightLink contract addresses
 */
export const LIGHTLINK_ADDRESSES = {
  V3_CORE_FACTORY: '0xcb2436774C3e191c85056d248EF4260ce5f27A9D',
  SWAP_ROUTER_02: '0xaa52bB8110fE38D0d2d2AF0B85C3A3eE622CA455',
  QUOTER_V2: '0x5911cB3633e764939edc2d92b7e1ad375Bb57649',
  WETH: '0x7EbeF2A4b1B09381Ec5B9dF8C5c6f2dBECA59c73',
  NONFUNGIBLE_POSITION_MANAGER: '0x743E03cceB4af2efA3CC76838f6E8B50B63F184c',
  UNIVERSAL_ROUTER: '0x738fD6d10bCc05c230388B4027CAd37f82fe2AF2',
  PERMIT2: '0x807F4E281B7A3B324825C64ca53c69F0b418dE40',
  MULTICALL2: '0x5d6b0f5335ec95cD2aB7E52f2A0750dd86502435',
  UNISWAP_INTERFACE_MULTICALL: '0xdB07Fa7228A47e4bC7fd92B19ADd95542CB27728',
  TICK_LENS: '0xB3309C48F8407651D918ca3Da4C45DE40109E641',
} as const
