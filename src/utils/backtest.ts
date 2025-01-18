import { BarData, BacktestResult, Trade, SignalCombination } from '../types';
import { generateSignals } from './signals';

function calculateProfit(entry: number, exit: number, direction: number, quantity: number): number {
  return (exit - entry) * direction * quantity;
}

function evaluateSignalGroup(
  signals: boolean[],
  bar: BarData,
  prevBar: BarData
): { fired: boolean; direction: number } {
  if (!signals || signals.length === 0) {
    return { fired: false, direction: 0 };
  }

  const fired = signals.some(signal => signal);
  const direction = bar.close > prevBar.close ? 1 : -1;

  return { fired, direction };
}

export function runBacktest(
  data: BarData[],
  combination: SignalCombination
): BacktestResult {
  if (!data || data.length === 0) {
    throw new Error('No data provided for backtest');
  }

  const trades: Trade[] = [];
  let inPosition = false;
  let entryPrice = 0;
  let entryTime = new Date();
  let direction = 0;
  let highestPrice = 0;
  let lowestPrice = Infinity;
  let netProfit = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let maxDrawdown = 0;
  let peakEquity = 0;

  // Generate signals for each entry group
  const entry1Signals = generateSignals(data, combination.entries.entry1);
  const entry2Signals = generateSignals(data, combination.entries.entry2);
  const entry3Signals = generateSignals(data, combination.entries.entry3);

  // Debug signal generation
  console.log('Signal generation summary:', {
    entry1: entry1Signals.filter(Boolean).length,
    entry2: entry2Signals.filter(Boolean).length,
    entry3: entry3Signals.filter(Boolean).length,
    totalBars: data.length
  });

  for (let i = 1; i < data.length - 1; i++) {
    const bar = data[i];
    const prevBar = data[i - 1];

    if (!inPosition) {
      // Entry logic based on mode
      let shouldEnterLong = false;
      let shouldEnterShort = false;

      switch (combination.mode) {
        case 'Signals': {
          // OR logic - any signal can trigger
          const group1 = evaluateSignalGroup(entry1Signals, bar, prevBar);
          const group2 = evaluateSignalGroup(entry2Signals, bar, prevBar);
          const group3 = evaluateSignalGroup(entry3Signals, bar, prevBar);

          const anySignalFired = group1.fired || group2.fired || group3.fired;
          if (anySignalFired) {
            // Determine direction based on price action
            const trend = bar.close > prevBar.close;
            shouldEnterLong = trend;
            shouldEnterShort = !trend;
          }
          break;
        }

        case 'Confirmations': {
          // AND logic - all active groups must confirm
          const group1 = evaluateSignalGroup(entry1Signals, bar, prevBar);
          const group2 = evaluateSignalGroup(entry2Signals, bar, prevBar);
          const group3 = evaluateSignalGroup(entry3Signals, bar, prevBar);

          const activeGroups = [
            combination.entries.entry1.length > 0 ? group1 : null,
            combination.entries.entry2.length > 0 ? group2 : null,
            combination.entries.entry3.length > 0 ? group3 : null
          ].filter(g => g !== null);

          const allConfirm = activeGroups.length > 0 && 
            activeGroups.every(g => g?.fired);

          if (allConfirm) {
            // Use majority direction
            const directionSum = activeGroups.reduce((sum, g) => sum + g!.direction, 0);
            shouldEnterLong = directionSum > 0;
            shouldEnterShort = directionSum < 0;
          }
          break;
        }

        case 'Split': {
          // Entry1 for longs, Entry2 for shorts
          const group1 = evaluateSignalGroup(entry1Signals, bar, prevBar);
          const group2 = evaluateSignalGroup(entry2Signals, bar, prevBar);

          shouldEnterLong = group1.fired && bar.close > prevBar.close;
          shouldEnterShort = group2.fired && bar.close < prevBar.close;
          break;
        }
      }

      // Enter position if signals align
      if (shouldEnterLong) {
        direction = 1;
        entryPrice = bar.close;
        entryTime = bar.time;
        inPosition = true;
        highestPrice = bar.close;
        console.log('Long entry at bar', i, {
          time: bar.time,
          price: entryPrice,
          mode: combination.mode
        });
      } else if (shouldEnterShort) {
        direction = -1;
        entryPrice = bar.close;
        entryTime = bar.time;
        inPosition = true;
        lowestPrice = bar.close;
        console.log('Short entry at bar', i, {
          time: bar.time,
          price: entryPrice,
          mode: combination.mode
        });
      }
    } else {
      // Position management
      if (direction > 0) {
        highestPrice = Math.max(highestPrice, bar.high);
        const trailingStopPrice = highestPrice - combination.trailingStop;
        
        if (
          bar.low <= entryPrice - combination.stopLoss ||
          bar.high >= entryPrice + combination.profitTarget ||
          (combination.trailingStop > 0 && bar.low <= trailingStopPrice)
        ) {
          // Exit long position
          const exitPrice = direction > 0 ? 
            Math.min(entryPrice + combination.profitTarget, Math.max(bar.close, entryPrice - combination.stopLoss)) :
            bar.close;
          
          const profit = calculateProfit(entryPrice, exitPrice, direction, 1);
          netProfit = Math.round((netProfit + profit) * 100) / 100;
          
          if (profit > 0) grossProfit += profit;
          else grossLoss += Math.abs(profit);
          
          peakEquity = Math.max(peakEquity, netProfit);
          maxDrawdown = Math.max(maxDrawdown, peakEquity - netProfit);

          trades.push({
            entryTime,
            exitTime: bar.time,
            entryPrice,
            exitPrice,
            quantity: 1,
            direction,
            profit,
            entryReason: 'Signal',
            exitReason: bar.low <= entryPrice - combination.stopLoss ? 'Stop loss' :
                       bar.high >= entryPrice + combination.profitTarget ? 'Take profit' :
                       'Trailing stop'
          });

          inPosition = false;
          console.log('Long exit at bar', i, {
            time: bar.time,
            price: exitPrice,
            profit,
            reason: trades[trades.length - 1].exitReason
          });
        }
      } else {
        lowestPrice = Math.min(lowestPrice, bar.low);
        const trailingStopPrice = lowestPrice + combination.trailingStop;
        
        if (
          bar.high >= entryPrice + combination.stopLoss ||
          bar.low <= entryPrice - combination.profitTarget ||
          (combination.trailingStop > 0 && bar.high >= trailingStopPrice)
        ) {
          // Exit short position
          const exitPrice = direction < 0 ?
            Math.max(entryPrice - combination.profitTarget, Math.min(bar.close, entryPrice + combination.stopLoss)) :
            bar.close;
          
          const profit = calculateProfit(entryPrice, exitPrice, direction, 1);
          netProfit = Math.round((netProfit + profit) * 100) / 100;
          
          if (profit > 0) grossProfit += profit;
          else grossLoss += Math.abs(profit);
          
          peakEquity = Math.max(peakEquity, netProfit);
          maxDrawdown = Math.max(maxDrawdown, peakEquity - netProfit);

          trades.push({
            entryTime,
            exitTime: bar.time,
            entryPrice,
            exitPrice,
            quantity: 1,
            direction,
            profit,
            entryReason: 'Signal',
            exitReason: bar.high >= entryPrice + combination.stopLoss ? 'Stop loss' :
                       bar.low <= entryPrice - combination.profitTarget ? 'Take profit' :
                       'Trailing stop'
          });

          inPosition = false;
          console.log('Short exit at bar', i, {
            time: bar.time,
            price: exitPrice,
            profit,
            reason: trades[trades.length - 1].exitReason
          });
        }
      }
    }
  }

  const winningTrades = trades.filter(t => t.profit > 0).length;
  const losingTrades = trades.filter(t => t.profit <= 0).length;

  return {
    totalTrades: trades.length,
    winningTrades,
    losingTrades,
    winRate: trades.length > 0 ? winningTrades / trades.length : 0,
    netProfit,
    profitFactor: grossLoss === 0 ? Infinity : grossProfit / grossLoss,
    maxDrawdown,
    averageWin: winningTrades === 0 ? 0 : grossProfit / winningTrades,
    averageLoss: losingTrades === 0 ? 0 : -grossLoss / losingTrades,
    trades
  };
}