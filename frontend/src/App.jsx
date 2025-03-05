import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled, { createGlobalStyle } from 'styled-components';
import axios from 'axios';

const Container = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
  color: #212529;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
`;

const BackgroundGraphic = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(#e9ecef 1px, transparent 1px);
  background-size: 30px 30px;
  opacity: 0.5;
  z-index: 0;
`;

const GraphicAccent = styled(motion.div)`
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(13, 110, 253, 0.05), rgba(108, 117, 125, 0.05));
  filter: blur(80px);
  z-index: 0;
  opacity: 0.7;
`;

const Content = styled(motion.div)`
  width: 100%;
  max-width: 1200px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
`;

const Logo = styled(motion.div)`
  font-size: 1.2rem;
  font-weight: 600;
  color: #0d6efd;
  margin-bottom: 1rem;
  letter-spacing: 1px;
`;

const LogoIcon = styled.span`
  font-size: 1.2rem;
  margin-right: 0.5rem;
`;

const LogoText = styled.span`
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: 1px;

  & span {
    font-weight: 400;
  }
`;

const Title = styled(motion.h1)`
  font-size: 2.5rem;
  text-align: center;
  color: #212529;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  text-align: center;
  color: #6c757d;
  max-width: 600px;
  line-height: 1.5;
`;

const Card = styled(motion.div)`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  overflow: hidden;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StartButton = styled(motion.button)`
  background: #0d6efd;
  border: none;
  padding: 1rem 3rem;
  font-size: 1rem;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.2);
  
  &:disabled {
    background: #6c757d;
    box-shadow: none;
    cursor: not-allowed;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
`;

const CardTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #212529;
  margin: 0;
`;

const Badge = styled.span`
  background: ${props => props.active ? '#e7f5ff' : '#f8f9fa'};
  color: ${props => props.active ? '#0d6efd' : '#6c757d'};
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 500;
`;

const Message = styled(motion.div)`
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 10px;
  background-color: ${props => 
    props.type === "Buyer" 
      ? '#f1f8ff' 
      : props.type === "Seller" 
        ? '#f8f9fa'
        : '#fff9ec'};  /* System messages get a yellowish background */
  position: relative;
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: ${props => 
    props.type === "Buyer" 
      ? '#0d6efd' 
      : props.type === "Seller" 
        ? '#343a40'
        : '#e67300'};  /* System messages get an orange color */
`;

const MessageIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.5rem;
  background-color: ${props => 
    props.type === "Buyer" 
      ? '#0d6efd' 
      : props.type === "Seller" 
        ? '#343a40'
        : '#e67300'};  /* System messages get an orange background */
  color: white;
  font-size: 12px;
  
  &:before {
    content: ${props => 
      props.type === "Buyer" 
        ? '"B"' 
        : props.type === "Seller" 
          ? '"S"'
          : '"!"'};  /* System messages get an exclamation mark */
  }
`;

const MessageContent = styled.div`
  margin-top: 0.5rem;
  line-height: 1.5;
  white-space: pre-wrap;
  
  /* Allow HTML content to be rendered */
  & span {
    display: inline-block;
  }
`;

const OfferGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const OfferButton = styled(motion.button)`
  background: white;
  border: 1px solid #e9ecef;
  padding: 1rem;
  color: #212529;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  
  &:hover {
    border-color: #0d6efd;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusCard = styled(motion.div)`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StatusInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatusLabel = styled.span`
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
`;

const StatusValue = styled.span`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.success ? '#0d6efd' : '#212529'};
`;

const StatusIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => props.success ? '#e7f5ff' : '#f8f9fa'};
  color: ${props => props.success ? '#0d6efd' : '#6c757d'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
`;

const ScrollableContent = styled.div`
  max-height: 400px;
  overflow-y: auto;
  padding-right: 0.5rem;
`;

const ProgressContainer = styled.div`
  margin-bottom: 2rem;
`;

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const ProgressLabel = styled.span`
  font-size: 0.875rem;
  color: #6c757d;
`;

const ProgressValue = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => {
    if (props.value >= 70) return '#198754'; // Success
    if (props.value >= 40) return '#fd7e14'; // Warning
    return '#dc3545'; // Danger
  }};
