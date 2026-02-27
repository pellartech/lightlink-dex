/**
 * Hardcoded token logo URLs for LightLink tokens.
 * These are used as fallbacks when the Uniswap assets repo doesn't have logos
 * for LightLink-specific token addresses.
 */

// Standard token logos from Uniswap assets (using Ethereum mainnet equivalents)
const WETH_LOGO = 'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
const USDC_LOGO = 'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
const USDT_LOGO = 'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png'
const LL_LOGO = 'https://uniswap-api-production-64b8.up.railway.app/logos/ll.png'

// Map of LightLink token addresses (lowercased) to their logo URLs
export const LIGHTLINK_TOKEN_LOGOS: Record<string, string> = {
  '0x7ebef2a4b1b09381ec5b9df8c5c6f2dbeca59c73': WETH_LOGO,   // WETH
  '0xbcf8c1b03bbdda88d579330bdf236b58f8bb2cfd': USDC_LOGO,   // USDC.e
  '0x18fb38404dadee1727be4b805c5b242b5413fa40': USDC_LOGO,   // USDC
  '0x808d7c71ad2ba3fa531b068a2417c63106bc0949': USDT_LOGO,   // USDT
  '0x519d3443cacc61bd844546edaea48e5502021802': LL_LOGO,     // LL
  '0xd9d7123552fa2bedb2348bb562576d67f6e8e96e': LL_LOGO,     // LL.e (bridged)
}
