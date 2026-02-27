/**
 * Fetches top tokens from LightLink subgraph instead of Uniswap's backend API.
 * Returns data in the same shape as useTopTokens for compatibility with TokenTable.
 */
import { filterStringAtom, sortAscendingAtom, sortMethodAtom, TokenSortMethod } from 'components/Tokens/state'
import { useAtomValue } from 'jotai/utils'
import { useEffect, useMemo, useState } from 'react'

import { LIGHTLINK_CHAIN_ID } from 'constants/chains'
import { LIGHTLINK_TOKEN_LOGOS } from 'constants/tokenLogos'
import { Chain } from './__generated__/types-and-hooks'
import type { SparklineMap, TopToken } from './TopTokens'

const SUBGRAPH_URL = 'https://graph.phoenix.lightlink.io/query/subgraphs/name/uniswap-v3-lightlink'

interface SubgraphToken {
  id: string
  symbol: string
  name: string
  decimals: string
  totalValueLockedUSD: string
  volumeUSD: string
  txCount: string
  tokenDayData: Array<{
    priceUSD: string
    date: number
  }>
}

const TOKENS_QUERY = `{
  tokens(first: 50, orderBy: volumeUSD, orderDirection: desc, where: { volumeUSD_gt: "0" }) {
    id
    symbol
    name
    decimals
    totalValueLockedUSD
    volumeUSD
    txCount
    tokenDayData(first: 2, orderBy: date, orderDirection: desc) {
      priceUSD
      date
    }
  }
  bundles(first: 1) {
    ethPriceUSD
  }
}`

// For tokens with priceUSD=0 (derivedETH not set in subgraph), compute price from pool sqrtPrice
const POOL_PRICE_QUERY = (tokenId: string) => `{
  pools(first: 1, orderBy: liquidity, orderDirection: desc, where: {
    or: [
      { token0: "${tokenId}", liquidity_gt: "0" },
      { token1: "${tokenId}", liquidity_gt: "0" }
    ]
  }) {
    token0 { id decimals }
    token1 { id decimals }
    sqrtPrice
  }
}`

// Known WETH address on LightLink
const WETH_ADDRESS = '0x7ebef2a4b1b09381ec5b9df8c5c6f2dbeca59c73'

function priceFromSqrtPrice(
  sqrtPrice: string,
  tokenId: string,
  token0: { id: string; decimals: string },
  token1: { id: string; decimals: string },
  ethPriceUSD: number
): number | undefined {
  const sqrtPriceNum = parseFloat(sqrtPrice)
  if (sqrtPriceNum === 0) return undefined

  const Q96 = 2 ** 96
  const ratio = (sqrtPriceNum / Q96) ** 2

  const dec0 = parseInt(token0.decimals)
  const dec1 = parseInt(token1.decimals)
  // ratio = (token1_amount / 10^dec1) / (token0_amount / 10^dec0) adjusted
  const adjustedRatio = ratio * 10 ** (dec0 - dec1)

  const isToken0 = token0.id.toLowerCase() === tokenId.toLowerCase()
  // If our token is token0, price in token1 = adjustedRatio
  // If our token is token1, price in token0 = 1/adjustedRatio
  const priceInOther = isToken0 ? adjustedRatio : 1 / adjustedRatio

  // Check if the other token is WETH to convert to USD
  const otherTokenId = isToken0 ? token1.id : token0.id
  if (otherTokenId.toLowerCase() === WETH_ADDRESS.toLowerCase()) {
    return priceInOther * ethPriceUSD
  }
  // If paired with a stablecoin, the ratio is already ~USD
  return priceInOther
}

function toTopToken(token: SubgraphToken, fallbackPrice?: number): TopToken {
  let currentPrice = token.tokenDayData?.[0]?.priceUSD ? parseFloat(token.tokenDayData[0].priceUSD) : undefined
  if ((!currentPrice || currentPrice === 0) && fallbackPrice) currentPrice = fallbackPrice
  const yesterdayPrice = token.tokenDayData?.[1]?.priceUSD ? parseFloat(token.tokenDayData[1].priceUSD) : undefined
  const percentChange = currentPrice && yesterdayPrice && yesterdayPrice > 0
    ? ((currentPrice - yesterdayPrice) / yesterdayPrice) * 100
    : undefined

  const checksummedAddress = token.id
  const logoUrl = LIGHTLINK_TOKEN_LOGOS[token.id.toLowerCase()]

  return {
    id: token.id,
    name: token.name,
    symbol: token.symbol,
    address: checksummedAddress,
    chain: Chain.Ethereum, // placeholder — TokenRow uses this for routing
    standard: null,
    market: {
      id: `${token.id}-market`,
      totalValueLocked: {
        id: `${token.id}-tvl`,
        value: parseFloat(token.totalValueLockedUSD),
        currency: null,
      },
      price: {
        id: `${token.id}-price`,
        value: currentPrice ?? 0,
        currency: null,
      },
      pricePercentChange: {
        id: `${token.id}-pct`,
        value: percentChange ?? 0,
        currency: null,
      },
      volume: {
        id: `${token.id}-vol`,
        value: parseFloat(token.volumeUSD),
        currency: null,
      },
    },
    project: {
      id: `${token.id}-project`,
      logoUrl: logoUrl ?? null,
    },
  } as TopToken
}

