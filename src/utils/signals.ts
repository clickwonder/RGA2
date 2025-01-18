import { BarData } from '../types';

// Import all indicator functions
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateStochastic,
  calculateBollingerBands,
  calculateADX,
  calculateCMF,
  calculateCCI,
  calculateLinearRegressionSlope,
  calculateAroon,
  calculateChoppinessIndex,
  calculatePivotPoints,
  calculateFibonacciRetracements,
  isBullishEngulfing,
  isBearishEngulfing,
  isBullishHarami,
  isBearishHarami,
  isDoji,
  isHammer,
  isShootingStar,
  isMorningStar,
  isEveningStar,
  isThreeWhiteSoldiers,
  isThreeBlackCrows
} from './indicators';

interface SignalState {
  [key: string]: boolean;
}

// Helper function to check if all required signals are present
function checkConfirmations(signalState: SignalState, selectedSignals: string[]): boolean {
  if (selectedSignals.length === 0) return false;
  return selectedSignals.every(signal => signalState[signal]);
}

// Signal Generation Functions
export function generateSignals(bars: BarData[], signalGroup: any, mode: string = 'signals'): boolean[] {
  if (!bars || bars.length === 0) {
    console.error('No data provided for signal generation');
    return [];
  }

  if (!signalGroup || !Array.isArray(signalGroup)) {
    console.error('Invalid signal group format:', signalGroup);
    return Array(bars.length).fill(false);
  }

  // Debug logging
  console.log('Generating signals for:', {
    totalBars: bars.length,
    signalCount: signalGroup.length,
    signals: signalGroup.map(s => `${s.namespace}.${s.name}`)
  });

  const closes = bars.map(bar => bar.close);
  const highs = bars.map(bar => bar.high);
  const lows = bars.map(bar => bar.low);
  const volumes = bars.map(bar => bar.volume);
  const signals: boolean[] = Array(bars.length).fill(false);

  // Calculate indicators
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma7 = calculateSMA(closes, 7);
  const sma21 = calculateSMA(closes, 21);
  const sma200 = calculateSMA(closes, 200);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const rsi = calculateRSI(closes);
  const { k: stochK, d: stochD } = calculateStochastic(highs, lows, closes);
  const bb2 = calculateBollingerBands(closes, 20, 2);
  const bb1 = calculateBollingerBands(closes, 20, 1);
  const bb3 = calculateBollingerBands(closes, 20, 3);
  const adx = calculateADX(highs, lows, closes);
  const cmf = calculateCMF(highs, lows, closes, volumes);
  const cci = calculateCCI(highs, lows, closes);
  const slope = calculateLinearRegressionSlope(closes);
  const { up: aroonUp, down: aroonDown, oscillator: aroonOsc } = calculateAroon(highs, lows);
  const chop = calculateChoppinessIndex(highs, lows, closes);
  const { r1, r2, r3, s1, s2, s3 } = calculatePivotPoints(highs, lows, closes);
  const { fib236, fib382, fib500, fib618 } = calculateFibonacciRetracements(highs, lows);

  let signalState: SignalState = {};

  for (let i = 1; i < bars.length; i++) {
    const bar = bars[i];
    const prevBar = bars[i - 1];
    const prev2Bar = i > 1 ? bars[i - 2] : null;

    // Evaluate each signal in the group
    for (const signal of signalGroup) {
      if (!signal || !signal.namespace || !signal.name) {
        console.warn('Invalid signal format:', signal);
        continue;
      }

      const signalKey = `${signal.namespace}.${signal.name}`;
      const signalName = signal.name.toLowerCase();
      switch (signalName) {
        // Candlestick Patterns
        case 'bullishengulfing':
          signalState[signalKey] = isBullishEngulfing(prevBar.open, prevBar.close, bar.open, bar.close);
          break;

        case 'bearishengulfing':
          signalState[signalKey] = isBearishEngulfing(prevBar.open, prevBar.close, bar.open, bar.close);
          break;

        case 'upcandle':
          signalState[signalKey] = bar.close > bar.open;
          break;

        case 'downcandle':
          signalState[signalKey] = bar.close < bar.open;
          break;

        case 'threeupcandles':
          signalState[signalKey] = prev2Bar && isThreeWhiteSoldiers(prev2Bar, prevBar, bar);
          break;

        case 'threedowncandles':
          signalState[signalKey] = prev2Bar && isThreeBlackCrows(prev2Bar, prevBar, bar);
          break;

        case 'bullishharami':
          signalState[signalKey] = isBullishHarami(prevBar.open, prevBar.close, prevBar.high, prevBar.low,
                                               bar.open, bar.close, bar.high, bar.low);
          break;

        case 'bearishharami':
          signalState[signalKey] = isBearishHarami(prevBar.open, prevBar.close, prevBar.high, prevBar.low,
                                               bar.open, bar.close, bar.high, bar.low);
          break;

        case 'doji':
          signalState[signalKey] = isDoji(bar);
          break;

        case 'hammer':
          signalState[signalKey] = isHammer(bar);
          break;

        case 'shootingstar':
          signalState[signalKey] = isShootingStar(bar);
          break;

        case 'eveningstar':
          signalState[signalKey] = prev2Bar && isEveningStar(prev2Bar, prevBar, bar);
          break;

        case 'morningstar':
          signalState[signalKey] = prev2Bar && isMorningStar(prev2Bar, prevBar, bar);
          break;

        // Moving Averages
        case 'sma50abovesma200':
          if (!isNaN(sma50[i]) && !isNaN(sma200[i])) {
            signalState[signalKey] = sma50[i] > sma200[i] && sma50[i-1] <= sma200[i-1];
          }
          break;

        case 'sma50belowsma200':
          if (!isNaN(sma50[i]) && !isNaN(sma200[i])) {
            signalState[signalKey] = sma50[i] < sma200[i] && sma50[i-1] >= sma200[i-1];
          }
          break;

        case 'sma7abovesma21':
          if (!isNaN(sma7[i]) && !isNaN(sma21[i])) {
            signalState[signalKey] = sma7[i] > sma21[i] && sma7[i-1] <= sma21[i-1];
          }
          break;

        case 'sma7belowsma21':
          if (!isNaN(sma7[i]) && !isNaN(sma21[i])) {
            signalState[signalKey] = sma7[i] < sma21[i] && sma7[i-1] >= sma21[i-1];
          }
          break;

        case 'ema20aboveema50':
          if (!isNaN(ema20[i]) && !isNaN(ema50[i])) {
            signalState[signalKey] = ema20[i] > ema50[i] && ema20[i-1] <= ema50[i-1];
          }
          break;

        case 'ema20belowema50':
          if (!isNaN(ema20[i]) && !isNaN(ema50[i])) {
            signalState[signalKey] = ema20[i] < ema50[i] && ema20[i-1] >= ema50[i-1];
          }
          break;

        // RSI
        case 'rsibelow30':
          if (!isNaN(rsi[i])) {
            signalState[signalKey] = rsi[i] < 30 && rsi[i-1] >= 30;
          }
          break;

        case 'rsiabove70':
          if (!isNaN(rsi[i])) {
            signalState[signalKey] = rsi[i] > 70 && rsi[i-1] <= 70;
          }
          break;

        // Stochastic
        case 'stochasticbelow20':
          if (!isNaN(stochK[i]) && !isNaN(stochD[i])) {
            signalState[signalKey] = stochK[i] < 20 && stochD[i] < 20;
          }
          break;

        case 'stochasticabove80':
          if (!isNaN(stochK[i]) && !isNaN(stochD[i])) {
            signalState[signalKey] = stochK[i] > 80 && stochD[i] > 80;
          }
          break;

        case 'stochkcrossaboved':
          if (!isNaN(stochK[i]) && !isNaN(stochD[i])) {
            signalState[signalKey] = stochK[i] > stochD[i] && stochK[i-1] <= stochD[i-1];
          }
          break;

        case 'stochkcrossbelowd':
          if (!isNaN(stochK[i]) && !isNaN(stochD[i])) {
            signalState[signalKey] = stochK[i] < stochD[i] && stochK[i-1] >= stochD[i-1];
          }
          break;

        // Bollinger Bands
        case 'priceaboveupper':
          if (!isNaN(bb2.upper[i])) {
            signalState[signalKey] = bar.close > bb2.upper[i] && prevBar.close <= bb2.upper[i];
          }
          break;

        case 'pricebelowlower':
          if (!isNaN(bb2.lower[i])) {
            signalState[signalKey] = bar.close < bb2.lower[i] && prevBar.close >= bb2.lower[i];
          }
          break;

        case 'closeabovebb2_20upper':
          signalState[signalKey] = bar.close > bb2.upper[i];
          break;

        case 'closebelowbb2_20lower':
          signalState[signalKey] = bar.close < bb2.lower[i];
          break;

        case 'closeabovebb3_20upper':
          signalState[signalKey] = bar.close > bb3.upper[i];
          break;

        case 'closebelowbb3_20lower':
          signalState[signalKey] = bar.close < bb3.lower[i];
          break;

        case 'closeabovebb1_20upper':
          signalState[signalKey] = bar.close > bb1.upper[i];
          break;

        case 'closebelowbb1_20lower':
          signalState[signalKey] = bar.close < bb1.lower[i];
          break;

        // Volume
        case 'volumeincreasing':
          signalState[signalKey] = bar.volume > volumes.slice(Math.max(0, i-5), i)
            .reduce((a, b) => a + b, 0) / 5;
          break;

        case 'volumedecreasing':
          signalState[signalKey] = bar.volume < volumes.slice(Math.max(0, i-5), i)
            .reduce((a, b) => a + b, 0) / 5;
          break;

        case 'cmfabove40':
          signalState[signalKey] = cmf[i] > 0.40;
          break;

        case 'cmfabove35':
          signalState[signalKey] = cmf[i] > 0.35;
          break;

        case 'cmfabove30':
          signalState[signalKey] = cmf[i] > 0.30;
          break;

        case 'cmfbelowminus40':
          signalState[signalKey] = cmf[i] < -0.40;
          break;

        case 'cmfbelowminus30':
          signalState[signalKey] = cmf[i] < -0.30;
          break;

        case 'cmfbelowminus20':
          signalState[signalKey] = cmf[i] < -0.20;
          break;

        // Trend
        case 'cciabove250':
          signalState[signalKey] = cci[i] > 250;
          break;

        case 'cciabove200':
          signalState[signalKey] = cci[i] > 200;
          break;

        case 'cciabove150':
          signalState[signalKey] = cci[i] > 150;
          break;

        case 'cciabove100':
          signalState[signalKey] = cci[i] > 100;
          break;

        case 'ccibelowminus250':
          signalState[signalKey] = cci[i] < -250;
          break;

        case 'ccibelowminus200':
          signalState[signalKey] = cci[i] < -200;
          break;

        case 'ccibelowminus150':
          signalState[signalKey] = cci[i] < -150;
          break;

        case 'ccibelowminus100':
          signalState[signalKey] = cci[i] < -100;
          break;

        case 'linregslopeabove5':
          signalState[signalKey] = slope[i] > 5.0;
          break;

        case 'linregslopeabove10':
          signalState[signalKey] = slope[i] > 10.0;
          break;

        case 'linregslopebelowminus5':
          signalState[signalKey] = slope[i] < -5.0;
          break;

        case 'linregslopebelowminus10':
          signalState[signalKey] = slope[i] < -10.0;
          break;

        // Aroon
        case 'aroonupabovedown':
          signalState[signalKey] = aroonUp[i] > aroonDown[i];
          break;

        case 'aroonupbelowdown':
          signalState[signalKey] = aroonUp[i] < aroonDown[i];
          break;

        case 'aroonoscabove90':
          signalState[signalKey] = aroonOsc[i] > 90;
          break;

        case 'aroonoscabove80':
          signalState[signalKey] = aroonOsc[i] > 80;
          break;

        case 'aroonoscbelowminus90':
          signalState[signalKey] = aroonOsc[i] < -90;
          break;

        case 'aroonoscbelowminus80':
          signalState[signalKey] = aroonOsc[i] < -80;
          break;

        // Choppiness
        case 'choppinessindexabove70':
          signalState[signalKey] = chop[i] > 70;
          break;

        case 'choppinessindexabove65':
          signalState[signalKey] = chop[i] > 65;
          break;

        case 'choppinessindexabove60':
          signalState[signalKey] = chop[i] > 60;
          break;

        case 'choppinessindexbelow40':
          signalState[signalKey] = chop[i] < 40;
          break;

        case 'choppinessindexbelow35':
          signalState[signalKey] = chop[i] < 35;
          break;

        case 'choppinessindexbelow30':
          signalState[signalKey] = chop[i] < 30;
          break;

        // Support/Resistance
        case 'priceaboves1':
          signalState[signalKey] = bar.close > s1[i];
          break;

        case 'priceaboves2':
          signalState[signalKey] = bar.close > s2[i];
          break;

        case 'priceaboves3':
          signalState[signalKey] = bar.close > s3[i];
          break;

        case 'pricebelowr1':
          signalState[signalKey] = bar.close < r1[i];
          break;

        case 'pricebelowr2':
          signalState[signalKey] = bar.close < r2[i];
          break;

        case 'pricebelowr3':
          signalState[signalKey] = bar.close < r3[i];
          break;

        case 'pricebelows1':
          signalState[signalKey] = bar.close < s1[i];
          break;

        case 'pricebelows2':
          signalState[signalKey] = bar.close < s2[i];
          break;

        case 'pricebelows3':
          signalState[signalKey] = bar.close < s3[i];
          break;

        case 'priceabover1':
          signalState[signalKey] = bar.close > r1[i];
          break;

        case 'priceabover2':
          signalState[signalKey] = bar.close > r2[i];
          break;

        case 'priceabover3':
          signalState[signalKey] = bar.close > r3[i];
          break;

        // Fibonacci
        case 'priceabove236retracement':
          signalState[signalKey] = bar.close > fib236[i];
          break;

        case 'priceabove382retracement':
          signalState[signalKey] = bar.close > fib382[i];
          break;

        case 'priceabove500retracement':
          signalState[signalKey] = bar.close > fib500[i];
          break;

        case 'priceabove618retracement':
          signalState[signalKey] = bar.close > fib618[i];
          break;

        case 'pricebelow236retracement':
          signalState[signalKey] = bar.close < fib236[i];
          break;

        case 'pricebelow382retracement':
          signalState[signalKey] = bar.close < fib382[i];
          break;

        case 'pricebelow500retracement':
          signalState[signalKey] = bar.close < fib500[i];
          break;

        case 'pricebelow618retracement':
          signalState[signalKey] = bar.close < fib618[i];
          break;

        default:
          break;
      }
    }

    // Set signal based on mode
    if (mode === 'confirmations') {
      // In confirmations mode, all selected signals must be present
      const hasSignals = Object.keys(signalState).length > 0;
      const confirmed = hasSignals && checkConfirmations(signalState, signalGroup.map(s => `${s.namespace}.${s.name}`));
      signals[i] = confirmed;
      if (confirmed) {
        console.log('Confirmation signal at bar', i, {
          time: bar.time,
          activeSignals: Object.keys(signalState).filter(k => signalState[k])
        });
      }
    } else {
      // In signals mode (OR logic), any signal is sufficient
      const hasSignals = Object.values(signalState).some(signal => signal);
      signals[i] = hasSignals; 
      if (hasSignals) {
        console.log('Signal at bar', i, {
          time: bar.time,
          activeSignals: Object.keys(signalState).filter(k => signalState[k])
        });
      }
    }
  }

  return signals;
}