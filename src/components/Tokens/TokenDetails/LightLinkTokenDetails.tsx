import { Trans } from '@lingui/macro'
import { InterfacePageName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { Trace } from 'analytics'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { PriceChart } from 'components/Charts/PriceChart'
import AddressSection from 'components/Tokens/TokenDetails/AddressSection'
import BalanceSummary from 'components/Tokens/TokenDetails/BalanceSummary'
import { BreadcrumbNavLink } from 'components/Tokens/TokenDetails/BreadcrumbNavLink'
import MobileBalanceSummaryFooter from 'components/Tokens/TokenDetails/MobileBalanceSummaryFooter'
import ShareButton from 'components/Tokens/TokenDetails/ShareButton'
import TokenDetailsSkeleton, {
  Hr,
  LeftPanel,
  RightPanel,
  TokenDetailsLayout,
  TokenInfoContainer,
  TokenNameCell,
  ChartContainer,
} from 'components/Tokens/TokenDetails/Skeleton'
import StatsSection from 'components/Tokens/TokenDetails/StatsSection'
import TokenSafetyMessage from 'components/TokenSafety/TokenSafetyMessage'
import TokenSafetyModal from 'components/TokenSafety/TokenSafetyModal'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { LIGHTLINK_CHAIN_ID } from 'constants/chains'
import { checkWarning } from 'constants/tokenSafety'
import { useInfoTDPEnabled } from 'featureFlags/flags/infoTDP'
import { PricePoint, TimePeriod } from 'graphql/data/util'
import type { LightLinkTokenData } from 'graphql/data/lightlink/useLightLinkToken'
import { UNKNOWN_TOKEN_SYMBOL, useTokenFromActiveNetwork } from 'lib/hooks/useCurrency'
import { Swap } from 'pages/Swap'
import { ParentSize } from '@visx/responsive'
import { startTransition, useCallback, useMemo, useState, useTransition } from 'react'
import { ArrowLeft } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Field } from 'state/swap/actions'
import { SwapState } from 'state/swap/reducer'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import styled from 'styled-components'
import { isAddress } from 'utils'
import { useAtomValue } from 'jotai/utils'
import { pageTimePeriodAtom } from 'pages/TokenDetails'

import { OnChangeTimePeriod } from './ChartSection'
import TimePeriodSelector from './TimeSelector'
import InvalidTokenDetails from './InvalidTokenDetails'

const TokenSymbol = styled.span`
  text-transform: uppercase;
  color: ${({ theme }) => theme.neutral2};
  margin-left: 8px;
`
const TokenActions = styled.div`
  display: flex;
  gap: 16px;
  color: ${({ theme }) => theme.neutral2};
`
const TokenTitle = styled.div`
  display: flex;
  @media screen and (max-width: ${({ theme }) => theme.breakpoint.md}px) {
    display: inline;
  }
`

function usePriceHistoryFromSubgraph(tokenData: LightLinkTokenData | undefined): PricePoint[] | undefined {
  return useMemo(() => {
    if (!tokenData?.tokenDayData?.length) return undefined
    // tokenDayData is ordered desc, reverse for chronological
    return [...tokenData.tokenDayData]
      .reverse()
      .map((d) => ({
        timestamp: d.date,
        value: parseFloat(d.priceUSD),
      }))
      .filter((p) => p.value > 0)
  }, [tokenData])
}

type LightLinkTokenDetailsProps = {
  urlAddress?: string
  inputTokenAddress?: string
  token: WrappedTokenInfo | undefined
  tokenData: LightLinkTokenData | undefined
  onChangeTimePeriod: OnChangeTimePeriod
}

