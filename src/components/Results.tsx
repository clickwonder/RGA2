import React, { useState } from 'react';
import { TrendingUp, ChevronDown, LineChart, Settings, Waves, Activity } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import {
  MetricCard,
  EquityCurve,
  DetailedStats,
  OptimizationProgress,
  StrategiesTable,
  ValidationResults
} from './results';
import { runWalkForwardAnalysis, runMonteCarloSimulation } from '../utils/validation';

export default function Results() {
  const [activeSection, setActiveSection] = useState<'performance' | 'signals' | 'settings'>('performance');
  const { 
    optimizationProgress, 
    setOptimizationProgress, 
    topStrategies,
    selectedStrategy,
    dataFiles, 
    activeFileId 
  } = useAppContext();

  const optimizationResult = topStrategies[selectedStrategy];
  const activeFile = dataFiles.find(f => f.id === activeFileId);

  // Run validation when a strategy is selected
  const validationResults = React.useMemo(() => {
    if (!optimizationResult || !activeFile?.data) return null;

    const walkForward = runWalkForwardAnalysis(activeFile.data, optimizationResult.combination);
    const monteCarlo = runMonteCarloSimulation([
      ...optimizationResult.inSampleResults.trades,
      ...optimizationResult.outOfSampleResults.trades
    ]);

    return { walkForward, monteCarlo };
  }, [optimizationResult, activeFile?.data]);

  return (
    <div className="space-y-6">
      {/* Combined Performance Summary */}
      {optimizationResult?.inSampleResults && optimizationResult?.outOfSampleResults && (
        <div className="bg-white overflow-hidden shadow rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Overall Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">In-Sample</h4>
              <div className="grid grid-cols-2 gap-2">
                <MetricCard
                  title="Net Profit"
                  value={`$${optimizationResult.inSampleResults.netProfit.toFixed(2)}`}
                  isPositive={optimizationResult.inSampleResults.netProfit > 0}
                />
                <MetricCard
                  title="Win Rate"
                  value={`${(optimizationResult.inSampleResults.winRate * 100).toFixed(1)}%`}
                  isPositive={optimizationResult.inSampleResults.winRate > 0.5}
                />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Out-of-Sample</h4>
              <div className="grid grid-cols-2 gap-2">
                <MetricCard
                  title="Net Profit"
                  value={`$${optimizationResult.outOfSampleResults.netProfit.toFixed(2)}`}
                  isPositive={optimizationResult.outOfSampleResults.netProfit > 0}
                />
                <MetricCard
                  title="Win Rate"
                  value={`${(optimizationResult.outOfSampleResults.winRate * 100).toFixed(1)}%`}
                  isPositive={optimizationResult.outOfSampleResults.winRate > 0.5}
                />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Combined</h4>
              <div className="grid grid-cols-2 gap-2">
                <MetricCard
                  title="Net Profit"
                  value={`$${(
                    optimizationResult.inSampleResults.netProfit + 
                    optimizationResult.outOfSampleResults.netProfit
                  ).toFixed(2)}`}
                  isPositive={
                    optimizationResult.inSampleResults.netProfit + 
                    optimizationResult.outOfSampleResults.netProfit > 0
                  }
                />
                <MetricCard
                  title="Win Rate"
                  value={`${(
                    ((optimizationResult.inSampleResults.winningTrades + 
                      optimizationResult.outOfSampleResults.winningTrades) /
                     (optimizationResult.inSampleResults.totalTrades + 
                      optimizationResult.outOfSampleResults.totalTrades) * 100
                    ).toFixed(1)
                  )}%`}
                  isPositive={
                    (optimizationResult.inSampleResults.winningTrades + 
                     optimizationResult.outOfSampleResults.winningTrades) /
                    (optimizationResult.inSampleResults.totalTrades + 
                     optimizationResult.outOfSampleResults.totalTrades) > 0.5
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Optimization Progress */}
      <div className="bg-white overflow-hidden shadow rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-medium text-gray-900">Optimization Progress</h3>
        </div>
        <OptimizationProgress
          generation={optimizationProgress.generation}
          totalGenerations={optimizationProgress.totalGenerations}
          bestFitness={optimizationProgress.bestFitness}
          isInitializing={optimizationProgress.isInitializing}
          onStop={() => {
            setOptimizationProgress(prev => ({ ...prev, isRunning: false }));
          }}
        />
      </div>

      {/* Top Strategies */}
      {topStrategies.length > 0 ? (
        <div className="bg-white overflow-hidden shadow rounded-lg p-4">
          {optimizationProgress.isRunning && (
            <div className="mb-4 text-sm text-gray-500">
              Optimization in progress... Found {topStrategies.length} strategies so far
            </div>
          )}
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Strategies</h3>
          <StrategiesTable strategies={topStrategies} />
        </div>
      ) : (
        <div className="bg-white overflow-hidden shadow rounded-lg p-4">
          <div className="text-center text-gray-500 py-8">
            No optimization results available yet. Run a backtest to see results.
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {optimizationResult?.inSampleResults && optimizationResult?.outOfSampleResults && (
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <button
            onClick={() => setActiveSection(activeSection === 'performance' ? '' : 'performance')}
            className="w-full px-4 py-3 flex items-center justify-between text-left border-b"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
            </div>
            <ChevronDown className={`w-5 h-5 transform transition-transform ${
              activeSection === 'performance' ? 'rotate-180' : ''
            }`} />
          </button>
        
          {activeSection === 'performance' && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-6">
                  <div className="mb-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Equity Curve</h4>
                    <EquityCurve 
                      inSampleTrades={optimizationResult.inSampleResults.trades}
                      outOfSampleTrades={optimizationResult.outOfSampleResults.trades}
                    />
                  </div>
                
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">In-Sample Performance</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <MetricCard
                        title="Net Profit"
                        value={`$${optimizationResult.inSampleResults.netProfit.toFixed(2)}`}
                        isPositive={optimizationResult.inSampleResults.netProfit > 0}
                      />
                      <MetricCard
                        title="Win Rate"
                        value={`${(optimizationResult.inSampleResults.winRate * 100).toFixed(1)}%`}
                        isPositive={optimizationResult.inSampleResults.winRate > 0.5}
                      />
                      <MetricCard
                        title="Profit Factor"
                        value={optimizationResult.inSampleResults.profitFactor.toFixed(2)}
                        isPositive={optimizationResult.inSampleResults.profitFactor > 1}
                      />
                      <MetricCard
                        title="Max Drawdown"
                        value={`$${optimizationResult.inSampleResults.maxDrawdown.toFixed(2)}`}
                        isPositive={false}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Out-of-Sample Performance</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <MetricCard
                        title="Net Profit"
                        value={`$${optimizationResult.outOfSampleResults.netProfit.toFixed(2)}`}
                        isPositive={optimizationResult.outOfSampleResults.netProfit > 0}
                      />
                      <MetricCard
                        title="Win Rate"
                        value={`${(optimizationResult.outOfSampleResults.winRate * 100).toFixed(1)}%`}
                        isPositive={optimizationResult.outOfSampleResults.winRate > 0.5}
                      />
                      <MetricCard
                        title="Profit Factor"
                        value={optimizationResult.outOfSampleResults.profitFactor.toFixed(2)}
                        isPositive={optimizationResult.outOfSampleResults.profitFactor > 1}
                      />
                      <MetricCard
                        title="Max Drawdown"
                        value={`$${optimizationResult.outOfSampleResults.maxDrawdown.toFixed(2)}`}
                        isPositive={false}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Detailed Statistics</h4>
                    <DetailedStats results={optimizationResult.inSampleResults} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Validation Results */}
      {validationResults && (
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <button
            onClick={() => setActiveSection(activeSection === 'validation' ? '' : 'validation')}
            className="w-full px-4 py-3 flex items-center justify-between text-left border-b"
          >
            <div className="flex items-center gap-2">
              <LineChart className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-medium text-gray-900">Validation Results</h3>
            </div>
            <ChevronDown className={`w-5 h-5 transform transition-transform ${
              activeSection === 'validation' ? 'rotate-180' : ''
            }`} />
          </button>
        
          {activeSection === 'validation' && (
            <div className="p-4">
              <ValidationResults 
                walkForward={validationResults.walkForward}
                monteCarlo={validationResults.monteCarlo}
              />
            </div>
          )}
        </div>
      )}

      {/* Strategy Settings */}
      {optimizationResult && optimizationResult.combination && (
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <button
            onClick={() => setActiveSection(activeSection === 'settings' ? '' : 'settings')}
            className="w-full px-4 py-3 flex items-center justify-between text-left border-b"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-medium text-gray-900">Strategy Settings</h3>
            </div>
            <ChevronDown className={`w-5 h-5 transform transition-transform ${
              activeSection === 'settings' ? 'rotate-180' : ''
            }`} />
          </button>
        
          {activeSection === 'settings' && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  title="Profit Target"
                  value={`${optimizationResult.combination.profitTarget} ticks`}
                />
                <MetricCard
                  title="Stop Loss"
                  value={`${optimizationResult.combination.stopLoss} ticks`}
                />
                <MetricCard
                  title="Trailing Stop"
                  value={`${optimizationResult.combination.trailingStop} ticks`}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}