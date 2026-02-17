import { useWeb3React } from '@web3-react/core'
import { getChainInfo } from 'constants/chainInfo'
import { LIGHTLINK_CHAIN_ID } from 'constants/chains'
import useSelectChain from 'hooks/useSelectChain'
import useSyncChainQuery from 'hooks/useSyncChainQuery'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import { useEffect } from 'react'

import * as styles from './ChainSelector.css'

interface ChainSelectorProps {
  leftAlign?: boolean
}

export const ChainSelector = ({ leftAlign }: ChainSelectorProps) => {
  const { chainId } = useWeb3React()
  const selectChain = useSelectChain()
  useSyncChainQuery()

  // Auto-switch to LightLink if on wrong chain
  useEffect(() => {
    if (chainId && chainId !== LIGHTLINK_CHAIN_ID) {
      selectChain(LIGHTLINK_CHAIN_ID as any)
    }
  }, [chainId, selectChain])

  const info = getChainInfo(LIGHTLINK_CHAIN_ID)

  // Network icon hidden — single-chain deployment
  return null
}
