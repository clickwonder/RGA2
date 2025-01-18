import { BarData, GeneticSettings, SignalCombination, BacktestResult, Signal } from '../types';
import { generateSignals } from './signals';
import { runBacktest } from './backtest';

const availableSignals = {
  candlestick: {
    namespace: 'CandlestickPatterns',
    signals: [
      'BullishEngulfing', 'BearishEngulfing', 'UpCandle', 'DownCandle',
      'ThreeUpCandles', 'ThreeDownCandles', 'BullishHarami', 'BearishHarami',
      'Doji', 'Hammer', 'ShootingStar', 'EveningStar', 'MorningStar'
    ]
  },
  oscillator: {
    namespace: 'OscillatorSignals',
    signals: [
      'RSIBelow30', 'RSIAbove70', 'StochasticBelow20', 'StochasticAbove80',
      'StochKCrossAboveD', 'StochKCrossBelowD', 'ADXAbove30'
    ]
  },
  movingaverage: {
    namespace: 'MovingAverageCrossovers',
    signals: [
      'SMA50AboveSMA200', 'SMA50BelowSMA200', 'SMA7AboveSMA21', 'SMA7BelowSMA21',
      'EMA20AboveEMA50', 'EMA20BelowEMA50', 'SMA21AboveSMA50', 'SMA21BelowSMA50'
    ]
  },
  bollingerbands: {
    namespace: 'BollingerBandSignals',
    signals: [
      'PriceAboveUpper', 'PriceBelowLower', 'CloseAboveBB2_20Upper', 'CloseBelowBB2_20Lower',
      'CloseAboveBB3_20Upper', 'CloseBelowBB3_20Lower', 'CloseAboveBB1_20Upper', 'CloseBelowBB1_20Lower'
    ]
  },
  volume: {
    namespace: 'VolumeSignals',
    signals: [
      'VolumeIncreasing', 'VolumeDecreasing', 'CMFAbove40', 'CMFAbove35',
      'CMFAbove30', 'CMFBelowMinus40', 'CMFBelowMinus30', 'CMFBelowMinus20'
    ]
  },
  trend: {
    namespace: 'TrendIndicators',
    signals: [
      'CCIAbove250', 'CCIAbove200', 'CCIAbove150', 'CCIAbove100',
      'CCIBelowMinus250', 'CCIBelowMinus200', 'CCIBelowMinus150', 'CCIBelowMinus100',
      'LinRegSlopeAbove5', 'LinRegSlopeAbove10', 'LinRegSlopeBelowMinus5', 'LinRegSlopeBelowMinus10'
    ]
  },
  aroon: {
    namespace: 'AroonSignals',
    signals: [
      'AroonUpAboveDown', 'AroonUpBelowDown', 'AroonOscAbove90',
      'AroonOscAbove80', 'AroonOscBelowMinus90', 'AroonOscBelowMinus80'
    ]
  },
  choppiness: {
    namespace: 'ChoppinessSignals',
    signals: [
      'ChoppinessIndexAbove70', 'ChoppinessIndexAbove65', 'ChoppinessIndexAbove60',
      'ChoppinessIndexBelow40', 'ChoppinessIndexBelow35', 'ChoppinessIndexBelow30'
    ]
  },
  supportresistance: {
    namespace: 'SupportResistanceSignals',
    signals: [
      'PriceAboveS1', 'PriceAboveS2', 'PriceAboveS3', 'PriceBelowR1',
      'PriceBelowR2', 'PriceBelowR3', 'PriceBelowS1', 'PriceBelowS2',
      'PriceBelowS3', 'PriceAboveR1', 'PriceAboveR2', 'PriceAboveR3'
    ]
  },
  fibonacci: {
    namespace: 'FibonacciSignals',
    signals: [
      'PriceAbove236Retracement', 'PriceAbove382Retracement', 'PriceAbove500Retracement',
      'PriceAbove618Retracement', 'PriceBelow236Retracement', 'PriceBelow382Retracement',
      'PriceBelow500Retracement', 'PriceBelow618Retracement'
    ]
  }
};