export function useLightLinkTopTokens(): {
  tokens?: readonly TopToken[]
  tokenSortRank: Record<string, number>
  loadingTokens: boolean
  sparklines: SparklineMap
} {
  const [tokens, setTokens] = useState<SubgraphToken[]>([])
  const [loading, setLoading] = useState(true)

  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)
  const filterString = useAtomValue(filterStringAtom)

  const [fallbackPrices, setFallbackPrices] = useState<Record<string, number>>({})

  useEffect(() => {
    let cancelled = false
    fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: TOKENS_QUERY }),
    })
      .then((res) => res.json())
      .then(async (data) => {
        if (cancelled) return
        const fetchedTokens: SubgraphToken[] = data?.data?.tokens ?? []
        const ethPriceUSD = parseFloat(data?.data?.bundles?.[0]?.ethPriceUSD ?? '0')
        setTokens(fetchedTokens)

        // For tokens with no price, compute from pool sqrtPrice
        const zeroPriceTokens = fetchedTokens.filter(
          (t) => !t.tokenDayData?.[0]?.priceUSD || parseFloat(t.tokenDayData[0].priceUSD) === 0
        )
        const prices: Record<string, number> = {}
        await Promise.all(
          zeroPriceTokens.map(async (t) => {
            try {
              const res = await fetch(SUBGRAPH_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: POOL_PRICE_QUERY(t.id.toLowerCase()) }),
              })
              const poolData = await res.json()
              const pool = poolData?.data?.pools?.[0]
              if (pool?.sqrtPrice && pool.sqrtPrice !== '0') {
                const price = priceFromSqrtPrice(pool.sqrtPrice, t.id, pool.token0, pool.token1, ethPriceUSD)
                if (price && price > 0) prices[t.id.toLowerCase()] = price
              }
            } catch {
              // ignore
            }
          })
        )
        if (!cancelled) setFallbackPrices(prices)
        setLoading(false)
      })
      .catch(() => setLoading(false))
    return () => { cancelled = true }
  }, [])

  const topTokens = useMemo(
    () => tokens.map((t) => toTopToken(t, fallbackPrices[t.id.toLowerCase()])),
    [tokens, fallbackPrices]
  )

  const filtered = useMemo(() => {
    if (!filterString) return topTokens
    const lower = filterString.toLowerCase()
    return topTokens.filter(
      (t) =>
        t.name?.toLowerCase().includes(lower) ||
        t.symbol?.toLowerCase().includes(lower) ||
        t.address?.toLowerCase().includes(lower)
    )
  }, [topTokens, filterString])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      switch (sortMethod) {
        case TokenSortMethod.PRICE:
          return (b.market?.price?.value ?? 0) - (a.market?.price?.value ?? 0)
        case TokenSortMethod.PERCENT_CHANGE:
          return (b.market?.pricePercentChange?.value ?? 0) - (a.market?.pricePercentChange?.value ?? 0)
        case TokenSortMethod.TOTAL_VALUE_LOCKED:
          return (b.market?.totalValueLocked?.value ?? 0) - (a.market?.totalValueLocked?.value ?? 0)
        case TokenSortMethod.VOLUME:
        default:
          return (b.market?.volume?.value ?? 0) - (a.market?.volume?.value ?? 0)
      }
    })
    return sortAscending ? arr.reverse() : arr
  }, [filtered, sortMethod, sortAscending])

  const tokenSortRank = useMemo(
    () =>
      sorted.reduce((acc, cur, i) => {
        if (cur.address) acc[cur.address] = i + 1
        return acc
      }, {} as Record<string, number>),
    [sorted]
  )

  return { tokens: sorted, tokenSortRank, loadingTokens: loading, sparklines: {} }
}
