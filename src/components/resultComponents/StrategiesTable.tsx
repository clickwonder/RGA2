import React, { useState } from 'react';
import { ArrowUpDown, Download } from 'lucide-react';
import { OptimizationResult } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { generateNinjaScriptStrategy } from '../../utils/ninjaTraderExporter';
import { getSignalsForCategory } from '../../utils/signalUtils';

const calculateDirectionalStats = (trades: any[]) => {
  if (!trades || !Array.isArray(trades)) {
    return {
      long: {
        netProfit: 0,
        winRate: 0,
        totalTrades: 0
      },
      short: {
        netProfit: 0,
        winRate: 0,
        totalTrades: 0
      }
    };
  }

  // Filter valid trades and separate by direction
  const validTrades = trades.filter(t => t && typeof t.direction === 'number' && typeof t.profit === 'number');
  const longTrades = validTrades.filter(t => t.direction === 1);
  const shortTrades = validTrades.filter(t => t.direction === -1);
  
  const calculateStats = (dirTrades: typeof validTrades) => {
    const netProfit = dirTrades.reduce((sum, t) => sum + t.profit, 0);
    const winningTrades = dirTrades.filter(t => t.profit > 0).length;
    const winRate = dirTrades.length > 0 ? winningTrades / dirTrades.length : 0;
    
    return {
      netProfit,
      winRate,
      totalTrades: dirTrades.length
    };
  };
  
  return {
    long: calculateStats(longTrades),
    short: calculateStats(shortTrades)
  };
};

interface StrategiesTableProps {
  strategies: OptimizationResult[];
}