function generateRandomSignal(): Signal {
  // Get random namespace
  const categories = Object.keys(availableSignals);
  const category = categories[Math.floor(Math.random() * categories.length)];
  const { namespace, signals } = availableSignals[category];
  const name = signals[Math.floor(Math.random() * signals.length)];
  
  return { namespace, name };
}

function generateRandomCombination(settings: GeneticSettings): SignalCombination {
  const entries = {
    entry1: [] as Signal[],
    entry2: [] as Signal[],
    entry3: [] as Signal[]
  };

  if (settings.useSelectedSignals) {
    // Use selected signals from settings
    entries.entry1 = settings.selectedSignals.entry1.map(signal => {
      const [namespace, name] = signal.split('.');
      return { namespace, name };
    });
    entries.entry2 = settings.selectedSignals.entry2.map(signal => {
      const [namespace, name] = signal.split('.');
      return { namespace, name };
    });
    entries.entry3 = settings.selectedSignals.entry3.map(signal => {
      const [namespace, name] = signal.split('.');
      return { namespace, name };
    });
  } else {
    // Generate random signals
    const numSignals = Math.floor(Math.random() * 3) + 1; // 1-3 signals per group
    
    for (let i = 0; i < numSignals; i++) {
      const group = Math.floor(Math.random() * 3); // Random group 0-2
      const signal = generateRandomSignal();
      
      if (group === 0) entries.entry1.push(signal);
      else if (group === 1) entries.entry2.push(signal);
      else entries.entry3.push(signal);
    }
  }

  // Generate exit parameters based on settings
  const profitTarget = settings.exits.fixedTarget.enabled
    ? Math.floor(Math.random() * (settings.exits.fixedTarget.params.profitTargetMax - 
        settings.exits.fixedTarget.params.profitTargetMin + 1)) + 
      settings.exits.fixedTarget.params.profitTargetMin
    : 20;

  const stopLoss = settings.exits.stopLoss.enabled
    ? Math.floor(Math.random() * (settings.exits.stopLoss.params.stopLossMax - 
        settings.exits.stopLoss.params.stopLossMin + 1)) + 
      settings.exits.stopLoss.params.stopLossMin
    : 20;

  const trailingStop = settings.exits.trailingStop.enabled
    ? Math.floor(Math.random() * (settings.exits.trailingStop.params.trailingMax - 
        settings.exits.trailingStop.params.trailingMin + 1)) + 
      settings.exits.trailingStop.params.trailingMin
    : 8;

  return {
    mode: settings.useSelectedSignals && !settings.randomizeEntryMode 
      ? settings.selectedSignals.entryMode 
      : Math.random() < 0.33 ? 'Signals' : Math.random() < 0.5 ? 'Confirmations' : 'Split',
    entries,
    profitTarget,
    stopLoss,
    trailingStop
  };
}

function crossover(parent1: SignalCombination, parent2: SignalCombination): SignalCombination {
  const entries = {
    entry1: [] as Signal[],
    entry2: [] as Signal[],
    entry3: [] as Signal[]
  };

  // Randomly select signals from each parent for each entry group
  ['entry1', 'entry2', 'entry3'].forEach(group => {
    const parentSignals = Math.random() < 0.5 ? 
      parent1.entries[group] : parent2.entries[group];
    
    entries[group] = [...parentSignals];
  });

  return {
    mode: Math.random() < 0.5 ? parent1.mode : parent2.mode,
    entries,
    profitTarget: Math.random() < 0.5 ? parent1.profitTarget : parent2.profitTarget,
    stopLoss: Math.random() < 0.5 ? parent1.stopLoss : parent2.stopLoss,
    trailingStop: Math.random() < 0.5 ? parent1.trailingStop : parent2.trailingStop,
  };
}

