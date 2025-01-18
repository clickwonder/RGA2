import React from 'react';
import { OptimizationResult } from '../../types';

interface DetailedStatsProps {
  results: OptimizationResult['inSampleResults'];
}

export function DetailedStats({ results }: DetailedStatsProps) {
  if (!results || !results.trades) {
    return <div>No results available</div>;
  }

  // Calculate percentage profitable
  const percentageProfitable = (results.trades.filter(t => t.profit > 0).length / results.trades.length) * 100;
  
  // Calculate Calmar ratio (annualized return / max drawdown)
  const annualizedReturn = results.netProfit * (252 / results.trades.length); // Assuming 252 trading days per year
  const calmarRatio = results.maxDrawdown !== 0 ? annualizedReturn / results.maxDrawdown : 0;

  const stats = [
    { label: 'Total Trades', value: results.totalTrades },
    { label: 'Winning Trades', value: results.winningTrades },
    { label: 'Losing Trades', value: results.losingTrades },
    { label: 'Win Rate', value: `${(results.winRate * 100).toFixed(1)}%` },
    { label: 'Percentage Profitable', value: `${percentageProfitable.toFixed(1)}%` },
    { label: 'Average Win', value: `$${results.averageWin.toFixed(2)}` },
    { label: 'Average Loss', value: `$${results.averageLoss.toFixed(2)}` },
    { label: 'Largest Win', value: `$${Math.max(...results.trades.map(t => t.profit)).toFixed(2)}` },
    { label: 'Largest Loss', value: `$${Math.min(...results.trades.map(t => t.profit)).toFixed(2)}` },
    { label: 'Average Trade', value: `$${(results.netProfit / results.totalTrades).toFixed(2)}` },
    { label: 'Profit Factor', value: results.profitFactor.toFixed(2) },
    { label: 'Calmar Ratio', value: calmarRatio.toFixed(2) },
    { label: 'Max Drawdown', value: `$${results.maxDrawdown.toFixed(2)}` },
    { label: 'Average Duration', value: `${Math.round(results.trades.reduce((acc, t) => 
      acc + (t.exitTime.getTime() - t.entryTime.getTime()) / (1000 * 60), 0) / results.trades.length)} mins` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <div key={index} className="bg-gray-50 p-2 rounded-lg">
          <div className="text-sm text-gray-500">{stat.label}</div>
          <div className="text-lg font-semibold">{stat.value}</div>
        </div>
      ))}
    </div>
  );
}