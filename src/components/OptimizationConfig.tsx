import React from 'react';
import { Settings, Calendar } from 'lucide-react';
import { GeneticSettings } from '../types';
import { useAppContext } from '../context/AppContext';

const formatDate = (date: Date | null): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().split('T')[0];
};

export default function OptimizationConfig() {
  const { 
    dateRange, 
    optimizationSettings, 
    setOptimizationSettings, 
    backtestSettings, 
    setBacktestSettings,
    selectedSignals 
  } = useAppContext();

  const handleOptimizationSettingChange = (key: string, value: any) => {
    // Ensure numeric values are valid
    if (typeof value === 'number' && isNaN(value)) {
      return;
    }

    setOptimizationSettings(prev => ({
      ...prev,
      [key]: value,
      // Update selected signals when useSelectedSignals changes
      selectedSignals: key === 'useSelectedSignals' ? {
        entry1: value ? selectedSignals.entry1 : [],
        entry2: value ? selectedSignals.entry2 : [],
        entry3: value ? selectedSignals.entry3 : []
      } : prev.selectedSignals
    }));
  };

  const handleBacktestSettingChange = (key: string, value: number) => {
    // Ensure numeric values are valid
    if (isNaN(value)) {
      return;
    }

    setBacktestSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleExitStrategyChange = (strategy: string, key: string, value: boolean) => {
    setOptimizationSettings(prev => ({
      ...prev,
      exits: {
        ...prev.exits,
        [strategy]: {
          ...prev.exits[strategy],
          [key]: value
        }
      }
    }));
  };

  const handleExitStrategyParamChange = (strategy: string, param: string, value: number) => {
    // Ensure numeric values are valid
    if (isNaN(value)) {
      return;
    }

    setOptimizationSettings(prev => ({
      ...prev,
      exits: {
        ...prev.exits,
        [strategy]: {
          ...prev.exits[strategy],
          params: {
            ...prev.exits[strategy].params,
            [param]: value
          }
        }
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Signal Selection Mode */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Signal Selection</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={!optimizationSettings.useSelectedSignals}
              onChange={() => setOptimizationSettings(prev => ({
                ...prev,
                useSelectedSignals: false
              }))}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm">Random Signals</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={optimizationSettings.useSelectedSignals}
              onChange={() => setOptimizationSettings(prev => ({
                ...prev,
                useSelectedSignals: true
              }))}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm">Use Selected Signals</span>
          </label>
        </div>
          {optimizationSettings.useSelectedSignals && (
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!optimizationSettings.randomizeEntryMode}
                  onChange={() => setOptimizationSettings(prev => ({
                    ...prev,
                    randomizeEntryMode: false
                  }))}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm">Use Selected Entry Mode</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={optimizationSettings.randomizeEntryMode}
                  onChange={() => setOptimizationSettings(prev => ({
                    ...prev,
                    randomizeEntryMode: true
                  }))}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm">Randomize Entry Mode</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Date Range Selection */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Date Ranges
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">In-Sample Period</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500">Start Date</label>
                <input
                  type="date"
                  value={formatDate(dateRange.inSample.start)}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">End Date</label>
                <input
                  type="date"
                  value={formatDate(dateRange.inSample.end)}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Out-of-Sample Period</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500">Start Date</label>
                <input
                  type="date"
                  value={formatDate(dateRange.outSample.start)}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">End Date</label>
                <input
                  type="date"
                  value={formatDate(dateRange.outSample.end)}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Settings */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          Exit Strategy Settings
        </h3>
        <div className="space-y-6">
          {/* Fixed Target Exit */}
          <div className="border-b pb-4">
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={optimizationSettings.exits.fixedTarget.enabled}
                  onChange={(e) => handleExitStrategyChange('fixedTarget', 'enabled', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium">Fixed Target Exit</span>
              </label>
            </div>
            {optimizationSettings.exits.fixedTarget.enabled && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-500">Min Ticks</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={optimizationSettings.exits.fixedTarget.params.profitTargetMin}
                    onChange={(e) => handleExitStrategyParamChange('fixedTarget', 'profitTargetMin', parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500">Max Ticks</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={optimizationSettings.exits.fixedTarget.params.profitTargetMax}
                    onChange={(e) => handleExitStrategyParamChange('fixedTarget', 'profitTargetMax', parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500">Step Size</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={optimizationSettings.exits.fixedTarget.params.profitTargetStep}
                    onChange={(e) => handleExitStrategyParamChange('fixedTarget', 'profitTargetStep', parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Stop Loss */}
          <div className="border-b pb-4">
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={optimizationSettings.exits.stopLoss.enabled}
                  onChange={(e) => handleExitStrategyChange('stopLoss', 'enabled', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium">Stop Loss</span>
              </label>
            </div>
            {optimizationSettings.exits.stopLoss.enabled && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-500">Min Ticks</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={optimizationSettings.exits.stopLoss.params.stopLossMin}
                    onChange={(e) => handleExitStrategyParamChange('stopLoss', 'stopLossMin', parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500">Max Ticks</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={optimizationSettings.exits.stopLoss.params.stopLossMax}
                    onChange={(e) => handleExitStrategyParamChange('stopLoss', 'stopLossMax', parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500">Step Size</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={optimizationSettings.exits.stopLoss.params.stopLossStep}
                    onChange={(e) => handleExitStrategyParamChange('stopLoss', 'stopLossStep', parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Trailing Stop */}
          <div className="border-b pb-4">
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={optimizationSettings.exits.trailingStop.enabled}
                  onChange={(e) => handleExitStrategyChange('trailingStop', 'enabled', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium">Trailing Stop</span>
              </label>
            </div>
            {optimizationSettings.exits.trailingStop.enabled && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-500">Min Ticks</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={optimizationSettings.exits.trailingStop.params.trailingMin}
                    onChange={(e) => handleExitStrategyParamChange('trailingStop', 'trailingMin', parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500">Max Ticks</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={optimizationSettings.exits.trailingStop.params.trailingMax}
                    onChange={(e) => handleExitStrategyParamChange('trailingStop', 'trailingMax', parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500">Step Size</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={optimizationSettings.exits.trailingStop.params.trailingStep}
                    onChange={(e) => handleExitStrategyParamChange('trailingStop', 'trailingStep', parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Breakeven Stop */}
          <div className="border-b pb-4">
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={optimizationSettings.exits.breakeven.enabled}
                  onChange={(e) => handleExitStrategyChange('breakeven', 'enabled', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium">Breakeven Stop</span>
              </label>
            </div>
            {optimizationSettings.exits.breakeven.enabled && (
              <div>
                <label className="block text-sm text-gray-500">Trigger Ticks</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={optimizationSettings.exits.breakeven.params.breakevenTicks}
                  onChange={(e) => handleExitStrategyParamChange('breakeven', 'breakevenTicks', parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            )}
          </div>

          {/* Time-based Exit */}
          <div className="border-b pb-4">
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={optimizationSettings.exits.timeStop.enabled}
                  onChange={(e) => handleExitStrategyChange('timeStop', 'enabled', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium">Time-based Exit</span>
              </label>
            </div>
            {optimizationSettings.exits.timeStop.enabled && (
              <div>
                <label className="block text-sm text-gray-500">Max Minutes in Trade</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={optimizationSettings.exits.timeStop.params.timeLimit}
                  onChange={(e) => handleExitStrategyParamChange('timeStop', 'timeLimit', parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Optimization Parameters */}
      <div className="bg-white p-4 rounded-lg shadow mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Optimization Parameters
        </h3>
        <div className="grid grid-cols-1 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Population Size
            </label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={optimizationSettings.populationSize}
              onChange={(e) => handleOptimizationSettingChange('populationSize', parseInt(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Generations
            </label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={optimizationSettings.generations}
              onChange={(e) => handleOptimizationSettingChange('generations', parseInt(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mutation Rate
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={optimizationSettings.mutationRate}
              onChange={(e) => handleOptimizationSettingChange('mutationRate', parseFloat(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              In-Sample Percentage
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={optimizationSettings.inSamplePercentage}
              onChange={(e) => handleOptimizationSettingChange('inSamplePercentage', parseFloat(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Minimum Win Rate
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={optimizationSettings.minimumWinRate}
              onChange={(e) => handleOptimizationSettingChange('minimumWinRate', parseFloat(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Maximum Drawdown %
            </label>
            <input
              type="number"
              step="0.1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={optimizationSettings.maximumDrawdown}
              onChange={(e) => handleOptimizationSettingChange('maximumDrawdown', parseFloat(e.target.value))}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="debug-mode"
            checked={optimizationSettings.debug}
            onChange={(e) => handleOptimizationSettingChange('debug', e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="debug-mode" className="text-sm font-medium text-gray-700">
            Enable Debug Mode (slower but shows detailed logs)
          </label>
        </div>
      </div>
      
      {/* Backtest Settings */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Backtest Settings
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Profit Target (Ticks)
            </label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={backtestSettings.profitTarget}
              onChange={(e) => handleBacktestSettingChange('profitTarget', parseInt(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Stop Loss (Ticks)
            </label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={backtestSettings.stopLoss}
              onChange={(e) => handleBacktestSettingChange('stopLoss', parseInt(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Trailing Stop (Ticks)
            </label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={backtestSettings.trailingStop}
              onChange={(e) => handleBacktestSettingChange('trailingStop', parseInt(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Quantity
            </label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={backtestSettings.quantity}
              onChange={(e) => handleBacktestSettingChange('quantity', parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}