function mutate(combination: SignalCombination, rate: number, settings: GeneticSettings): SignalCombination {
  const mutated = { ...combination };

  // Only mutate mode if randomization is allowed
  if (!settings.useSelectedSignals || settings.randomizeEntryMode) {
    if (Math.random() < rate) {
      mutated.mode = ['Signals', 'Confirmations', 'Split'][Math.floor(Math.random() * 3)] as any;
    }
  }

  // Only mutate signals if not using selected signals
  if (!settings.useSelectedSignals && Math.random() < rate) {
    ['entry1', 'entry2', 'entry3'].forEach(group => {
      if (Math.random() < 0.5) {
        // Add a random signal
        mutated.entries[group].push(generateRandomSignal());
      } else if (mutated.entries[group].length > 0) {
        // Remove a random signal
        const indexToRemove = Math.floor(Math.random() * mutated.entries[group].length);
        mutated.entries[group] = mutated.entries[group].filter((_, i) => i !== indexToRemove);
      }
    });
  }

  // Always mutate exit parameters
  if (Math.random() < rate) {
    if (settings.exits.fixedTarget.enabled) {
      mutated.profitTarget = Math.max(
        settings.exits.fixedTarget.params.profitTargetMin,
        Math.min(
          settings.exits.fixedTarget.params.profitTargetMax,
          mutated.profitTarget + (Math.random() < 0.5 ? 5 : -5)
        )
      );
    }
  }

  if (Math.random() < rate) {
    if (settings.exits.stopLoss.enabled) {
      mutated.stopLoss = Math.max(
        settings.exits.stopLoss.params.stopLossMin,
        Math.min(
          settings.exits.stopLoss.params.stopLossMax,
          mutated.stopLoss + (Math.random() < 0.5 ? 5 : -5)
        )
      );
    }
  }

  if (Math.random() < rate) {
    if (settings.exits.trailingStop.enabled) {
      mutated.trailingStop = Math.max(
        settings.exits.trailingStop.params.trailingMin,
        Math.min(
          settings.exits.trailingStop.params.trailingMax,
          mutated.trailingStop + (Math.random() < 0.5 ? 2 : -2)
        )
      );
    }
  }

  return mutated;
}

function calculateFitness(
  results: BacktestResult,
  weights: GeneticSettings['fitnessWeights'],
  constraints: GeneticSettings['constraints'],
  isInitializing: boolean = false
): number {
  // Base fitness for having any trades
  let fitness = 0;
  
  // No trades means no fitness
  if (results.totalTrades === 0) {
    return fitness;
  }

  // Calculate components
  const profitFactorComponent = Math.min(3, results.profitFactor || 0) / 3;
  const winRateComponent = results.winRate;
  const drawdownComponent = Math.max(0, 1 - (results.maxDrawdown / 100));
  const profitComponent = results.netProfit > 0 ? 
    Math.min(1, Math.log10(results.netProfit + 1) / 3) : 
    Math.max(-0.5, results.netProfit / 1000);
  const tradeCountComponent = Math.min(1, results.totalTrades / constraints.minimumTrades);

  // Weight the components
  fitness = (
    weights.profitFactor * profitFactorComponent +
    weights.winRate * winRateComponent +
    weights.maxDrawdown * drawdownComponent +
    weights.netProfit * profitComponent +
    weights.tradeCount * tradeCountComponent
  ) / Object.values(weights).reduce((a, b) => a + b, 0);

  // Apply penalties for constraint violations (but don't eliminate completely during initialization)
  if (!isInitializing) {
    if (results.totalTrades < constraints.minimumTrades) {
      fitness *= 0.5;
    }
    if (results.winRate < constraints.minimumWinRate) {
      fitness *= 0.7;
    }
    if (results.maxDrawdown > constraints.maximumDrawdown) {
      fitness *= 0.8;
    }
  }

  return Math.max(0, fitness);
}

export { 
  generateRandomCombination,
  crossover,
  mutate,
  calculateFitness,
  availableSignals
};