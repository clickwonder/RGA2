import { BarData, BacktestResult, WalkForwardResult, MonteCarloResult } from '../types';
import { runBacktest } from './backtest';

export function runWalkForwardAnalysis(
  data: BarData[],
  combination: any,
  periods: number = 4,
  inSampleRatio: number = 0.7
): WalkForwardResult[] {
  const results: WalkForwardResult[] = [];
  const periodLength = Math.floor(data.length / periods);
  
  for (let i = 0; i < periods - 1; i++) {
    const periodStart = i * periodLength;
    const inSampleEnd = periodStart + Math.floor(periodLength * inSampleRatio);
    const periodEnd = periodStart + periodLength;
    
    const inSampleData = data.slice(periodStart, inSampleEnd);
    const outOfSampleData = data.slice(inSampleEnd, periodEnd);
    
    const inSampleResults = runBacktest(inSampleData, combination);
    const outOfSampleResults = runBacktest(outOfSampleData, combination);
    
    // Calculate robustness ratio (out-of-sample performance / in-sample performance)
    const robustness = outOfSampleResults.netProfit / inSampleResults.netProfit;
    
    results.push({
      period: {
        start: data[periodStart].time,
        end: data[periodEnd - 1].time
      },
      inSampleResults,
      outOfSampleResults,
      robustness
    });
  }
  
  return results;
}

export function runMonteCarloSimulation(
  trades: BacktestResult['trades'],
  simulations: number = 1000
): MonteCarloResult {
  const results = {
    netProfit: [] as number[],
    maxDrawdown: [] as number[],
    winRate: [] as number[]
  };
  
  for (let i = 0; i < simulations; i++) {
    // Shuffle trades randomly
    const shuffledTrades = [...trades]
      .sort(() => Math.random() - 0.5);
    
    let equity = 0;
    let peak = 0;
    let maxDrawdown = 0;
    let wins = 0;
    
    // Calculate metrics for this simulation
    shuffledTrades.forEach(trade => {
      equity += trade.profit;
      peak = Math.max(peak, equity);
      maxDrawdown = Math.max(maxDrawdown, peak - equity);
      if (trade.profit > 0) wins++;
    });
    
    results.netProfit.push(equity);
    results.maxDrawdown.push(maxDrawdown);
    results.winRate.push(wins / trades.length);
  }
  
  // Calculate confidence intervals
  const calculateCI = (values: number[], ci: number) => {
    const sorted = [...values].sort((a, b) => a - b);
    const lower = sorted[Math.floor(sorted.length * ((1 - ci) / 2))];
    const upper = sorted[Math.floor(sorted.length * (1 - (1 - ci) / 2))];
    return { lower, upper };
  };
  
  return {
    confidenceIntervals: {
      netProfit: {
        ci95: calculateCI(results.netProfit, 0.95),
        ci99: calculateCI(results.netProfit, 0.99)
      },
      maxDrawdown: {
        ci95: calculateCI(results.maxDrawdown, 0.95),
        ci99: calculateCI(results.maxDrawdown, 0.99)
      },
      winRate: {
        ci95: calculateCI(results.winRate, 0.95),
        ci99: calculateCI(results.winRate, 0.99)
      }
    },
    simulations: results
  };
}