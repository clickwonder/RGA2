import React from 'react';
import { WalkForwardResult, MonteCarloResult } from '../../types';

interface ValidationResultsProps {
  walkForward: WalkForwardResult[];
  monteCarlo: MonteCarloResult;
}

export function ValidationResults({ walkForward, monteCarlo }: ValidationResultsProps) {
  // Calculate overall robustness metrics
  const avgRobustness = walkForward.reduce((sum, p) => sum + p.robustness, 0) / walkForward.length;
  const consistentPerformance = walkForward.filter(p => p.robustness >= 0.7).length / walkForward.length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-medium text-gray-900">Walk Forward Analysis</h4>
          <div className={`text-sm font-medium ${avgRobustness >= 0.7 ? 'text-green-600' : 'text-red-600'}`}>
            Overall Robustness: {(avgRobustness * 100).toFixed(1)}%
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm">
          <h5 className="font-medium mb-2">Analysis Insights:</h5>
          <ul className="space-y-2 list-disc pl-4">
            <li>
              Strategy consistency: {(consistentPerformance * 100).toFixed(0)}% of periods show robust performance
              {consistentPerformance >= 0.75 ? 
                ' - Strong consistency across different market conditions' : 
                ' - Strategy may be sensitive to market conditions'}
            </li>
            <li>
              {avgRobustness >= 0.7 ? 
                'Strategy shows good robustness (>70%) indicating reliable out-of-sample performance' :
                'Strategy shows weak robustness (<70%) suggesting possible curve fitting'}
            </li>
            <li>
              Recommended action: 
              {avgRobustness >= 0.7 && consistentPerformance >= 0.75 ?
                ' Strategy is suitable for live trading with proper risk management' :
                ' Consider further optimization or parameter adjustments'}
            </li>
          </ul>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {walkForward.map((period, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-center mb-2">
                <h5 className="font-medium">Period {index + 1}</h5>
                <span className="text-sm text-gray-500">
                  {period.period.start.toLocaleDateString()} - {period.period.end.toLocaleDateString()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">In-Sample Net Profit</div>
                  <div className={`text-lg font-semibold ${
                    period.inSampleResults.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${period.inSampleResults.netProfit.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Out-of-Sample Net Profit</div>
                  <div className={`text-lg font-semibold ${
                    period.outOfSampleResults.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${period.outOfSampleResults.netProfit.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Robustness Ratio</div>
                  <div className={`text-lg font-semibold ${
                    period.robustness >= 0.7 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(period.robustness * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Monte Carlo Analysis</h4>
        <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm">
          <h5 className="font-medium mb-2">Risk Analysis Insights:</h5>
          <ul className="space-y-2 list-disc pl-4">
            <li>
              Worst-case drawdown (95% confidence): ${monteCarlo.confidenceIntervals.maxDrawdown.ci95.upper.toFixed(2)}
            </li>
            <li>
              Win rate stability: {((monteCarlo.confidenceIntervals.winRate.ci95.upper - 
                                   monteCarlo.confidenceIntervals.winRate.ci95.lower) * 100).toFixed(1)}% range
            </li>
            <li>
              Profit potential range: ${monteCarlo.confidenceIntervals.netProfit.ci95.lower.toFixed(2)} to 
              ${monteCarlo.confidenceIntervals.netProfit.ci95.upper.toFixed(2)}
            </li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h5 className="font-medium mb-2">Net Profit Range (95% CI)</h5>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-500">Lower Bound</div>
                <div className="text-lg font-semibold">
                  ${monteCarlo.confidenceIntervals.netProfit.ci95.lower.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Upper Bound</div>
                <div className="text-lg font-semibold">
                  ${monteCarlo.confidenceIntervals.netProfit.ci95.upper.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h5 className="font-medium mb-2">Max Drawdown Range (95% CI)</h5>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-500">Lower Bound</div>
                <div className="text-lg font-semibold">
                  ${monteCarlo.confidenceIntervals.maxDrawdown.ci95.lower.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Upper Bound</div>
                <div className="text-lg font-semibold">
                  ${monteCarlo.confidenceIntervals.maxDrawdown.ci95.upper.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h5 className="font-medium mb-2">Win Rate Range (95% CI)</h5>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-500">Lower Bound</div>
                <div className="text-lg font-semibold">
                  {(monteCarlo.confidenceIntervals.winRate.ci95.lower * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Upper Bound</div>
                <div className="text-lg font-semibold">
                  {(monteCarlo.confidenceIntervals.winRate.ci95.upper * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}