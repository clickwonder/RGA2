import React from 'react';
import { LineChart, Play, FileDown } from 'lucide-react';
import { BacktestOptions, BacktestResult, BarData, Trade } from '../types';
import { useAppContext } from '../context/AppContext';

// Utility functions for backtesting
function calculateProfit(entry: number, exit: number, direction: number, quantity: number): number {
  return (exit - entry) * direction * quantity;
}

function processBacktest(
  data: BarData[],
  profitTarget: number,
  stopLoss: number,
  trailingStop: number,
  quantity: number
): BacktestResult {
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

  for (let i = 1; i < data.length - 1; i++) {
    const bar = data[i];
    const prevBar = data[i - 1];

    // Simple example signal: Buy if price is rising, Sell if price is falling
    if (!inPosition) {
      if (bar.close > prevBar.close) {
        // Long entry
        direction = 1;
        entryPrice = bar.close;
        entryTime = bar.time;
        inPosition = true;
        highestPrice = bar.close;
      } else if (bar.close < prevBar.close) {
        // Short entry
        direction = -1;
        entryPrice = bar.close;
        entryTime = bar.time;
        inPosition = true;
        lowestPrice = bar.close;
      }
    } else {
      // Position management
      if (direction > 0) {
        highestPrice = Math.max(highestPrice, bar.high);
        const trailingStopPrice = highestPrice - trailingStop;
        
        if (
          bar.low <= entryPrice - stopLoss || // Stop loss hit
          bar.high >= entryPrice + profitTarget || // Profit target hit
          bar.low <= trailingStopPrice // Trailing stop hit
        ) {
          // Exit long position
          const exitPrice = direction > 0 ? 
            Math.min(entryPrice + profitTarget, Math.max(bar.open, entryPrice - stopLoss)) :
            bar.open;
          
          const profit = calculateProfit(entryPrice, exitPrice, direction, quantity);
          netProfit += profit;
          
          if (profit > 0) grossProfit += profit;
          else grossLoss += Math.abs(profit);
          
          peakEquity = Math.max(peakEquity, netProfit);
          maxDrawdown = Math.max(maxDrawdown, peakEquity - netProfit);

          trades.push({
            entryTime,
            exitTime: bar.time,
            entryPrice,
            exitPrice,
            quantity,
            direction,
            profit,
            entryReason: direction > 0 ? 'Price rising' : 'Price falling',
            exitReason: bar.low <= entryPrice - stopLoss ? 'Stop loss' :
                       bar.high >= entryPrice + profitTarget ? 'Take profit' :
                       'Trailing stop'
          });

          inPosition = false;
        }
      } else {
        lowestPrice = Math.min(lowestPrice, bar.low);
        const trailingStopPrice = lowestPrice + trailingStop;
        
        if (
          bar.high >= entryPrice + stopLoss || // Stop loss hit
          bar.low <= entryPrice - profitTarget || // Profit target hit
          bar.high >= trailingStopPrice // Trailing stop hit
        ) {
          // Exit short position
          const exitPrice = direction < 0 ?
            Math.max(entryPrice - profitTarget, Math.min(bar.open, entryPrice + stopLoss)) :
            bar.open;
          
          const profit = calculateProfit(entryPrice, exitPrice, direction, quantity);
          netProfit += profit;
          
          if (profit > 0) grossProfit += profit;
          else grossLoss += Math.abs(profit);
          
          peakEquity = Math.max(peakEquity, netProfit);
          maxDrawdown = Math.max(maxDrawdown, peakEquity - netProfit);

          trades.push({
            entryTime,
            exitTime: bar.time,
            entryPrice,
            exitPrice,
            quantity,
            direction,
            profit,
            entryReason: direction > 0 ? 'Price rising' : 'Price falling',
            exitReason: bar.high >= entryPrice + stopLoss ? 'Stop loss' :
                       bar.low <= entryPrice - profitTarget ? 'Take profit' :
                       'Trailing stop'
          });

          inPosition = false;
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
    winRate: winningTrades / trades.length,
    netProfit,
    profitFactor: grossLoss === 0 ? Infinity : grossProfit / grossLoss,
    maxDrawdown,
    averageWin: winningTrades === 0 ? 0 : grossProfit / winningTrades,
    averageLoss: losingTrades === 0 ? 0 : -grossLoss / losingTrades,
    trades
  };
}

interface BacktestResultsProps {
  results: BacktestResult | null;
}

function BacktestResults({ results }: BacktestResultsProps) {
  if (!results) return null;

  return (
    <div className="mt-6 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Net Profit</div>
          <div className={`text-xl font-semibold ${results.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${results.netProfit.toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Win Rate</div>
          <div className="text-xl font-semibold">
            {(results.winRate * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Profit Factor</div>
          <div className="text-xl font-semibold">
            {results.profitFactor.toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Max Drawdown</div>
          <div className="text-xl font-semibold text-red-600">
            ${results.maxDrawdown.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900">Trade Details</h3>
        </div>
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entry Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exit Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Direction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entry Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exit Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.trades.map((trade, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {trade.entryTime.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {trade.exitTime.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        trade.direction > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {trade.direction > 0 ? 'Long' : 'Short'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {trade.entryPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {trade.exitPrice.toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      trade.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${trade.profit.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BacktestConfig() {
  const {
    backtestResults,
    setBacktestResults,
    selectedSignals,
    entryMode,
    optimizationSettings,
    dataFiles,
    activeFileId,
    setOptimizationProgress,
    setTopStrategies,
    optimizationProgress,
    setActiveTab,
    setOptimizationSettings
  } = useAppContext();
  const [isLoading, setIsLoading] = React.useState(false);
  const [worker, setWorker] = React.useState<Worker | null>(null);

  const handleRunBacktest = async () => {
    if (!activeFileId || optimizationProgress.isRunning) return;
    
    // Update optimization settings with current signals and entry mode
    setOptimizationSettings(prev => ({
      ...prev,
      selectedSignals: {
        entryMode: entryMode,
        entry1: selectedSignals.entry1,
        entry2: selectedSignals.entry2,
        entry3: selectedSignals.entry3
      }
    }));
    
    // Clear previous checkpoint when starting new optimization
    localStorage.removeItem('optimizationCheckpoint');
    
    // Validate optimization settings
    if (!optimizationSettings) {
      alert('Optimization settings not configured');
      return;
    }

    // Reset previous results
    setTopStrategies([]);
    setBacktestResults(null);
    
    const activeFile = dataFiles.find(f => f.id === activeFileId);
    if (!activeFile || !activeFile.data || activeFile.data.length === 0) {
      alert('Please upload valid data before running backtest');
      return;
    }

    setIsLoading(true);
    setOptimizationProgress(prev => ({ ...prev, isRunning: true }));
    setActiveTab('results');
    
    // Reset optimization progress
    setOptimizationProgress({
      generation: 0,
      totalGenerations: optimizationSettings.generations,
      bestFitness: 0,
      isRunning: true
    });

    try {
      const settings = {
        ...optimizationSettings,
        crossoverRate: 0.8,
        elitismRate: 0.1,
        fitnessWeights: {
          profitFactor: 2.0,
          winRate: 1.0,
          maxDrawdown: 1.0,
          netProfit: 1.0,
          tradeCount: 0.5,
        },
        constraints: {
          minimumTrades: 10,
          minimumWinRate: 0.40,
          maximumDrawdown: 25.0,
        },
        inSamplePercentage: 0.7,
        earlyStoppingGenerations: 2,
        exits: optimizationSettings.exits
      };

      // Create and start the Web Worker
      const newWorker = new Worker(
        new URL('../workers/genetic.worker.ts', import.meta.url),
        { type: 'module' }
      );

      setWorker(newWorker);

      newWorker.onmessage = (e) => {
        if (e.data.type === 'progress') {
          // Store all valid strategies during optimization
          setOptimizationProgress(prev => ({
            ...prev,
            totalGenerations: optimizationSettings.generations,
            generation: e.data.generation,
            isInitializing: e.data.isInitializing || false,
            bestFitness: e.data.bestFitness
          }));

          const isInitializing = e.data.isInitializing || false;
          if (e.data.validStrategies) {
            setTopStrategies(prev => {
              const newStrategies = [...prev, ...e.data.validStrategies]
                .sort((a, b) => b.fitness - a.fitness)
                .slice(0, 10);
              return newStrategies;
            });
          }
        } else if (e.data.type === 'complete') {
          const results = e.data.result;
          setBacktestResults(results.inSampleResults);
          setIsLoading(false);
          setOptimizationProgress(prev => ({ 
            ...prev, 
            isRunning: false, 
            generation: optimizationSettings.generations 
          }));
          newWorker.terminate();
          setWorker(null);
        } else if (e.data.type === 'error') {
          console.error('Backtest error:', e.data.error);
          alert('Error during backtest: ' + e.data.error);
          setIsLoading(false);
          setOptimizationProgress(prev => ({ ...prev, isRunning: false }));
          newWorker.terminate();
          setWorker(null);
        } else if (e.data.type === 'stopped') {
          setIsLoading(false);
          setOptimizationProgress(prev => ({ ...prev, isRunning: false }));
          newWorker.terminate();
          setWorker(null);
          alert('Optimization stopped');
        }
      };

      newWorker.postMessage({ data: activeFile.data, settings });
    } catch (error) {
      console.error('Backtest failed:', error);
      alert('Failed to start backtest. Please check your data and settings.');
      setIsLoading(false);
      setOptimizationProgress(prev => ({ ...prev, isRunning: false }));
    }
  };

  const handleStopOptimization = () => {
    if (optimizationProgress.isRunning) {
      if (worker) {
        worker.postMessage({ type: 'stop' });
        worker.terminate();
        setWorker(null);
      }
      setOptimizationProgress(prev => ({ ...prev, isRunning: false }));
      setIsLoading(false);
    }
  };

  // Cleanup worker on unmount
  React.useEffect(() => {
    return () => {
      if (worker) {
        worker.terminate();
      }
    };
  }, [worker]);
  const handleExportResults = () => {
    if (!backtestResults) return;

    const csv = [
      ['Entry Time', 'Exit Time', 'Direction', 'Entry Price', 'Exit Price', 'Profit'].join(','),
      ...backtestResults.trades.map(trade => [
        trade.entryTime.toLocaleString(),
        trade.exitTime.toLocaleString(),
        trade.direction > 0 ? 'Long' : 'Short',
        trade.entryPrice.toFixed(2),
        trade.exitPrice.toFixed(2),
        trade.profit.toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'backtest_results.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <LineChart className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Backtest Settings
          </h3>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRunBacktest}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white 
              ${isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            <Play className="w-4 h-4" />
            {isLoading ? 'Running...' : 'Run Backtest'}
          </button>
          
          {backtestResults && (
            <button
              onClick={handleExportResults}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 
                bg-white hover:bg-gray-50"
            >
              <FileDown className="w-4 h-4" />
              Export Results
            </button>
          )}
        </div>

        <BacktestResults results={backtestResults} />
      </div>
    </div>
  );
}