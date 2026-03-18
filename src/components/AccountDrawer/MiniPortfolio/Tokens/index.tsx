import { BrowserEvent, InterfaceElementName, SharedEventName } from '@uniswap/analytics-events'
import { TraceEvent } from 'analytics'
import Row from 'components/Row'
import { DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import { LIGHTLINK_CHAIN_ID } from 'constants/chains'
import { LightLinkTokenBalance, useLightLinkBalances } from 'graphql/data/lightlink/useLightLinkBalances'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { EllipsisStyle, ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { useToggleAccountDrawer } from '../..'
import { ExpandoRow } from '../ExpandoRow'
import { PortfolioLogo } from '../PortfolioLogo'
import PortfolioRow, { PortfolioSkeleton, PortfolioTabWrapper } from '../PortfolioRow'

export default function Tokens({ account }: { account: string }) {
  const toggleWalletDrawer = useToggleAccountDrawer()
  const [showHiddenTokens, setShowHiddenTokens] = useState(false)

  const { tokenBalances, loading } = useLightLinkBalances(account)

  // Split into visible (>$1) and hidden (<=$1)
  const { visibleTokens, hiddenTokens } = useMemo(() => {
    if (!tokenBalances) return { visibleTokens: [], hiddenTokens: [] }
    const visible: LightLinkTokenBalance[] = []
    const hidden: LightLinkTokenBalance[] = []
    for (const tb of tokenBalances) {
      if (tb.denominatedValue.value > 1) {
        visible.push(tb)
      } else {
        hidden.push(tb)
      }
    }
    return { visibleTokens: visible, hiddenTokens: hidden }
  }, [tokenBalances])

  if (loading && !tokenBalances) {
    return <PortfolioSkeleton />
  }

  if (!tokenBalances || tokenBalances.length === 0) {
    return <EmptyWalletModule type="token" onNavigateClick={toggleWalletDrawer} />
  }

  const toggleHiddenTokens = () => setShowHiddenTokens((s) => !s)

  return (
    <PortfolioTabWrapper>
      {visibleTokens.map((tb) => (
        <LightLinkTokenRow key={tb.id} tokenBalance={tb} />
      ))}
      <ExpandoRow isExpanded={showHiddenTokens} toggle={toggleHiddenTokens} numItems={hiddenTokens.length}>
        {hiddenTokens.map((tb) => (
          <LightLinkTokenRow key={tb.id} tokenBalance={tb} />
        ))}
      </ExpandoRow>
    </PortfolioTabWrapper>
  )
}

const TokenBalanceText = styled(ThemedText.BodySecondary)`
  ${EllipsisStyle}
`
const TokenNameText = styled(ThemedText.SubHeader)`
  ${EllipsisStyle}
`

function LightLinkTokenRow({ tokenBalance }: { tokenBalance: LightLinkTokenBalance }) {
  const { formatPercent, formatNumber } = useFormatter()
  const percentChange = tokenBalance.tokenProjectMarket.pricePercentChange.value

  const navigate = useNavigate()
  const toggleWalletDrawer = useToggleAccountDrawer()
  const navigateToTokenDetails = useCallback(() => {
    const address = tokenBalance.token.address === 'native' ? 'NATIVE' : tokenBalance.token.address
    navigate(`/tokens/lightlink/${address}`)
    toggleWalletDrawer()
  }, [navigate, tokenBalance.token.address, toggleWalletDrawer])

  return (
    <TraceEvent
      events={[BrowserEvent.onClick]}
      name={SharedEventName.ELEMENT_CLICKED}
      element={InterfaceElementName.MINI_PORTFOLIO_TOKEN_ROW}
      properties={{ chain_id: LIGHTLINK_CHAIN_ID, token_name: tokenBalance.token.name, address: tokenBalance.token.address }}
    >
      <PortfolioRow
        left={
          <PortfolioLogo
            chainId={LIGHTLINK_CHAIN_ID}
            images={tokenBalance.token.logoUrl ? [tokenBalance.token.logoUrl] : undefined}
            size="40px"
          />
        }
        title={<TokenNameText>{tokenBalance.token.name}</TokenNameText>}
        descriptor={
          <TokenBalanceText>
            {formatNumber({
              input: tokenBalance.quantity,
              type: NumberType.TokenNonTx,
            })}{' '}
            {tokenBalance.token.symbol}
          </TokenBalanceText>
        }
        onClick={navigateToTokenDetails}
        right={
          tokenBalance.denominatedValue && (
            <>
              <ThemedText.SubHeader>
                {formatNumber({
                  input: tokenBalance.denominatedValue.value,
                  type: NumberType.PortfolioBalance,
                })}
              </ThemedText.SubHeader>
              <Row justify="flex-end">
                <DeltaArrow delta={percentChange} />
                <ThemedText.BodySecondary>{formatPercent(percentChange)}</ThemedText.BodySecondary>
              </Row>
            </>
          )
        }
      />
    </TraceEvent>
  )
}