export function StrategiesTable({ strategies }: StrategiesTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'netProfit', direction: 'desc' });
  const { setSelectedStrategy } = useAppContext();

  const sortedStrategies = React.useMemo(() => {
    if (!strategies || !strategies.length || !strategies[0].inSampleResults) return [];
    
    const sorted = [...strategies];
    sorted.sort((a, b) => {
      if (!a.inSampleResults || !b.inSampleResults) return 0;
      
      let aValue = 0;
      let bValue = 0;

      switch (sortConfig.key) {
        case 'netProfit':
          aValue = a.inSampleResults.netProfit;
          bValue = b.inSampleResults.netProfit;
          break;
        case 'profitFactor':
          aValue = a.inSampleResults.profitFactor;
          bValue = b.inSampleResults.profitFactor;
          break;
        case 'winRate':
          aValue = a.inSampleResults.winRate;
          bValue = b.inSampleResults.winRate;
          break;
        case 'longProfit':
          aValue = calculateDirectionalStats(a.inSampleResults.trades).long.netProfit;
          bValue = calculateDirectionalStats(b.inSampleResults.trades).long.netProfit;
          break;
        case 'shortProfit':
          aValue = calculateDirectionalStats(a.inSampleResults.trades).short.netProfit;
          bValue = calculateDirectionalStats(b.inSampleResults.trades).short.netProfit;
          break;
        case 'maxDrawdown':
          aValue = a.inSampleResults.maxDrawdown;
          bValue = b.inSampleResults.maxDrawdown;
          break;
        case 'totalTrades':
          aValue = a.inSampleResults.totalTrades;
          bValue = b.inSampleResults.totalTrades;
          break;
      }

      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });
    return sorted;
  }, [strategies, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const SortHeader = ({ label, sortKey }: { label: string; sortKey: string }) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="w-4 h-4" />
      </div>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              #
            </th>
            <SortHeader label="Net Profit" sortKey="netProfit" />
            <SortHeader label="Profit Factor" sortKey="profitFactor" />
            <SortHeader label="Long P/L" sortKey="longProfit" />
            <SortHeader label="Short P/L" sortKey="shortProfit" />
            <SortHeader label="Win Rate" sortKey="winRate" />
            <SortHeader label="Max Drawdown" sortKey="maxDrawdown" />
            <SortHeader label="Total Trades" sortKey="totalTrades" />
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
              Strategy Configuration
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
              Entry Groups & Signals
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedStrategies.filter(s => s && s.inSampleResults && s.inSampleResults.trades).map((strategy, index) => {
            const dirStats = calculateDirectionalStats(strategy.inSampleResults?.trades || []);
            return (
              <tr 
                key={index} 
                className="hover:bg-gray-50 cursor-pointer" 
                onClick={() => setSelectedStrategy(index)}
              >
                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                  #{index + 1}
                </td>
                <td className={`px-6 py-2 whitespace-nowrap text-sm font-medium ${
                  strategy.inSampleResults.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${strategy.inSampleResults.netProfit.toFixed(2)}
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                  {strategy.inSampleResults.profitFactor.toFixed(2)}
                </td>
                <td className="px-6 py-2 whitespace-nowrap">
                  <div className={`text-sm font-medium ${
                    dirStats.long.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${dirStats.long.netProfit.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {dirStats.long.totalTrades} trades ({(dirStats.long.winRate * 100).toFixed(1)}% win)
                  </div>
                </td>
                <td className="px-6 py-2 whitespace-nowrap">
                  <div className={`text-sm font-medium ${
                    dirStats.short.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${dirStats.short.netProfit.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {dirStats.short.totalTrades} trades ({(dirStats.short.winRate * 100).toFixed(1)}% win)
                  </div>
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                  <div>{(strategy.inSampleResults.winRate * 100).toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">Combined</div>
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-red-600">
                  ${strategy.inSampleResults.maxDrawdown.toFixed(2)}
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                  {strategy.inSampleResults.totalTrades}
                </td>
                <td className="px-6 py-2 text-sm">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-700">Mode:</span>{' '}
                        <span className="text-indigo-600">{strategy.combination.mode}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Generate NinjaTrader strategy code
                          const strategyName = `GeneticStrategy_${index + 1}`;
                          const ninjaScript = generateNinjaScriptStrategy(
                            strategy.combination,
                            strategyName,
                            'Both' // Allow both long and short trades by default
                          );
                          
                          // Create and download the .cs file
                          const blob = new Blob([ninjaScript], { type: 'text/plain' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${strategyName}.cs`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(url);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 hover:text-indigo-700 border border-indigo-300 rounded hover:bg-indigo-50"
                      >
                        <Download className="w-3 h-3" />
                        Export Strategy
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      <div>
                        <span className="font-medium">Profit Target:</span> {strategy.combination.profitTarget} ticks
                      </div>
                      <div>
                        <span className="font-medium">Stop Loss:</span> {strategy.combination.stopLoss} ticks
                      </div>
                      <div>
                        <span className="font-medium">Trailing Stop:</span> {strategy.combination.trailingStop} ticks
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-2 text-sm">
                  <div className="space-y-3">
                    {strategy.combination.entries.entry1.length > 0 && (
                      <div className="bg-gray-50 p-2 rounded-lg shadow-sm">
                        <div className="font-medium text-indigo-600 mb-1">
                          Entry Group 1
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {strategy.combination.entries.entry1.map((signal, i) => (
                            <span 
                              key={i} 
                              className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded px-1.5 py-0.5 text-xs whitespace-nowrap"
                              title={`${signal.namespace}.${signal.name}`}
                            >
                              <span className="text-indigo-600">{signal.namespace}</span>
                              <span className="text-gray-400">.</span>
                              <span className="text-gray-700">{signal.name}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {strategy.combination.entries.entry2.length > 0 && (
                      <div className="bg-gray-50 p-2 rounded-lg shadow-sm">
                        <div className="font-medium text-green-600 mb-1">
                          Entry Group 2
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {strategy.combination.entries.entry2.map((signal, i) => (
                            <span 
                              key={i} 
                              className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded px-1.5 py-0.5 text-xs whitespace-nowrap"
                              title={`${signal.namespace}.${signal.name}`}
                            >
                              <span className="text-green-600">{signal.namespace}</span>
                              <span className="text-gray-400">.</span>
                              <span className="text-gray-700">{signal.name}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {strategy.combination.entries.entry3.length > 0 && (
                      <div className="bg-gray-50 p-2 rounded-lg shadow-sm">
                        <div className="font-medium text-orange-600 mb-1">
                          Entry Group 3
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {strategy.combination.entries.entry3.map((signal, i) => (
                            <span 
                              key={i} 
                              className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded px-1.5 py-0.5 text-xs whitespace-nowrap"
                              title={`${signal.namespace}.${signal.name}`}
                            >
                              <span className="text-orange-600">{signal.namespace}</span>
                              <span className="text-gray-400">.</span>
                              <span className="text-gray-700">{signal.name}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}