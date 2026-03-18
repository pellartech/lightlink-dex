/**
 * Direct on-chain quoter for LightLink.
 *
 * Calls the QuoterV2 contract directly via RPC to get swap quotes,
 * bypassing the AlphaRouter which doesn't support LightLink.
 *
 * Supports single-hop and two-hop (via WETH) routes.
 */
import { TradeType } from '@uniswap/sdk-core'
import { LIGHTLINK_ADDRESSES, LIGHTLINK_CHAIN_ID } from 'constants/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import { Contract } from 'ethers'
import { GetQuoteArgs, QuoteState, SwapRouterNativeAssets, URAQuoteType } from 'state/routing/types'

const QUOTER_V2_ABI = [
  'function quoteExactInputSingle(tuple(address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96) params) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
  'function quoteExactOutputSingle(tuple(address tokenIn, address tokenOut, uint256 amount, uint24 fee, uint160 sqrtPriceLimitX96) params) external returns (uint256 amountIn, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
]

const POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function liquidity() external view returns (uint128)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function fee() external view returns (uint24)',
]

const FEE_TIERS = [500, 3000, 10000] // 0.05%, 0.3%, 1%
const WETH = LIGHTLINK_ADDRESSES.WETH.toLowerCase()

function getProvider() {
  return RPC_PROVIDERS[LIGHTLINK_CHAIN_ID]
}

function getQuoter() {
  return new Contract(LIGHTLINK_ADDRESSES.QUOTER_V2, QUOTER_V2_ABI, getProvider())
}

function resolveAddress(address: string): string {
  const isNative = Object.values(SwapRouterNativeAssets).includes(address as SwapRouterNativeAssets)
  return isNative ? LIGHTLINK_ADDRESSES.WETH : address
}

function computePoolAddress(tokenA: string, tokenB: string, fee: number): string {
  // Use CREATE2 to compute the pool address deterministically
  const { utils } = require('ethers')
  const [token0, token1] = tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA]
  const salt = utils.solidityKeccak256(['address', 'address', 'uint24'], [token0, token1, fee])
  const POOL_INIT_CODE_HASH = '0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54'
  return utils.getCreate2Address(LIGHTLINK_ADDRESSES.V3_CORE_FACTORY, salt, POOL_INIT_CODE_HASH)
}

interface QuoteResult {
  amountOut: string
  fee: number
  sqrtPriceX96: string
  liquidity: string
  tick: number
  poolAddress: string
  gasEstimate: string
}

async function tryQuoteSingleHop(
  tokenIn: string,
  tokenOut: string,
  amount: string,
  tradeType: TradeType
): Promise<QuoteResult | null> {
  const quoter = getQuoter()
  const provider = getProvider()

  for (const fee of FEE_TIERS) {
    try {
      const poolAddress = computePoolAddress(tokenIn, tokenOut, fee)
      const poolContract = new Contract(poolAddress, POOL_ABI, provider)

      // Check if pool exists by reading slot0
      const [slot0, poolLiquidity] = await Promise.all([
        poolContract.slot0(),
        poolContract.liquidity(),
      ])

      if (poolLiquidity.isZero()) continue

      let result: any
      if (tradeType === TradeType.EXACT_INPUT) {
        result = await quoter.callStatic.quoteExactInputSingle({
          tokenIn,
          tokenOut,
          amountIn: amount,
          fee,
          sqrtPriceLimitX96: 0,
        })
      } else {
        result = await quoter.callStatic.quoteExactOutputSingle({
          tokenIn,
          tokenOut,
          amount,
          fee,
          sqrtPriceLimitX96: 0,
        })
      }

      const quoteAmount = result[0].toString()
      if (quoteAmount === '0') continue

      return {
        amountOut: quoteAmount,
        fee,
        sqrtPriceX96: slot0.sqrtPriceX96.toString(),
        liquidity: poolLiquidity.toString(),
        tick: slot0.tick,
        poolAddress,
        gasEstimate: result[3]?.toString() ?? '150000',
      }
    } catch {
      // Pool doesn't exist or quote failed for this fee tier
      continue
    }
  }
  return null
}

async function tryQuoteTwoHop(
  tokenIn: string,
  tokenOut: string,
  amount: string,
  tradeType: TradeType
): Promise<{ hop1: QuoteResult; hop2: QuoteResult } | null> {
  // Only try two-hop if neither token is WETH
  if (tokenIn.toLowerCase() === WETH || tokenOut.toLowerCase() === WETH) return null

  if (tradeType !== TradeType.EXACT_INPUT) return null // Two-hop only for exact input for simplicity

  // First hop: tokenIn -> WETH
  const hop1 = await tryQuoteSingleHop(tokenIn, LIGHTLINK_ADDRESSES.WETH, amount, TradeType.EXACT_INPUT)
  if (!hop1) return null

  // Second hop: WETH -> tokenOut
  const hop2 = await tryQuoteSingleHop(LIGHTLINK_ADDRESSES.WETH, tokenOut, hop1.amountOut, TradeType.EXACT_INPUT)
  if (!hop2) return null

  return { hop1, hop2 }
}

/**
 * Get a quote for a LightLink swap by calling QuoterV2 directly.
 * Returns a response shaped like the Uniswap Routing API (URAClassicQuoteResponse).
 */
