import { filterStringAtom, filterTimeAtom, sortAscendingAtom, sortMethodAtom, TokenSortMethod } from 'components/Tokens/state'
import { LIGHTLINK_TOKEN_LOGOS } from 'constants/tokenLogos'
import { useAtomValue } from 'jotai/utils'
import { useEffect, useMemo, useState } from 'react'
import { PricePoint } from 'graphql/data/util'
import { SparklineMap, TopToken } from 'graphql/data/TopTokens'

const SUBGRAPH_URL = 'https://graph.phoenix.lightlink.io/query/subgraphs/name/uniswap-v3-lightlink'

interface SubgraphToken {
  id: string
  symbol: string
  name: string
  decimals: string
  volumeUSD: string
  totalValueLockedUSD: string
  derivedETH: string
  tokenDayData: Array<{
    date: number
    priceUSD: string
    volumeUSD: string
  }>
}

const TOP_TOKENS_QUERY = `
{
  tokens(first: 100, orderBy: totalValueLockedUSD, orderDirection: desc) {
    id
    symbol
    name
    decimals
    volumeUSD
    totalValueLockedUSD
    derivedETH
    tokenDayData(first: 7, orderBy: date, orderDirection: desc) {
      date
      priceUSD
      volumeUSD
    }
  }
}
`

async function fetchTopTokens(): Promise<SubgraphToken[]> {
  const response = await fetch(SUBGRAPH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: TOP_TOKENS_QUERY }),
  })
  const json = await response.json()
  return json.data?.tokens ?? []
}

/**
 * Convert subgraph token to the TopToken shape expected by TokenRow/TokenTable.
 * We map fields into the GraphQL-like structure so existing components can render them.
 */
function toTopToken(t: SubgraphToken): NonNullable<TopToken> {
  const currentPrice = t.tokenDayData?.[0] ? parseFloat(t.tokenDayData[0].priceUSD) : 0
  const prevPrice = t.tokenDayData?.[1] ? parseFloat(t.tokenDayData[1].priceUSD) : 0
  const pricePercentChange = prevPrice > 0 ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0

  // Calculate 24h volume from latest day data
  const volume24h = t.tokenDayData?.[0] ? parseFloat(t.tokenDayData[0].volumeUSD) : 0

  return {
    id: t.id,
    name: t.name,
    chain: 'LIGHTLINK' as any, // Custom marker for LightLink
    address: t.id,
    symbol: t.symbol,
    standard: null,
    market: {
      id: `${t.id}-market`,
      totalValueLocked: {
        id: `${t.id}-tvl`,
        value: parseFloat(t.totalValueLockedUSD),
        currency: 'USD' as any,
      },
      price: {
        id: `${t.id}-price`,
        value: currentPrice,
        currency: 'USD' as any,
      },
      pricePercentChange: {
        id: `${t.id}-ppc`,
        currency: 'USD' as any,
        value: pricePercentChange,
      },
      volume: {
        id: `${t.id}-vol`,
        value: volume24h,
        currency: 'USD' as any,
      },
    },
    project: {
      id: `${t.id}-project`,
      logoUrl: LIGHTLINK_TOKEN_LOGOS[t.id.toLowerCase()] ?? null,
    },
  } as NonNullable<TopToken>
}

function useSortedTokens(tokens: NonNullable<TopToken>[] | undefined) {
  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)

  return useMemo(() => {
    if (!tokens) return undefined

    const sorted = [...tokens].sort((a, b) => {
      switch (sortMethod) {
        case TokenSortMethod.PRICE:
          return (b.market?.price?.value ?? 0) - (a.market?.price?.value ?? 0)
        case TokenSortMethod.PERCENT_CHANGE:
          return (b.market?.pricePercentChange?.value ?? 0) - (a.market?.pricePercentChange?.value ?? 0)
        case TokenSortMethod.TOTAL_VALUE_LOCKED:
          return (b.market?.totalValueLocked?.value ?? 0) - (a.market?.totalValueLocked?.value ?? 0)
        case TokenSortMethod.VOLUME:
          return (b.market?.volume?.value ?? 0) - (a.market?.volume?.value ?? 0)
        default:
          return (b.market?.totalValueLocked?.value ?? 0) - (a.market?.totalValueLocked?.value ?? 0)
      }
    })

    return sortAscending ? sorted.reverse() : sorted
  }, [tokens, sortMethod, sortAscending])
}

function useFilteredTokens(tokens: NonNullable<TopToken>[] | undefined) {
  const filterString = useAtomValue(filterStringAtom)
  const lowercaseFilterString = useMemo(() => filterString.toLowerCase(), [filterString])

  return useMemo(() => {
    if (!tokens) return undefined
    if (!lowercaseFilterString) return tokens
    return tokens.filter((token) => {
      return (
        token.name?.toLowerCase().includes(lowercaseFilterString) ||
        token.symbol?.toLowerCase().includes(lowercaseFilterString) ||
        token.address?.toLowerCase().includes(lowercaseFilterString)
      )
    })
  }, [tokens, lowercaseFilterString])
}

interface UseLightLinkTopTokensReturn {
  tokens?: readonly NonNullable<TopToken>[]
  tokenSortRank: Record<string, number>
  loadingTokens: boolean
  sparklines: SparklineMap
}

export function useLightLinkTopTokens(): UseLightLinkTopTokensReturn {
  const [rawTokens, setRawTokens] = useState<SubgraphToken[]>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchTopTokens()
      .then((tokens) => {
        if (!cancelled) {
          setRawTokens(tokens)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const topTokens = useMemo(() => rawTokens?.map(toTopToken), [rawTokens])
  const sorted = useSortedTokens(topTokens)
  const filtered = useFilteredTokens(sorted)

  const tokenSortRank = useMemo(
    () =>
      sorted?.reduce((acc, cur, i) => {
        if (!cur.address) return acc
        return { ...acc, [cur.address]: i + 1 }
      }, {} as Record<string, number>) ?? {},
    [sorted]
  )

  // Build sparklines from tokenDayData
  const sparklines = useMemo(() => {
    const map: SparklineMap = {}
    rawTokens?.forEach((t) => {
      if (t.tokenDayData?.length) {
        map[t.id] = [...t.tokenDayData]
          .reverse()
          .map((d) => ({ timestamp: d.date, value: parseFloat(d.priceUSD) }))
          .filter((p) => p.value > 0)
      }
    })
    return map
  }, [rawTokens])

  return { tokens: filtered, tokenSortRank, loadingTokens: loading, sparklines }
}
