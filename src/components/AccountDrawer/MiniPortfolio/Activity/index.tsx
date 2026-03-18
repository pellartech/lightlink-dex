import { useAccountDrawer } from 'components/AccountDrawer'
import Column from 'components/Column'
import { LoadingBubble } from 'components/Tokens/loading'
import { getExplorerLink, ExplorerDataType } from 'utils/getExplorerLink'
import { LIGHTLINK_CHAIN_ID } from 'constants/chains'
import { LightLinkActivity, useLightLinkActivity } from 'graphql/data/lightlink/useLightLinkActivity'
import { atom, useAtom } from 'jotai'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { useEffect, useMemo } from 'react'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { ExternalLink } from 'theme/components'

import { PortfolioSkeleton, PortfolioTabWrapper } from '../PortfolioRow'
import PortfolioRow from '../PortfolioRow'
import { PortfolioLogo } from '../PortfolioLogo'

const ActivityGroupWrapper = styled(Column)`
  margin-top: 16px;
  gap: 8px;
`

const lastFetchedAtom = atom<number | undefined>(0)

interface ActivityGroup {
  title: string
  activities: LightLinkActivity[]
}

function createGroups(activities: LightLinkActivity[]): ActivityGroup[] {
  const now = Date.now() / 1000
  const oneDay = 86400
  const oneWeek = oneDay * 7
  const oneMonth = oneDay * 30

  const groups: Record<string, LightLinkActivity[]> = {}

  for (const activity of activities) {
    const age = now - activity.timestamp
    let label: string
    if (age < oneDay) label = 'Today'
    else if (age < oneWeek) label = 'This week'
    else if (age < oneMonth) label = 'This month'
    else label = 'Older'

    if (!groups[label]) groups[label] = []
    groups[label].push(activity)
  }

  const order = ['Today', 'This week', 'This month', 'Older']
  return order
    .filter((title) => groups[title]?.length)
    .map((title) => ({ title, activities: groups[title] }))
}

export function ActivityTab({ account }: { account: string }) {
  const [drawerOpen, toggleWalletDrawer] = useAccountDrawer()
  const [lastFetched, setLastFetched] = useAtom(lastFetchedAtom)

  const { activities, loading, refetch } = useLightLinkActivity(account)

  useEffect(() => {
    const currentTime = Date.now()
    if (!lastFetched) {
      setLastFetched(currentTime)
    } else if (drawerOpen && lastFetched && currentTime - lastFetched > 300_000) {
      refetch()
      setLastFetched(currentTime)
    }
  }, [drawerOpen, lastFetched, refetch, setLastFetched])

  const activityGroups = useMemo(() => (activities ? createGroups(activities) : undefined), [activities])

  if (!activityGroups && loading) {
    return (
      <>
        <LoadingBubble height="16px" width="80px" margin="16px 16px 8px" />
        <PortfolioSkeleton shrinkRight />
      </>
    )
  } else if (!activityGroups || activityGroups.length === 0) {
    return <EmptyWalletModule type="activity" onNavigateClick={toggleWalletDrawer} />
  } else {
    return (
      <PortfolioTabWrapper>
        {activityGroups.map((group) => (
          <ActivityGroupWrapper key={group.title}>
            <ThemedText.SubHeader color="neutral2" marginLeft="16px">
              {group.title}
            </ThemedText.SubHeader>
            <Column data-testid="activity-content">
              {group.activities.map((activity) => (
                <LightLinkActivityRow key={activity.hash} activity={activity} />
              ))}
            </Column>
          </ActivityGroupWrapper>
        ))}
      </PortfolioTabWrapper>
    )
  }
}

// Re-export for hooks.ts compatibility
export { usePendingActivity } from './hooks'

function LightLinkActivityRow({ activity }: { activity: LightLinkActivity }) {
  const explorerUrl = getExplorerLink(LIGHTLINK_CHAIN_ID, activity.hash, ExplorerDataType.TRANSACTION)

  return (
    <ExternalLink href={explorerUrl} style={{ textDecoration: 'none' }}>
      <PortfolioRow
        left={
          <PortfolioLogo
            chainId={LIGHTLINK_CHAIN_ID}
            images={activity.logos.filter(Boolean) as string[]}
            size="40px"
          />
        }
        title={<ThemedText.SubHeader>{activity.title}</ThemedText.SubHeader>}
        descriptor={
          <ThemedText.BodySmall color="neutral2">
            {activity.descriptor}
          </ThemedText.BodySmall>
        }
        right={
          <ThemedText.BodySmall color="neutral2">
            {formatTimestamp(activity.timestamp)}
          </ThemedText.BodySmall>
        }
      />
    </ExternalLink>
  )
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now() / 1000
  const diff = now - timestamp

  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`

  return new Date(timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