`;

const ProgressBar = styled.div`
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: ${props => {
    if (props.value >= 70) return '#198754'; // Success
    if (props.value >= 40) return '#fd7e14'; // Warning
    return '#dc3545'; // Danger
  }};
  border-radius: 3px;
`;

const OfferButtonContainer = styled.div`
  position: relative;
`;

const OfferButtonOverlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(13, 110, 253, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0d6efd;
  font-weight: 500;
`;

// New components for loading animation
const LoadingOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(248, 249, 250, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const LoadingContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 400px;
  text-align: center;
`;

const LoadingTitle = styled.h3`
  font-size: 1.5rem;
  color: #0d6efd;
  margin-bottom: 1rem;
  font-weight: 600;
`;

const LoadingDescription = styled.p`
  color: #495057;
  margin-bottom: 2rem;
  line-height: 1.5;
`;

const LoadingIndicator = styled.div`
  position: relative;
  width: 200px;
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 2rem;
`;

const LoadingBar = styled(motion.div)`
  height: 100%;
  background: #0d6efd;
  border-radius: 3px;
`;

const ThinkingBubbles = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
`;

const Bubble = styled(motion.div)`
  width: 12px;
  height: 12px;
  background: #0d6efd;
  border-radius: 50%;
  margin: 0 4px;
`;

const StrategyTag = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: ${props => props.active ? 'rgba(13, 110, 253, 0.1)' : 'rgba(108, 117, 125, 0.1)'};
  color: ${props => props.active ? '#0d6efd' : '#6c757d'};
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(13, 110, 253, 0.15);
  }
`;

const MetricsCard = styled(motion.div)`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const MetricItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const MetricValue = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: #0d6efd;
  margin-bottom: 0.25rem;
`;

const MetricLabel = styled.div`
  font-size: 0.75rem;
  color: #6c757d;
`;

const SentimentMeter = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 1rem;
`;

const SentimentLabel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
`;

const SentimentBar = styled.div`
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.75rem;
`;

const SentimentFill = styled.div`
  height: 100%;
  width: ${props => props.value * 10}%;
  background: ${props => {
    if (props.type === 'positivity') return '#198754';
    if (props.type === 'openness') return '#0d6efd';
    if (props.type === 'firmness') return '#fd7e14';
    if (props.type === 'flexibility') return '#6610f2';
    return '#6c757d';
  }};
  border-radius: 3px;
