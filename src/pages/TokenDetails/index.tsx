import TokenDetails from 'components/Tokens/TokenDetails'
import LightLinkTokenDetails from 'components/Tokens/TokenDetails/LightLinkTokenDetails'
import { TokenDetailsPageSkeleton } from 'components/Tokens/TokenDetails/Skeleton'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useTokenPriceQuery, useTokenQuery } from 'graphql/data/__generated__/types-and-hooks'
import { TimePeriod, toHistoryDuration, validateUrlChainParam } from 'graphql/data/util'
import { useLightLinkToken } from 'graphql/data/lightlink/useLightLinkToken'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getNativeTokenDBAddress } from 'utils/nativeTokens'

export const pageTimePeriodAtom = atomWithStorage<TimePeriod>('tokenDetailsTimePeriod', TimePeriod.DAY)

function isLightLinkChain(chainName: string | undefined): boolean {
  return chainName?.toLowerCase() === 'lightlink'
}

export default function TokenDetailsPage() {
  const { tokenAddress, chainName } = useParams<{
    tokenAddress: string
    chainName?: string
  }>()
  const chain = validateUrlChainParam(chainName)
  const isNative = tokenAddress === NATIVE_CHAIN_ID
  const [timePeriod, setTimePeriod] = useAtom(pageTimePeriodAtom)
  const [detailedTokenAddress, duration] = useMemo(
    () => [isNative ? getNativeTokenDBAddress(chain) : tokenAddress ?? '', toHistoryDuration(timePeriod)],
    [chain, isNative, timePeriod, tokenAddress]
  )

  const parsedQs = useParsedQueryString()
  const parsedInputTokenAddress: string | undefined = useMemo(() => {
    return typeof parsedQs.inputCurrency === 'string' ? (parsedQs.inputCurrency as string) : undefined
  }, [parsedQs])

  // LightLink: use subgraph directly
  const isLightLink = isLightLinkChain(chainName)
  const { token: llToken, tokenData: llTokenData, loading: llLoading } = useLightLinkToken(
    isLightLink ? (tokenAddress ?? undefined) : undefined
  )

  // Standard chains: use Uniswap GraphQL
  const { data: tokenQuery } = useTokenQuery({
    variables: {
      address: detailedTokenAddress,
      chain,
    },
    errorPolicy: 'all',
    skip: isLightLink,
  })

  const { data: tokenPriceQuery } = useTokenPriceQuery({
    variables: {
      address: detailedTokenAddress,
      chain,
      duration,
    },
    errorPolicy: 'all',
    skip: isLightLink,
  })

  // Saves already-loaded chart data into state to display while tokenPriceQuery is undefined timePeriod input changes
  const [currentPriceQuery, setCurrentPriceQuery] = useState(tokenPriceQuery)
  useEffect(() => {
    if (tokenPriceQuery) setCurrentPriceQuery(tokenPriceQuery)
  }, [setCurrentPriceQuery, tokenPriceQuery])

  // LightLink token detail page
  if (isLightLink) {
    if (llLoading) return <TokenDetailsPageSkeleton />
    return (
      <LightLinkTokenDetails
        urlAddress={tokenAddress}
        token={llToken}
        tokenData={llTokenData}
        onChangeTimePeriod={setTimePeriod}
        inputTokenAddress={parsedInputTokenAddress}
      />
    )
  }

  // Standard token detail page
  if (!tokenQuery) return <TokenDetailsPageSkeleton />

  return (
    <TokenDetails
      urlAddress={tokenAddress}
      chain={chain}
      tokenQuery={tokenQuery}
      tokenPriceQuery={currentPriceQuery}
      onChangeTimePeriod={setTimePeriod}
      inputTokenAddress={parsedInputTokenAddress}
    />
  )
}
