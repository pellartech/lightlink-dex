import { LIGHTLINK_CHAIN_ID } from 'constants/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import { LIGHTLINK_TOKEN_LOGOS } from 'constants/tokenLogos'
import { Contract } from 'ethers'
import { useCallback, useEffect, useMemo, useState } from 'react'

const SUBGRAPH_URL = 'https://graph.phoenix.lightlink.io/query/subgraphs/name/uniswap-v3-lightlink'

const ERC20_BALANCE_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
]

interface SubgraphToken {
  id: string
  symbol: string
  name: string
  decimals: string
  derivedETH: string
  totalValueLockedUSD: string
  tokenDayData: Array<{
    date: number
    priceUSD: string
  }>
}

export interface LightLinkTokenBalance {
  id: string
  token: {
    id: string
    chain: string
    address: string
    name: string
    symbol: string
    decimals: number
    logoUrl: string | null
  }
  quantity: number
  denominatedValue: {
    value: number
    currency: string
  }
  tokenProjectMarket: {
    pricePercentChange: {
      value: number
    }
    tokenProject: {
      logoUrl: string | null
      isSpam: boolean
    }
  }
}

const TOKENS_QUERY = `
{
  tokens(first: 100, orderBy: totalValueLockedUSD, orderDirection: desc) {
    id
    symbol
    name
    decimals
    derivedETH
    totalValueLockedUSD
    tokenDayData(first: 2, orderBy: date, orderDirection: desc) {
      date
      priceUSD
    }
  }
}
`

async function fetchSubgraphTokens(): Promise<SubgraphToken[]> {
  const response = await fetch(SUBGRAPH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: TOKENS_QUERY }),
  })
  const json = await response.json()
  return json.data?.tokens ?? []
}

interface UseLightLinkBalancesReturn {
  tokenBalances: LightLinkTokenBalance[] | undefined
  totalBalance: number | undefined
  loading: boolean
}

export function useLightLinkBalances(account: string | undefined): UseLightLinkBalancesReturn {
  // Always use the LightLink RPC provider directly, regardless of which chain the wallet is on
  const lightlinkProvider = RPC_PROVIDERS[LIGHTLINK_CHAIN_ID]
  const [subgraphTokens, setSubgraphTokens] = useState<SubgraphToken[]>()
  const [balances, setBalances] = useState<Map<string, number>>()
  const [loading, setLoading] = useState(true)

  // 1. Fetch token list + prices from subgraph
  useEffect(() => {
    let cancelled = false
    fetchSubgraphTokens().then((tokens) => {
      if (!cancelled) setSubgraphTokens(tokens)
    })
    return () => { cancelled = true }
  }, [])

  // 2. Fetch ERC-20 balances via LightLink RPC
  const fetchBalances = useCallback(async () => {
    if (!account || !lightlinkProvider || !subgraphTokens) return

    setLoading(true)
    const balanceMap = new Map<string, number>()

    // Fetch native ETH balance on LightLink
    try {
      const ethBalance = await lightlinkProvider.getBalance(account)
      const ethValue = parseFloat(ethBalance.toString()) / 1e18
      if (ethValue > 0) {
        balanceMap.set('native', ethValue)
      }
    } catch (e) {
      console.warn('Failed to fetch ETH balance on LightLink', e)
    }

    // Fetch ERC-20 balances in parallel via LightLink RPC
    const promises = subgraphTokens.map(async (token) => {
      try {
        const contract = new Contract(token.id, ERC20_BALANCE_ABI, lightlinkProvider)
        const balance = await contract.balanceOf(account)
        const decimals = parseInt(token.decimals)
        const value = parseFloat(balance.toString()) / Math.pow(10, decimals)
        if (value > 0) {
          balanceMap.set(token.id.toLowerCase(), value)
        }
      } catch (e) {
        // Token may not implement balanceOf correctly, skip
      }
    })

    await Promise.all(promises)
    setBalances(balanceMap)
    setLoading(false)
  }, [account, lightlinkProvider, subgraphTokens])

  useEffect(() => {
    fetchBalances()
  }, [fetchBalances])

  // 3. Combine balances with price data
  const { tokenBalances, totalBalance } = useMemo(() => {
    if (!subgraphTokens || !balances) return { tokenBalances: undefined, totalBalance: undefined }

    const results: LightLinkTokenBalance[] = []
    let total = 0

    // Handle native ETH
    const nativeBalance = balances.get('native')
    if (nativeBalance && nativeBalance > 0) {
      // Find WETH token data for pricing
      const wethToken = subgraphTokens.find(
        (t) => t.symbol === 'WETH' || t.id.toLowerCase() === '0x7ebef2a4b1b09381ec5b9df8c5c6f2dbeca59c73'
      )
      const currentPrice = wethToken?.tokenDayData?.[0] ? parseFloat(wethToken.tokenDayData[0].priceUSD) : 0
      const prevPrice = wethToken?.tokenDayData?.[1] ? parseFloat(wethToken.tokenDayData[1].priceUSD) : 0
      const priceChange = prevPrice > 0 ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0
      const value = nativeBalance * currentPrice

      if (value > 0.01) {
        total += value
        results.push({
          id: 'native-eth',
          token: {
            id: 'native-eth',
            chain: 'LIGHTLINK',
            address: 'native',
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
            logoUrl: LIGHTLINK_TOKEN_LOGOS['0x7ebef2a4b1b09381ec5b9df8c5c6f2dbeca59c73'] ?? null,
          },
          quantity: nativeBalance,
          denominatedValue: { value, currency: 'USD' },
          tokenProjectMarket: {
            pricePercentChange: { value: priceChange },
            tokenProject: {
              logoUrl: LIGHTLINK_TOKEN_LOGOS['0x7ebef2a4b1b09381ec5b9df8c5c6f2dbeca59c73'] ?? null,
              isSpam: false,
            },
          },
        })
      }
    }

    // Handle ERC-20 tokens
    for (const token of subgraphTokens) {
      const balance = balances.get(token.id.toLowerCase())
      if (!balance || balance <= 0) continue

      const currentPrice = token.tokenDayData?.[0] ? parseFloat(token.tokenDayData[0].priceUSD) : 0
      const prevPrice = token.tokenDayData?.[1] ? parseFloat(token.tokenDayData[1].priceUSD) : 0
      const priceChange = prevPrice > 0 ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0
      const value = balance * currentPrice

      if (value > 0.01) {
        total += value
        const logoUrl = LIGHTLINK_TOKEN_LOGOS[token.id.toLowerCase()] ?? null
        results.push({
          id: token.id,
          token: {
            id: token.id,
            chain: 'LIGHTLINK',
            address: token.id,
            name: token.name,
            symbol: token.symbol,
            decimals: parseInt(token.decimals),
            logoUrl,
          },
          quantity: balance,
          denominatedValue: { value, currency: 'USD' },
          tokenProjectMarket: {
            pricePercentChange: { value: priceChange },
            tokenProject: { logoUrl, isSpam: false },
          },
        })
      }
    }

    // Sort by USD value descending
    results.sort((a, b) => b.denominatedValue.value - a.denominatedValue.value)

    return { tokenBalances: results, totalBalance: total }
  }, [subgraphTokens, balances])

  return { tokenBalances, totalBalance, loading }
}