export default function LightLinkTokenDetails({
  urlAddress,
  inputTokenAddress,
  token,
  tokenData,
  onChangeTimePeriod,
}: LightLinkTokenDetailsProps) {
  if (!urlAddress) {
    throw new Error('Invalid token details route: tokenAddress param is undefined')
  }

  const address = useMemo(
    () => (urlAddress === NATIVE_CHAIN_ID ? urlAddress : isAddress(urlAddress) || undefined),
    [urlAddress]
  )

  const { chainId: connectedChainId } = useWeb3React()
  const isInfoTDPEnabled = useInfoTDPEnabled()
  const navigate = useNavigate()
  const timePeriod = useAtomValue(pageTimePeriodAtom)

  // If subgraph didn't find the token, try fetching from on-chain
  const skipOnChainFetch = Boolean(token) || LIGHTLINK_CHAIN_ID !== connectedChainId
  const onChainToken = useTokenFromActiveNetwork(skipOnChainFetch || !address ? undefined : address)
  const detailedToken = token ?? (onChainToken?.symbol !== UNKNOWN_TOKEN_SYMBOL ? onChainToken : undefined)

  const prices = usePriceHistoryFromSubgraph(tokenData)
  const tokenWarning = address ? checkWarning(address) : null
  const isBlockedToken = tokenWarning?.canProceed === false

  const [isPending, startTokenTransition] = useTransition()

  const handleCurrencyChange = useCallback(
    (tokens: Pick<SwapState, Field.INPUT | Field.OUTPUT>) => {
      const newDefaultTokenID = tokens[Field.OUTPUT]?.currencyId ?? tokens[Field.INPUT]?.currencyId
      startTokenTransition(() =>
        navigate(
          `/tokens/lightlink/${newDefaultTokenID === 'ETH' ? NATIVE_CHAIN_ID : newDefaultTokenID}`
        )
      )
    },
    [navigate]
  )

  const [continueSwap, setContinueSwap] = useState<{ resolve: (value: boolean | PromiseLike<boolean>) => void }>()
  const [openTokenSafetyModal, setOpenTokenSafetyModal] = useState(false)

  const onResolveSwap = useCallback(
    (value: boolean) => {
      continueSwap?.resolve(value)
      setContinueSwap(undefined)
    },
    [continueSwap, setContinueSwap]
  )

  if (detailedToken === undefined || !address) {
    return <InvalidTokenDetails pageChainId={LIGHTLINK_CHAIN_ID} isInvalidAddress={!address} />
  }

  return (
    <Trace
      page={InterfacePageName.TOKEN_DETAILS_PAGE}
      properties={{ tokenAddress: address, tokenName: detailedToken?.name }}
      shouldLogImpression
    >
      <TokenDetailsLayout>
        {detailedToken && !isPending ? (
          <LeftPanel>
            <BreadcrumbNavLink to="/tokens/lightlink">
              <ArrowLeft data-testid="token-details-return-button" size={14} /> Tokens
            </BreadcrumbNavLink>
            <TokenInfoContainer data-testid="token-info-container">
              <TokenNameCell>
                <CurrencyLogo currency={detailedToken} size="32px" hideL2Icon={false} />
                <TokenTitle>
                  {detailedToken.name ?? <Trans>Name not found</Trans>}
                  <TokenSymbol>{detailedToken.symbol ?? <Trans>Symbol not found</Trans>}</TokenSymbol>
                </TokenTitle>
              </TokenNameCell>
              <TokenActions>
                <ShareButton currency={detailedToken} />
              </TokenActions>
            </TokenInfoContainer>

            {/* Price Chart from subgraph data */}
            <ChartContainer data-testid="chart-container">
              <ParentSize>
                {({ width }) => <PriceChart prices={prices} width={width} height={392} timePeriod={timePeriod} />}
              </ParentSize>
              {/* Time period selector hidden */}
            </ChartContainer>

            <StatsSection
              chainId={LIGHTLINK_CHAIN_ID}
              address={address}
              TVL={tokenData ? parseFloat(tokenData.totalValueLockedUSD) : undefined}
              volume24H={
                tokenData?.tokenDayData?.[0]
                  ? parseFloat(tokenData.tokenDayData[0].volumeUSD)
                  : undefined
              }
              priceHigh52W={undefined}
              priceLow52W={undefined}
            />
            <Hr />
            {address !== NATIVE_CHAIN_ID && <AddressSection address={address} />}
          </LeftPanel>
        ) : (
          <TokenDetailsSkeleton />
        )}

        <RightPanel onClick={() => isBlockedToken && setOpenTokenSafetyModal(true)}>
          <div style={{ pointerEvents: isBlockedToken ? 'none' : 'auto' }}>
            <Swap
              chainId={LIGHTLINK_CHAIN_ID}
              initialInputCurrencyId={inputTokenAddress}
              initialOutputCurrencyId={address === NATIVE_CHAIN_ID ? 'ETH' : address}
              onCurrencyChange={handleCurrencyChange}
              disableTokenInputs={LIGHTLINK_CHAIN_ID !== connectedChainId}
            />
          </div>
          {tokenWarning && <TokenSafetyMessage tokenAddress={address} warning={tokenWarning} />}
          {!isInfoTDPEnabled && detailedToken && <BalanceSummary token={detailedToken} />}
        </RightPanel>
        {!isInfoTDPEnabled && detailedToken && <MobileBalanceSummaryFooter token={detailedToken} />}

        <TokenSafetyModal
          isOpen={openTokenSafetyModal || !!continueSwap}
          tokenAddress={address}
          onContinue={() => onResolveSwap(true)}
          onBlocked={() => {
            setOpenTokenSafetyModal(false)
          }}
          onCancel={() => onResolveSwap(false)}
          showCancel={true}
        />
      </TokenDetailsLayout>
    </Trace>
  )
}
