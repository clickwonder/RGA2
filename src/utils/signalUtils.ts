export function getSignalsForCategory(category: string): string[] {
  switch (category.toLowerCase()) {
    case 'candlestick':
      return [
        'BullishEngulfing', 'BearishEngulfing', 'UpCandle', 'DownCandle',
        'ThreeUpCandles', 'ThreeDownCandles', 'BullishHarami', 'BearishHarami',
        'Doji', 'Hammer', 'ShootingStar', 'EveningStar', 'MorningStar'
      ];
    case 'oscillator':
      return [
        'RSIBelow30', 'RSIAbove70', 'StochasticBelow20', 'StochasticAbove80',
        'StochKCrossAboveD', 'StochKCrossBelowD', 'ADXAbove30'
      ];
    case 'movingaverage':
      return [
        'SMA50AboveSMA200', 'SMA50BelowSMA200', 'SMA7AboveSMA21', 'SMA7BelowSMA21',
        'EMA20AboveEMA50', 'EMA20BelowEMA50', 'SMA21AboveSMA50', 'SMA21BelowSMA50'
      ];
    case 'bollingerbands':
      return [
        'PriceAboveUpper', 'PriceBelowLower', 'CloseAboveBB2_20Upper', 'CloseBelowBB2_20Lower',
        'CloseAboveBB3_20Upper', 'CloseBelowBB3_20Lower', 'CloseAboveBB1_20Upper', 'CloseBelowBB1_20Lower'
      ];
    case 'volume':
      return [
        'VolumeIncreasing', 'VolumeDecreasing', 'CMFAbove40', 'CMFAbove35',
        'CMFAbove30', 'CMFBelowMinus40', 'CMFBelowMinus30', 'CMFBelowMinus20'
      ];
    case 'trend':
      return [
        'CCIAbove250', 'CCIAbove200', 'CCIAbove150', 'CCIAbove100',
        'CCIBelowMinus250', 'CCIBelowMinus200', 'CCIBelowMinus150', 'CCIBelowMinus100',
        'LinRegSlopeAbove5', 'LinRegSlopeAbove10', 'LinRegSlopeBelowMinus5', 'LinRegSlopeBelowMinus10'
      ];
    case 'aroon':
      return [
        'AroonUpAboveDown', 'AroonUpBelowDown', 'AroonOscAbove90',
        'AroonOscAbove80', 'AroonOscBelowMinus90', 'AroonOscBelowMinus80'
      ];
    case 'choppiness':
      return [
        'ChoppinessIndexAbove70', 'ChoppinessIndexAbove65', 'ChoppinessIndexAbove60',
        'ChoppinessIndexBelow40', 'ChoppinessIndexBelow35', 'ChoppinessIndexBelow30'
      ];
    case 'supportresistance':
      return [
        'PriceAboveS1', 'PriceAboveS2', 'PriceAboveS3', 'PriceBelowR1',
        'PriceBelowR2', 'PriceBelowR3', 'PriceBelowS1', 'PriceBelowS2',
        'PriceBelowS3', 'PriceAboveR1', 'PriceAboveR2', 'PriceAboveR3'
      ];
    case 'fibonacci':
      return [
        'PriceAbove236Retracement', 'PriceAbove382Retracement', 'PriceAbove500Retracement',
        'PriceAbove618Retracement', 'PriceBelow236Retracement', 'PriceBelow382Retracement',
        'PriceBelow500Retracement', 'PriceBelow618Retracement'
      ];
    default:
      return [];
  }
}