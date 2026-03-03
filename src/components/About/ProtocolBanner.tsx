import { ButtonEmpty } from 'components/Button'
import styled from 'styled-components'
import { BREAKPOINTS } from 'theme'
// dark mode no longer needed - using static banner image

import bannerBg from 'assets/protocol-banner-bg.png'

const Banner = styled.div`
  height: 340px;
  width: 100%;
  border-radius: 32px;
  max-width: 1440px;
  margin: 80px 0;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 32px 48px;

  box-shadow: 0px 10px 24px rgba(51, 53, 72, 0.04);

  background: linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${bannerBg});
  background-size: cover;
  background-position: center;

  @media screen and (min-width: ${BREAKPOINTS.lg}px) {
    height: 140px;
    flex-direction: row;
  }
`

const TextContainer = styled.div`
  color: white;
  display: flex;
  flex: 1;
  flex-direction: column;
`

const HeaderText = styled.div`
  font-weight: 535;
  font-size: 20px;
  line-height: 28px;

  @media screen and (min-width: ${BREAKPOINTS.xl}px) {
    font-size: 22px;
    line-height: 30px;
  }
`

const DescriptionText = styled.div`
  margin: 10px 10px 0 0;
  font-weight: 535;
  font-size: 16px;
  line-height: 20px;

  @media screen and (min-width: ${BREAKPOINTS.xl}px) {
    font-size: 20px;
    line-height: 28px;
  }
`

const BannerButtonContainer = styled.div`
  width: 100%;
  display: flex;
  align-items: center;

  transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease} opacity`};

  &:hover {
    opacity: 0.6;
  }

  @media screen and (min-width: ${BREAKPOINTS.lg}px) {
    width: auto;
  }
`

const BannerButton = styled(ButtonEmpty)`
  color: white;
  border: 2px solid white;
  border-radius: 12px;
  font-weight: 535;
`

const ProtocolBanner = () => {
  return (
    <Banner>
      <TextContainer>
        <HeaderText>Optimized by StellaSwap Routing, powered by Uniswap Protocol Liquidity</HeaderText>
        <DescriptionText>
          Next-gen trade execution for the Ethereum ecosystem.
        </DescriptionText>
      </TextContainer>
      <BannerButtonContainer>
        <BannerButton width="200px" as="a" href="https://docs.lightlink.io/" rel="noopener noreferrer" target="_blank">
          Learn more
        </BannerButton>
      </BannerButtonContainer>
    </Banner>
  )
}

export default ProtocolBanner