export async function getLightLinkQuote(args: GetQuoteArgs) {
  const tokenIn = resolveAddress(args.tokenInAddress)
  const tokenOut = resolveAddress(args.tokenOutAddress)
  const tradeType = args.tradeType as unknown as TradeType
  const isExactIn = tradeType === TradeType.EXACT_INPUT
  const provider = getProvider()
  const blockNumber = await provider.getBlockNumber()

  // Try single-hop first
  const singleHop = await tryQuoteSingleHop(tokenIn, tokenOut, args.amount, tradeType)
  if (singleHop) {
    const [token0addr, token1addr] =
      tokenIn.toLowerCase() < tokenOut.toLowerCase() ? [tokenIn, tokenOut] : [tokenOut, tokenIn]

    return {
      state: QuoteState.SUCCESS,
      data: {
        routing: URAQuoteType.CLASSIC as const,
        quote: {
          blockNumber: blockNumber.toString(),
          amount: args.amount,
          amountDecimals: '',
          quote: singleHop.amountOut,
          quoteDecimals: '',
          quoteGasAdjusted: singleHop.amountOut,
          quoteGasAdjustedDecimals: '',
          gasUseEstimate: singleHop.gasEstimate,
          gasUseEstimateQuote: '0',
          gasUseEstimateQuoteDecimals: '0',
          gasUseEstimateUSD: '0',
          gasPriceWei: '100000000',
          route: [[{
            type: 'v3-pool' as const,
            address: singleHop.poolAddress,
            tokenIn: {
              address: tokenIn,
              chainId: LIGHTLINK_CHAIN_ID,
              decimals: args.tokenInDecimals,
              symbol: args.tokenInSymbol,
            },
            tokenOut: {
              address: tokenOut,
              chainId: LIGHTLINK_CHAIN_ID,
              decimals: args.tokenOutDecimals,
              symbol: args.tokenOutSymbol,
            },
            fee: singleHop.fee.toString(),
            sqrtRatioX96: singleHop.sqrtPriceX96,
            liquidity: singleHop.liquidity,
            tickCurrent: singleHop.tick.toString(),
            amountIn: isExactIn ? args.amount : singleHop.amountOut,
            amountOut: isExactIn ? singleHop.amountOut : args.amount,
          }]],
          routeString: `${args.tokenInSymbol} -- ${singleHop.fee / 10000}% --> ${args.tokenOutSymbol}`,
        },
        allQuotes: [],
      },
    }
  }

  // Try two-hop via WETH
  const twoHop = await tryQuoteTwoHop(tokenIn, tokenOut, args.amount, tradeType)
  if (twoHop) {
    return {
      state: QuoteState.SUCCESS,
      data: {
        routing: URAQuoteType.CLASSIC as const,
        quote: {
          blockNumber: blockNumber.toString(),
          amount: args.amount,
          amountDecimals: '',
          quote: twoHop.hop2.amountOut,
          quoteDecimals: '',
          quoteGasAdjusted: twoHop.hop2.amountOut,
          quoteGasAdjustedDecimals: '',
          gasUseEstimate: (parseInt(twoHop.hop1.gasEstimate) + parseInt(twoHop.hop2.gasEstimate)).toString(),
          gasUseEstimateQuote: '0',
          gasUseEstimateQuoteDecimals: '0',
          gasUseEstimateUSD: '0',
          gasPriceWei: '100000000',
          route: [[
            {
              type: 'v3-pool' as const,
              address: twoHop.hop1.poolAddress,
              tokenIn: {
                address: tokenIn,
                chainId: LIGHTLINK_CHAIN_ID,
                decimals: args.tokenInDecimals,
                symbol: args.tokenInSymbol,
              },
              tokenOut: {
                address: LIGHTLINK_ADDRESSES.WETH,
                chainId: LIGHTLINK_CHAIN_ID,
                decimals: 18,
                symbol: 'WETH',
              },
              fee: twoHop.hop1.fee.toString(),
              sqrtRatioX96: twoHop.hop1.sqrtPriceX96,
              liquidity: twoHop.hop1.liquidity,
              tickCurrent: twoHop.hop1.tick.toString(),
              amountIn: args.amount,
              amountOut: twoHop.hop1.amountOut,
            },
            {
              type: 'v3-pool' as const,
              address: twoHop.hop2.poolAddress,
              tokenIn: {
                address: LIGHTLINK_ADDRESSES.WETH,
                chainId: LIGHTLINK_CHAIN_ID,
                decimals: 18,
                symbol: 'WETH',
              },
              tokenOut: {
                address: tokenOut,
                chainId: LIGHTLINK_CHAIN_ID,
                decimals: args.tokenOutDecimals,
                symbol: args.tokenOutSymbol,
              },
              fee: twoHop.hop2.fee.toString(),
              sqrtRatioX96: twoHop.hop2.sqrtPriceX96,
              liquidity: twoHop.hop2.liquidity,
              tickCurrent: twoHop.hop2.tick.toString(),
              amountIn: twoHop.hop1.amountOut,
              amountOut: twoHop.hop2.amountOut,
            },
          ]],
          routeString: `${args.tokenInSymbol} -- ${twoHop.hop1.fee / 10000}% --> WETH -- ${twoHop.hop2.fee / 10000}% --> ${args.tokenOutSymbol}`,
        },
        allQuotes: [],
      },
    }
  }

  return { state: QuoteState.NOT_FOUND }
}