`;

const keyframes = {
  spin: `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `
};

const GlobalStyle = createGlobalStyle`
  ${keyframes.spin}
  
  body {
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #f8f9fa;
    color: #212529;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
`;

function App() {
  const [negotiation, setNegotiation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accentPosition, setAccentPosition] = useState({ x: '30%', y: '20%' });
  const [selectedOfferIndex, setSelectedOfferIndex] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [strategyBeingApplied, setStrategyBeingApplied] = useState(false);
  const loadingSteps = [
    "Analyzing your offer...",
    "Evaluating market conditions...",
    "Considering seller's position...",
    "Calculating optimal response..."
  ];
  const loadingInterval = useRef(null);
  
  // Available negotiation strategies
  const strategies = [
    { id: 'increase', name: 'Increase Offer' },
    { id: 'stand_firm', name: 'Stand Firm' },
    { id: 'split_difference', name: 'Split the Difference' },
    { id: 'final_offer', name: 'Final Offer' },
    { id: 'walk_away', name: 'Threaten to Walk Away' }
  ];

  // Function to generate strategy-specific offers
  const getStrategySpecificOffers = (strategy, originalOffers) => {
    if (!strategy || !originalOffers || originalOffers.length === 0) {
      return originalOffers;
    }

    // Extract current price if available
    let currentPrice = null;
    const priceMatch = originalOffers[0].match(/\$([0-9,]+(?:\.[0-9]+)?)/);
    if (priceMatch) {
      currentPrice = parseFloat(priceMatch[1].replace(',', ''));
    }

    // Get buyer's last offer from history
    let buyerLastOffer = null;
    if (negotiation && negotiation.history) {
      for (let i = negotiation.history.length - 1; i >= 0; i--) {
        const [speaker, message] = negotiation.history[i];
        if (speaker === "Buyer") {
          const match = message.match(/\$([0-9,]+(?:\.[0-9]+)?)/);
          if (match) {
            buyerLastOffer = parseFloat(match[1].replace(',', ''));
            break;
          }
        }
      }
    }

    // Get seller's last offer if available
    let sellerLastOffer = null;
    if (negotiation && negotiation.history) {
      for (let i = negotiation.history.length - 1; i >= 0; i--) {
        const [speaker, message] = negotiation.history[i];
        if (speaker === "Seller") {
          const match = message.match(/\$([0-9,]+(?:\.[0-9]+)?)/);
          if (match) {
            sellerLastOffer = parseFloat(match[1].replace(',', ''));
            break;
          }
        }
      }
    }

    switch (strategy) {
      case 'increase':
        if (currentPrice) {
          const increasedPrice = currentPrice * 1.05; // 5% increase
          return [
            `I'd like to increase my offer to $${increasedPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. I believe this is a fair price considering the vehicle's condition.`,
            `I can go up to $${increasedPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} which is more than my previous offer. This shows my serious interest in the vehicle.`,
            `Let me improve my offer to $${increasedPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. I think this is a reasonable step up.`,
            `I'm willing to raise my offer to $${increasedPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} which I believe is competitive for this market.`
          ];
        }
        break;
        
      case 'stand_firm':
        // For stand firm, we should use the BUYER'S last offer, not the current offer
        if (buyerLastOffer) {
          // Use the exact price the buyer previously offered
          return [
            `I'm standing firm at my previous offer of $${buyerLastOffer.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. I believe this is already a fair price.`,
            `My offer of $${buyerLastOffer.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} remains unchanged. I've done my research and this is the market value.`,
            `I'm not willing to change my offer of $${buyerLastOffer.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. This reflects the vehicle's actual value.`,
            `I'm holding at $${buyerLastOffer.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. I believe this is already generous considering comparable vehicles.`
          ];
        } else if (currentPrice) {
          // Fallback to current price if we can't find buyer's last offer
          return [
            `I'm standing firm at $${currentPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. I believe this is already a fair offer.`,
            `My offer of $${currentPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} remains unchanged. I've done my research and this is the market value.`,
            `I'm not willing to change my offer of $${currentPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. This is my best offer based on the vehicle's condition.`,
            `I'm holding at $${currentPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. I believe this is already generous considering comparable vehicles.`
          ];
        }
        break;
        
      case 'split_difference':
        if (buyerLastOffer && sellerLastOffer) {
          // Make sure buyer offer is lower than seller offer
          if (buyerLastOffer < sellerLastOffer) {
            const splitPrice = Math.round((buyerLastOffer + sellerLastOffer) / 2);
            return [
              `Let's meet in the middle at $${splitPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. This is a fair compromise between your $${sellerLastOffer.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} and my $${buyerLastOffer.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}.`,
              `I propose we split the difference and settle at $${splitPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. This way we both win.`,
              `How about we compromise at $${splitPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}? This is exactly halfway between our positions.`,
              `I suggest $${splitPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} as a fair middle ground between your asking price and my offer.`
            ];
          }
        }
        // Fallback if we don't have both buyer and seller offers or if buyer offer is higher
        if (currentPrice && sellerLastOffer && currentPrice < sellerLastOffer) {
          const splitPrice = Math.round((currentPrice + sellerLastOffer) / 2);
          return [
            `Let's meet in the middle at $${splitPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. This is a fair compromise for both of us.`,
            `I propose we split the difference and settle at $${splitPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. This way we both win.`,
            `How about we compromise at $${splitPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}? This is exactly halfway between our positions.`,
            `I suggest $${splitPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} as a fair middle ground between your asking price and my offer.`
          ];
        }
        break;
        
      case 'final_offer':
        // If we have buyer and seller offers, make the final offer a bit more than halfway
        if (buyerLastOffer && sellerLastOffer && buyerLastOffer < sellerLastOffer) {
          // Final offer is 60% of the way from buyer to seller (a bit more than split_difference)
          const finalPrice = Math.round(buyerLastOffer + (sellerLastOffer - buyerLastOffer) * 0.6);
          return [
            `This is my final offer: $${finalPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. I cannot go any higher than this.`,
            `$${finalPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} is absolutely my final offer. I'll have to walk away if we can't agree on this price.`,
            `I'm making my final offer of $${finalPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. This is the absolute maximum I can pay.`,
            `My final and best offer is $${finalPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. I hope we can close the deal at this price.`
          ];
        } 
        // If we only have the buyer's last offer, use that with a small increase
        else if (buyerLastOffer) {
          const finalPrice = Math.round(buyerLastOffer * 1.05); // 5% increase as final offer
          return [
            `This is my final offer: $${finalPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. I cannot go any higher than this.`,
            `$${finalPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} is absolutely my final offer. I'll have to walk away if we can't agree on this price.`,
            `I'm making my final offer of $${finalPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. This is the absolute maximum I can pay.`,
            `My final and best offer is $${finalPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. I hope we can close the deal at this price.`
          ];
        }
        // Fallback to current price with a small increase
        else if (currentPrice) {
          const finalPrice = Math.round(currentPrice * 1.03); // 3% increase
          return [
            `This is my final offer: $${finalPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. I cannot go any higher than this.`,
            `$${finalPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} is absolutely my final offer. I'll have to walk away if we can't agree on this price.`,
            `I'm making my final offer of $${finalPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. This is the absolute maximum I can pay.`,
            `My final and best offer is $${finalPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. I hope we can close the deal at this price.`
          ];
        }
        break;
        
      case 'walk_away':
        // Preferably use the buyer's last offer
        if (buyerLastOffer) {
          return [
            `I'm prepared to walk away if we can't agree on $${buyerLastOffer.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. There are other options available to me.`,
            `If we can't reach an agreement at $${buyerLastOffer.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}, I'll unfortunately need to look elsewhere.`,
            `$${buyerLastOffer.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} is my offer, and I'm ready to walk away if needed. I've seen similar vehicles for less.`,
            `I have other options if we can't agree on $${buyerLastOffer.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. I hope we can make this work, but I'm prepared to move on.`
          ];
        }
        // Fallback to current price
        else if (currentPrice) {
          return [
            `I'm prepared to walk away if we can't agree on $${currentPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. There are other options available to me.`,
            `If we can't reach an agreement at $${currentPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}, I'll unfortunately need to look elsewhere.`,
            `$${currentPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} is my offer, and I'm ready to walk away if needed. I've seen similar vehicles for less.`,
            `I have other options if we can't agree on $${currentPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}. I hope we can make this work, but I'm prepared to move on.`
          ];
        }
        break;
        
      default:
        return originalOffers;
    }
    
    return originalOffers;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setAccentPosition({
        x: `${30 + Math.sin(Date.now() / 5000) * 20}%`,
        y: `${20 + Math.cos(Date.now() / 5000) * 20}%`,
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  const startNegotiation = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:8000/negotiations/start');
      setNegotiation(response.data);
    } catch (error) {
      console.error('Failed to start negotiation:', error);
    } finally {
      setLoading(false);
    }
  };

  const simulateLoading = () => {
    setLoadingStep(0);
    loadingInterval.current = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < loadingSteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(loadingInterval.current);
          return prev;
        }
      });
    }, 1200);
  };

  const makeOffer = async (offerIndex) => {
    try {
      setLoading(true);
      setSelectedOfferIndex(offerIndex);
      
      // Start the loading animation
      simulateLoading();
      
      // Show strategy being applied if one is selected
      if (selectedStrategy) {
        setStrategyBeingApplied(true);
      }
      
      // Log the selected strategy for debugging
      console.log("Selected strategy:", selectedStrategy);
      
      // Delay the actual API call to show the animation
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Get the actual text of the selected offer
      let selectedOfferText;
      if (selectedStrategy) {
        // If a strategy is selected, get the text from our strategy-specific offers
        const strategyOffers = getStrategySpecificOffers(selectedStrategy, negotiation.available_offers);
        selectedOfferText = strategyOffers[offerIndex];
      } else {
        // Otherwise, use the original offers from the backend
        selectedOfferText = negotiation.available_offers[offerIndex];
      }
      
      // Extract the price from the offer text
      const priceMatch = selectedOfferText.match(/\$([0-9,]+(?:\.[0-9]+)?)/);
      let extractedPrice = null;
      if (priceMatch) {
        extractedPrice = parseFloat(priceMatch[1].replace(',', ''));
      }
      
      console.log("Selected offer text:", selectedOfferText);
      console.log("Extracted price:", extractedPrice);
      
      // Prepare the request payload
      const payload = { 
        offer_index: offerIndex,
        offer_text: selectedOfferText  // Include the actual text of the offer
      };
      
      // Include the extracted price if available
      if (extractedPrice !== null) {
        payload.explicit_price = extractedPrice;
      }
      
      // Only include strategy if one is selected
      if (selectedStrategy) {
        payload.strategy = selectedStrategy;
      }
      
      console.log("Sending payload:", payload);
      
      const response = await axios.post(
        `http://localhost:8000/negotiations/${negotiation.negotiation_id}/make_offer`,
        payload
      );
      
      // Add a visual indicator of the strategy used in the response
      if (selectedStrategy) {
        const strategyName = strategies.find(s => s.id === selectedStrategy)?.name;
        const updatedResponse = {
          ...response.data,
          history: [...response.data.history]
        };
        
        // Add a note about the strategy used (only visible to the user in the UI)
        const lastIndex = updatedResponse.history.length - 1;
        if (lastIndex >= 0 && updatedResponse.history[lastIndex][0] === "Seller") {
          // Add a strategy indicator to the seller's response
          const sellerResponse = updatedResponse.history[lastIndex][1];
          updatedResponse.history[lastIndex] = [
            "Seller",
            `${sellerResponse}\n\n<span style="font-size: 0.8rem; color: #6c757d; font-style: italic;">The seller is responding to your "${strategyName}" strategy.</span>`
          ];
        }
        
        setNegotiation(updatedResponse);
      } else {
      setNegotiation(response.data);
      }
      
      // Reset selected strategy
      setSelectedStrategy(null);
    } catch (error) {
      console.error('Failed to make offer:', error);
    } finally {
      setLoading(false);
      setStrategyBeingApplied(false);
    }
  };

  // Calculate progress percentage based on negotiation data
  const calculateProgress = () => {
    if (!negotiation) return 0;
    if (negotiation.agreed_price) return 100;
    
    // Use the progress score from the backend
    return negotiation.progress_score;
  };

  // Format a number as a percentage
  const formatPercent = (value) => {
    return `${Math.round(value)}%`;
  };

  return (
    <Container>
      <BackgroundGraphic />
      <GraphicAccent 
        animate={{
          x: accentPosition.x,
          y: accentPosition.y,
        }}
        transition={{
          type: "spring",
          stiffness: 10,
          damping: 20
        }}
      />
      
      <AnimatePresence>
        {loading && (
          <LoadingOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LoadingContent>
              <LoadingTitle>Processing Your Offer</LoadingTitle>
              <LoadingDescription>
                {loadingSteps[loadingStep]}
              </LoadingDescription>
              
              <ThinkingBubbles>
                <Bubble
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1.5,
                    delay: 0 
                  }}
                />
                <Bubble
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1.5,
                    delay: 0.2 
                  }}
                />
                <Bubble
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1.5,
                    delay: 0.4 
                  }}
                />
              </ThinkingBubbles>
              
              <LoadingIndicator>
                <LoadingBar
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ 
                    duration: 5,
                    ease: "linear"
                  }}
                />
              </LoadingIndicator>
              
              <p style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                The AI is carefully analyzing your offer and preparing a response...
              </p>
            </LoadingContent>
          </LoadingOverlay>
        )}
      </AnimatePresence>
      
      <Content
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Header>
          <Logo>
            <LogoIcon>💬</LogoIcon>
            <LogoText>negot<span>AI</span>tion</LogoText>
          </Logo>
          <HeaderActions>
            <Badge>AI-Powered</Badge>
          </HeaderActions>
        </Header>

        {!negotiation ? (
          <Card
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <h2 style={{ marginBottom: '1.5rem', color: '#212529' }}>Begin Your Negotiation Session</h2>
              <p style={{ color: '#6c757d', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
                Start a new negotiation session to experience our AI-powered price negotiation system. The system will guide you through the process.
              </p>
              <StartButton
                onClick={startNegotiation}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? 'Initializing...' : 'Start New Negotiation'}
              </StartButton>
            </div>
          </Card>
        ) : (
          <>
            <StatusCard
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <StatusInfo>
                <StatusLabel>Negotiation Status</StatusLabel>
                <StatusValue success={negotiation.agreed_price}>
                  {negotiation.agreed_price 
                    ? `Deal Agreed: $${negotiation.agreed_price.toLocaleString()}` 
                    : negotiation.current_offer 
                      ? `Current Offer: $${negotiation.current_offer.toLocaleString()}` 
                      : 'Negotiation in Progress'}
                </StatusValue>
              </StatusInfo>
              <StatusIcon success={negotiation.agreed_price}>
                {negotiation.agreed_price ? '✓' : '↔'}
              </StatusIcon>
            </StatusCard>
            
            {/* Metrics Card */}
            {negotiation.metrics && (
              <MetricsCard
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <CardHeader>
                  <CardTitle>Negotiation Metrics</CardTitle>
                  <Badge active>{formatPercent(calculateProgress())} Complete</Badge>
                </CardHeader>
                
                <MetricsGrid>
                  <MetricItem>
                    <MetricValue>{negotiation.metrics.rounds}</MetricValue>
                    <MetricLabel>Rounds</MetricLabel>
                  </MetricItem>
                  <MetricItem>
                    <MetricValue>{negotiation.metrics.buyer_concessions}</MetricValue>
                    <MetricLabel>Your Concessions</MetricLabel>
                  </MetricItem>
                  <MetricItem>
                    <MetricValue>{negotiation.metrics.seller_concessions}</MetricValue>
                    <MetricLabel>Seller Concessions</MetricLabel>
                  </MetricItem>
                  <MetricItem>
                    <MetricValue>{negotiation.metrics.stand_firm_count}</MetricValue>
                    <MetricLabel>Times Stood Firm</MetricLabel>
                  </MetricItem>
                </MetricsGrid>
                
                {/* Strategy Effectiveness */}
                {negotiation.metrics.strategy_effectiveness && 
                  Object.keys(negotiation.metrics.strategy_effectiveness).length > 0 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '1rem' }}>
                      Strategy Effectiveness
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {Object.entries(negotiation.metrics.strategy_effectiveness).map(([strategy, data]) => {
                        const effectiveness = data.used > 0 ? Math.round((data.effective / data.used) * 100) : 0;
                        const getColor = () => {
                          if (effectiveness >= 70) return '#198754'; // Success
                          if (effectiveness >= 40) return '#fd7e14'; // Warning
                          return '#dc3545'; // Danger
                        };
                        
                        return (
                          <div 
                            key={strategy}
                            style={{
                              padding: '0.5rem 0.75rem',
                              borderRadius: '4px',
                              background: 'rgba(255, 255, 255, 0.8)',
                              border: '1px solid #e9ecef',
                              fontSize: '0.875rem'
                            }}
                          >
                            <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                              {strategy.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div 
                                style={{ 
                                  width: '50px', 
                                  height: '6px', 
                                  background: '#e9ecef',
                                  borderRadius: '3px',
                                  overflow: 'hidden'
                                }}
                              >
                                <div 
                                  style={{ 
                                    height: '100%', 
                                    width: `${effectiveness}%`, 
                                    background: getColor(),
                                    borderRadius: '3px'
                                  }}
                                />
                              </div>
                              <span style={{ color: getColor(), fontWeight: '600', fontSize: '0.75rem' }}>
                                {effectiveness}%
                              </span>
                              <span style={{ color: '#6c757d', fontSize: '0.75rem' }}>
                                ({data.effective}/{data.used})
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Sentiment Analysis */}
                {negotiation.sentiment && (
                  <SentimentMeter>
                    <h3 style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '1rem' }}>
                      Seller's Sentiment Analysis
                    </h3>
                    
                    <SentimentLabel>
                      <span>Positivity</span>
                      <span>{negotiation.sentiment.positivity}/10</span>
                    </SentimentLabel>
                    <SentimentBar>
                      <SentimentFill type="positivity" value={negotiation.sentiment.positivity} />
                    </SentimentBar>
                    
                    <SentimentLabel>
                      <span>Openness to Negotiation</span>
                      <span>{negotiation.sentiment.openness}/10</span>
                    </SentimentLabel>
                    <SentimentBar>
                      <SentimentFill type="openness" value={negotiation.sentiment.openness} />
                    </SentimentBar>
                    
                    <SentimentLabel>
                      <span>Firmness on Position</span>
                      <span>{negotiation.sentiment.firmness}/10</span>
                    </SentimentLabel>
                    <SentimentBar>
                      <SentimentFill type="firmness" value={negotiation.sentiment.firmness} />
                    </SentimentBar>
                    
                    <SentimentLabel>
                      <span>Flexibility</span>
                      <span>{negotiation.sentiment.flexibility}/10</span>
                    </SentimentLabel>
                    <SentimentBar>
                      <SentimentFill type="flexibility" value={negotiation.sentiment.flexibility} />
                    </SentimentBar>
                  </SentimentMeter>
                )}
              </MetricsCard>
            )}
            
            <ProgressContainer>
              <ProgressHeader>
                <ProgressLabel>Negotiation Progress</ProgressLabel>
                <ProgressValue value={calculateProgress()}>
                  {calculateProgress() >= 70 ? 'Good Progress' : 
                   calculateProgress() >= 40 ? 'Fair Progress' : 'Needs Improvement'}
                </ProgressValue>
              </ProgressHeader>
              <ProgressBar>
                <ProgressFill 
                  value={calculateProgress()}
                  initial={{ width: 0 }}
                  animate={{ width: `${calculateProgress()}%` }}
                  transition={{ duration: 0.5 }}
                />
              </ProgressBar>
            </ProgressContainer>
            
            <Grid>
              <Card
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CardHeader>
                  <CardTitle>Conversation History</CardTitle>
                  <Badge active>{negotiation.history.length} Messages</Badge>
                </CardHeader>
                <ScrollableContent>
                  <AnimatePresence>
                    {negotiation.history.map(([speaker, message], index) => (
                      <Message
                        key={index}
                        type={speaker}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <MessageHeader type={speaker}>
                          <MessageIcon type={speaker} />
                          {speaker}
                        </MessageHeader>
                        <MessageContent dangerouslySetInnerHTML={{ __html: message }}></MessageContent>
                      </Message>
                    ))}
                  </AnimatePresence>
                </ScrollableContent>
              </Card>

              <Card
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CardHeader>
                  <CardTitle>Available Options</CardTitle>
                  <Badge active={!negotiation.agreed_price}>
                    {negotiation.agreed_price ? 'Completed' : 'Your Turn'}
                  </Badge>
                </CardHeader>
                
                {negotiation.agreed_price ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <StatusIcon success style={{ margin: '0 auto 1.5rem' }}>✓</StatusIcon>
                    <h3 style={{ marginBottom: '1rem', color: '#0d6efd' }}>
                      Negotiation Successful
                    </h3>
                    <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
                      You've successfully completed the negotiation at ${negotiation.agreed_price.toLocaleString()}.
                    </p>
                    <StartButton
                      onClick={startNegotiation}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{ marginTop: '1rem' }}
                    >
                      Start New Negotiation
                    </StartButton>
                  </div>
                ) : (
                  <>
                    {/* Strategy Selection */}
                    {negotiation.available_offers.length > 0 && (
                      <div style={{ 
                        marginBottom: '1.5rem', 
                        padding: '1rem',
                        background: 'rgba(13, 110, 253, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(13, 110, 253, 0.1)'
                      }}>
                        <h3 style={{ 
                          fontSize: '0.95rem', 
                          fontWeight: '600', 
                          color: '#0d6efd', 
                          marginBottom: '0.75rem' 
                        }}>
                          Select Your Negotiation Strategy
                        </h3>
                        <p style={{ color: '#6c757d', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                          Choose a strategy to guide your negotiation approach:
                        </p>
                        <div>
                          {strategies.map(strategy => (
                            <StrategyTag 
                              key={strategy.id}
                              active={selectedStrategy === strategy.id}
                              onClick={() => setSelectedStrategy(
                                selectedStrategy === strategy.id ? null : strategy.id
                              )}
                            >
                              {strategy.name}
                            </StrategyTag>
                          ))}
                        </div>
                        {selectedStrategy && (
                          <div style={{ 
                            marginTop: '0.75rem', 
                            fontSize: '0.875rem', 
                            color: '#0d6efd',
                            fontWeight: '500'
                          }}>
                            Strategy selected: {strategies.find(s => s.id === selectedStrategy)?.name}
                          </div>
                        )}
                        
                        {selectedStrategy && strategyBeingApplied && (
                          <div style={{ 
                            marginTop: '0.75rem', 
                            padding: '0.5rem',
                            backgroundColor: 'rgba(13, 110, 253, 0.1)',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            color: '#0d6efd',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                          }}>
                            <div style={{ 
                              width: '16px', 
                              height: '16px', 
                              borderRadius: '50%', 
                              borderTop: '2px solid #0d6efd',
                              borderRight: '2px solid transparent',
                              animation: 'spin 1s linear infinite'
                            }}></div>
                            Applying {strategies.find(s => s.id === selectedStrategy)?.name} strategy...
                          </div>
                        )}
                      </div>
                    )}
                  
                    <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
                      Select your next response from the options below:
                    </p>
                    <OfferGrid>
                      <AnimatePresence>
                        {/* Use strategy-specific offers if a strategy is selected, otherwise use the original offers */}
                        {(selectedStrategy 
                          ? getStrategySpecificOffers(selectedStrategy, negotiation.available_offers)
                          : negotiation.available_offers
                        ).map((offer, index) => (
                          <OfferButtonContainer key={index}>
                            <OfferButton
                              onClick={() => makeOffer(index)}
                              disabled={loading}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: index * 0.05 }}
                            >
                              {offer}
                            </OfferButton>
                            {selectedOfferIndex === index && loading && (
                              <OfferButtonOverlay
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                              >
                                Processing...
                              </OfferButtonOverlay>
                            )}
                          </OfferButtonContainer>
                        ))}
                      </AnimatePresence>
                    </OfferGrid>
                  </>
                )}
              </Card>
            </Grid>
          </>
        )}
      </Content>
    </Container>
  );
}

export default App; 