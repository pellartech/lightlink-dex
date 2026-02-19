import { BrowserEvent, InterfaceElementName, SharedEventName } from '@uniswap/analytics-events'
import { TraceEvent } from 'analytics'
import { useDisableNFTRoutes } from 'hooks/useDisableNFTRoutes'
import styled from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ExternalLink, StyledRouterLink } from 'theme/components'
import { useIsDarkMode } from 'theme/components/ThemeToggle'

import lightswapLogo from 'assets/lightswap-logo.png'

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 48px;
  max-width: 1440px;

  @media screen and (min-width: ${BREAKPOINTS.lg}px) {
    flex-direction: row;
    justify-content: space-between;
  }
`

const LogoSection = styled.div`
  display: flex;
  flex-direction: column;
`

const LogoSectionLeft = styled(LogoSection)`
  display: none;

  @media screen and (min-width: ${BREAKPOINTS.lg}px) {
    display: flex;
  }
`

const LogoSectionBottom = styled(LogoSection)`
  display: flex;

  @media screen and (min-width: ${BREAKPOINTS.lg}px) {
    display: none;
  }
`

const StyledLogo = styled.img`
  height: 36px;
  width: auto;
  object-fit: contain;
  display: none;

  @media screen and (min-width: ${BREAKPOINTS.lg}px) {
    display: block;
  }
`

const SocialLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin: 0;
`

const SocialLink = styled.a`
  display: flex;
  color: #66FFFC;
`

const FooterLinks = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media screen and (min-width: ${BREAKPOINTS.xl}px) {
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 24px;
  }
`

const LinkGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 200px;
  margin: 20px 0 0 0;
  @media screen and (min-width: ${BREAKPOINTS.xl}px) {
    margin: 0;
  }
`

const LinkGroupTitle = styled.span`
  font-size: 16px;
  line-height: 20px;
  font-weight: 535;
`

const ExternalTextLink = styled(ExternalLink)`
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.neutral2};
`

const TextLink = styled(StyledRouterLink)`
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.neutral2};
`

const Copyright = styled.span`
  font-size: 16px;
  line-height: 20px;
  margin: 1rem 0 0 0;
  color: ${({ theme }) => theme.neutral3};
`

const DiscordIconCustom = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.317 4.492C18.787 3.786 17.147 3.266 15.432 2.966C15.219 3.348 14.974 3.862 14.803 4.268C12.972 3.988 11.159 3.988 9.363 4.268C9.192 3.862 8.942 3.348 8.727 2.966C7.01 3.266 5.368 3.788 3.839 4.496C0.553 9.415 -0.339 14.21 0.107 18.939C2.167 20.464 4.163 21.38 6.123 21.988C6.607 21.332 7.037 20.634 7.408 19.9C6.699 19.636 6.019 19.31 5.375 18.932C5.546 18.808 5.713 18.678 5.875 18.544C10.144 20.524 14.792 20.524 19.013 18.544C19.177 18.678 19.344 18.808 19.513 18.932C18.867 19.312 18.185 19.638 17.475 19.902C17.846 20.634 18.274 21.334 18.76 21.99C20.722 21.382 22.72 20.466 24.781 18.939C25.305 13.44 23.901 8.692 20.317 4.492ZM8.352 16.032C7.116 16.032 6.107 14.9 6.107 13.518C6.107 12.136 7.095 11.002 8.352 11.002C9.608 11.002 10.618 12.134 10.596 13.518C10.598 14.9 9.608 16.032 8.352 16.032ZM16.536 16.032C15.3 16.032 14.291 14.9 14.291 13.518C14.291 12.136 15.279 11.002 16.536 11.002C17.792 11.002 18.802 12.134 18.78 13.518C18.78 14.9 17.792 16.032 16.536 16.032Z" fill="currentColor" transform="scale(0.92) translate(1, 1)"/>
  </svg>
)

const XIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25H21.552L14.325 10.51L22.827 21.75H16.17L10.956 14.933L4.99 21.75H1.68L9.41 12.915L1.254 2.25H8.08L12.793 8.481L18.244 2.25ZM17.083 19.77H18.916L7.084 4.126H5.117L17.083 19.77Z" fill="currentColor"/>
  </svg>
)

const EmailIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const LinkedInIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 8C17.5913 8 19.1174 8.63214 20.2426 9.75736C21.3679 10.8826 22 12.4087 22 14V21H18V14C18 13.4696 17.7893 12.9609 17.4142 12.5858C17.0391 12.2107 16.5304 12 16 12C15.4696 12 14.9609 12.2107 14.5858 12.5858C14.2107 12.9609 14 13.4696 14 14V21H10V14C10 12.4087 10.6321 10.8826 11.7574 9.75736C12.8826 8.63214 14.4087 8 16 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 9H2V21H6V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 6C5.10457 6 6 5.10457 6 4C6 2.89543 5.10457 2 4 2C2.89543 2 2 2.89543 2 4C2 5.10457 2.89543 6 4 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const TelegramIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.198 2.433L2.626 9.691C1.299 10.221 1.307 10.943 2.378 11.265L7.376 12.829L18.038 5.918C18.534 5.614 18.99 5.783 18.621 6.115L9.654 14.152H9.652L9.654 14.152L9.31 19.313C9.826 19.313 10.054 19.076 10.34 18.799L12.799 16.407L17.843 20.145C18.79 20.668 19.473 20.399 19.713 19.275L22.89 3.807C23.235 2.437 22.358 1.813 21.198 2.433Z" fill="currentColor"/>
  </svg>
)

const LogoSectionContent = () => {
  return (
    <>
      <SocialLinks>
        <SocialLink href="mailto:hello@lightlink.io">
          <EmailIcon size={28} />
        </SocialLink>
        <SocialLink href="https://discord.com/invite/lightlinkchain" target="_blank" rel="noopener noreferrer">
          <DiscordIconCustom size={28} />
        </SocialLink>
        <SocialLink href="https://x.com/lightlinkchain" target="_blank" rel="noopener noreferrer">
          <XIcon size={28} />
        </SocialLink>
        <SocialLink href="https://www.linkedin.com/company/lightlinkchain" target="_blank" rel="noopener noreferrer">
          <LinkedInIcon size={28} />
        </SocialLink>
        <SocialLink href="https://t.me/lightlinkLL" target="_blank" rel="noopener noreferrer">
          <TelegramIcon size={28} />
        </SocialLink>
      </SocialLinks>
      <Copyright>© {new Date().getFullYear()} LightLink</Copyright>
    </>
  )
}

export const AboutFooter = () => {
  const shouldDisableNFTRoutes = useDisableNFTRoutes()
  return (
    <Footer>
      <LogoSectionLeft>
        <LogoSectionContent />
      </LogoSectionLeft>

      <FooterLinks>
        <LinkGroup>
          <LinkGroupTitle>App</LinkGroupTitle>
          <TextLink to="/swap">Swap</TextLink>
          <TextLink to="/tokens">Tokens</TextLink>
          {!shouldDisableNFTRoutes && <TextLink to="/nfts">NFTs</TextLink>}
          <TextLink to="/pools">Pools</TextLink>
        </LinkGroup>
        <LinkGroup>
          <LinkGroupTitle>Protocol</LinkGroupTitle>
          <ExternalTextLink href="https://lightlink.io">LightLink</ExternalTextLink>
          <ExternalTextLink href="https://docs.lightlink.io">Documentation</ExternalTextLink>
        </LinkGroup>
        <LinkGroup>
          <LinkGroupTitle>Community</LinkGroupTitle>
          <ExternalTextLink href="https://discord.com/invite/lightlinkchain">Discord</ExternalTextLink>
          <ExternalTextLink href="https://x.com/lightlinkchain">Twitter / X</ExternalTextLink>
          <ExternalTextLink href="https://t.me/lightlinkLL">Telegram</ExternalTextLink>
        </LinkGroup>
        <LinkGroup>
          <LinkGroupTitle>Get Help</LinkGroupTitle>
          <ExternalTextLink href="mailto:hello@lightlink.io">Contact Us</ExternalTextLink>
        </LinkGroup>
      </FooterLinks>

      <LogoSectionBottom>
        <LogoSectionContent />
      </LogoSectionBottom>
    </Footer>
  )
}
