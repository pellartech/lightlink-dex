import { LIGHTLINK_CHAIN_ID } from 'constants/chains'
import { LIGHTLINK_TOKEN_LOGOS } from 'constants/tokenLogos'
import { useCallback, useEffect, useMemo, useState } from 'react'

const SUBGRAPH_URL = 'https://graph.phoenix.lightlink.io/query/subgraphs/name/uniswap-v3-lightlink'

export interface LightLinkActivity {
  hash: string
  chainId: number
  status: 'confirmed'
  timestamp: number
  title: string
  descriptor: string
  logos: (string | undefined)[]
  from: string
  nonce?: number
}

const ACTIVITY_QUERY = `
  query LightLinkActivity($account: Bytes!) {
    swaps(
      first: 50,
      orderBy: timestamp,
      orderDirection: desc,
      where: { origin: $account }
    ) {
      id
      timestamp
      amount0
      amount1
      amountUSD
      token0 { id symbol name decimals }
      token1 { id symbol name decimals }
      transaction { id }
      origin
    }
    mints(
      first: 20,
      orderBy: timestamp,
      orderDirection: desc,
      where: { origin: $account }
    ) {
      id
      timestamp
      amount0
      amount1
      amountUSD
      token0 { id symbol name decimals }
      token1 { id symbol name decimals }
      transaction { id }
      origin
    }
    burns(
      first: 20,
      orderBy: timestamp,
      orderDirection: desc,
      where: { origin: $account }
    ) {
      id
      timestamp
      amount0
      amount1
      amountUSD
      token0 { id symbol name decimals }
      token1 { id symbol name decimals }
      transaction { id }
      origin
    }
  }
`

interface SubgraphSwap {
  id: string
  timestamp: string
  amount0: string
  amount1: string
  amountUSD: string
  token0: { id: string; symbol: string; name: string; decimals: string }
  token1: { id: string; symbol: string; name: string; decimals: string }
  transaction: { id: string }
  origin: string
}

interface SubgraphMintBurn {
  id: string
  timestamp: string
  amount0: string
  amount1: string
  amountUSD: string
  token0: { id: string; symbol: string; name: string; decimals: string }
  token1: { id: string; symbol: string; name: string; decimals: string }
  transaction: { id: string }
  origin: string
}

function formatAmount(value: string): string {
  const num = Math.abs(parseFloat(value))
  if (num === 0) return '0'
  if (num < 0.001) return '<0.001'
  if (num < 1) return num.toFixed(4)
  if (num < 1000) return num.toFixed(2)
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

function swapToActivity(swap: SubgraphSwap): LightLinkActivity {
  const amount0 = parseFloat(swap.amount0)
  const amount1 = parseFloat(swap.amount1)
  // In Uniswap V3 subgraph: negative amount = token sent out of pool (user receives)
  const tokenIn = amount0 > 0 ? swap.token0 : swap.token1
  const tokenOut = amount0 > 0 ? swap.token1 : swap.token0
  const amountIn = amount0 > 0 ? swap.amount0 : swap.amount1
  const amountOut = amount0 > 0 ? swap.amount1 : swap.amount0

  return {
    hash: swap.transaction.id,
    chainId: LIGHTLINK_CHAIN_ID,
    status: 'confirmed',
    timestamp: parseInt(swap.timestamp),
    title: 'Swapped',
    descriptor: `${formatAmount(amountIn)} ${tokenIn.symbol} for ${formatAmount(amountOut)} ${tokenOut.symbol}`,
    logos: [
      LIGHTLINK_TOKEN_LOGOS[tokenIn.id.toLowerCase()],
      LIGHTLINK_TOKEN_LOGOS[tokenOut.id.toLowerCase()],
    ],
    from: swap.origin,
  }
}

function mintToActivity(mint: SubgraphMintBurn): LightLinkActivity {
  return {
    hash: mint.transaction.id,
    chainId: LIGHTLINK_CHAIN_ID,
    status: 'confirmed',
    timestamp: parseInt(mint.timestamp),
    title: 'Added Liquidity',
    descriptor: `${formatAmount(mint.amount0)} ${mint.token0.symbol} and ${formatAmount(mint.amount1)} ${mint.token1.symbol}`,
    logos: [
      LIGHTLINK_TOKEN_LOGOS[mint.token0.id.toLowerCase()],
      LIGHTLINK_TOKEN_LOGOS[mint.token1.id.toLowerCase()],
    ],
    from: mint.origin,
  }
}

function burnToActivity(burn: SubgraphMintBurn): LightLinkActivity {
  return {
    hash: burn.transaction.id,
    chainId: LIGHTLINK_CHAIN_ID,
    status: 'confirmed',
    timestamp: parseInt(burn.timestamp),
    title: 'Removed Liquidity',
    descriptor: `${formatAmount(burn.amount0)} ${burn.token0.symbol} and ${formatAmount(burn.amount1)} ${burn.token1.symbol}`,
    logos: [
      LIGHTLINK_TOKEN_LOGOS[burn.token0.id.toLowerCase()],
      LIGHTLINK_TOKEN_LOGOS[burn.token1.id.toLowerCase()],
    ],
    from: burn.origin,
  }
}

async function fetchActivity(account: string): Promise<{
  swaps: SubgraphSwap[]
  mints: SubgraphMintBurn[]
  burns: SubgraphMintBurn[]
}> {
  const response = await fetch(SUBGRAPH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: ACTIVITY_QUERY,
      variables: { account: account.toLowerCase() },
    }),
  })
  const json = await response.json()
  return {
    swaps: json.data?.swaps ?? [],
    mints: json.data?.mints ?? [],
    burns: json.data?.burns ?? [],
  }
}

export function useLightLinkActivity(account: string | undefined) {
  const [rawData, setRawData] = useState<{
    swaps: SubgraphSwap[]
    mints: SubgraphMintBurn[]
    burns: SubgraphMintBurn[]
  }>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!account) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetchActivity(account).then((data) => {
      if (!cancelled) {
        setRawData(data)
        setLoading(false)
      }
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [account])

  const activities = useMemo(() => {
    if (!rawData) return undefined

    const all: LightLinkActivity[] = [
      ...rawData.swaps.map(swapToActivity),
      ...rawData.mints.map(mintToActivity),
      ...rawData.burns.map(burnToActivity),
    ]

    // Sort by timestamp descending
    all.sort((a, b) => b.timestamp - a.timestamp)

    // Deduplicate by transaction hash (multiple events can share a tx)
    const seen = new Set<string>()
    return all.filter((a) => {
      if (seen.has(a.hash)) return false
      seen.add(a.hash)
      return true
    })
  }, [rawData])

  const refetch = useCallback(() => {
    if (!account) return
    setLoading(true)
    fetchActivity(account).then(setRawData).finally(() => setLoading(false))
  }, [account])

  return { activities, loading, refetch }
}


