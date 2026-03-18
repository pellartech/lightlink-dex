import { useWeb3React } from '@web3-react/core'
import { usePortfolioBalancesQuery } from 'graphql/data/__generated__/types-and-hooks'
import { GQL_MAINNET_CHAINS } from 'graphql/data/util'
import { PropsWithChildren } from 'react'

/**
 * Kept for backwards compatibility with CurrencySearch which reads portfolio balances
 * from the Uniswap GQL API cache to sort tokens by balance.
 *
 * The sidebar (AuthenticatedHeader, Tokens tab) now uses useLightLinkBalances instead.
 */
export function useCachedPortfolioBalancesQuery({ account }: { account?: string }) {
  return usePortfolioBalancesQuery({
    skip: !account,
    variables: { ownerAddress: account ?? '', chains: GQL_MAINNET_CHAINS },
    fetchPolicy: 'cache-only',
    errorPolicy: 'all',
  })
}

/**
 * Simplified wrapper — no longer prefetches Uniswap GQL portfolio data on hover.
 * The sidebar fetches LightLink balances directly via RPC + subgraph.
 */
export default function PrefetchBalancesWrapper({
  children,
  className,
}: PropsWithChildren<{ shouldFetchOnAccountUpdate: boolean; className?: string }>) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}
