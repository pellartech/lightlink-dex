import { useEffect, useMemo, useState } from 'react'
import { LIGHTLINK_CHAIN_ID } from 'constants/chains'
import { Token } from '@uniswap/sdk-core'
import { LIGHTLINK_TOKEN_LOGOS } from 'constants/tokenLogos'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

const SUBGRAPH_URL = 'https://graph.phoenix.lightlink.io/query/subgraphs/name/uniswap-v3-lightlink'

export interface LightLinkTokenData {
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
    open: string
    high: string
    low: string
    close: string
    volumeUSD: string
  }>
}

interface LightLinkTokenQueryResult {
  token: WrappedTokenInfo | undefined
  tokenData: LightLinkTokenData | undefined
  loading: boolean
  error: boolean
}

const TOKEN_QUERY = `
  query LightLinkToken($id: ID!) {
    token(id: $id) {
      id
      symbol
      name
      decimals
      volumeUSD
      totalValueLockedUSD
      derivedETH
      tokenDayData(first: 365, orderBy: date, orderDirection: desc) {
        date
        priceUSD
        open
        high
        low
        close
        volumeUSD
      }
    }
  }
`

async function fetchLightLinkToken(address: string): Promise<LightLinkTokenData | null> {
  const response = await fetch(SUBGRAPH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: TOKEN_QUERY,
      variables: { id: address.toLowerCase() },
    }),
  })
  const json = await response.json()
  return json.data?.token ?? null
}

export function useLightLinkToken(address: string | undefined): LightLinkTokenQueryResult {
  const [tokenData, setTokenData] = useState<LightLinkTokenData | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!address) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(false)

    fetchLightLinkToken(address)
      .then((data) => {
        if (cancelled) return
        setTokenData(data ?? undefined)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [address])

  const token = useMemo(() => {
    if (!tokenData || !address) return undefined
    const logoUrl = LIGHTLINK_TOKEN_LOGOS[address.toLowerCase()]
    return new WrappedTokenInfo({
      chainId: LIGHTLINK_CHAIN_ID,
      address,
      decimals: parseInt(tokenData.decimals),
      symbol: tokenData.symbol,
      name: tokenData.name,
      logoURI: logoUrl,
    })
  }, [tokenData, address])

  return { token, tokenData, loading, error }
}
