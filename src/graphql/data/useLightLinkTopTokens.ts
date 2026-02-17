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

const QUERY = `{
  tokens(first: 50, orderBy: volumeUSD, orderDirection: desc, where: { totalValueLockedUSD_gt: "0" }) {
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
}`

function toTopToken(token: SubgraphToken): TopToken {
  const currentPrice = token.tokenDayData?.[0]?.priceUSD ? parseFloat(token.tokenDayData[0].priceUSD) : undefined
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

  useEffect(() => {
    let cancelled = false
    fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.data?.tokens) {
          setTokens(data.data.tokens)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
    return () => { cancelled = true }
  }, [])

  const topTokens = useMemo(() => tokens.map(toTopToken), [tokens])

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
