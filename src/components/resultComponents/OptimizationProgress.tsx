import React from 'react';
import { StopCircle } from 'lucide-react';

interface OptimizationProgressProps {
  generation: number;
  totalGenerations: number;
  bestFitness: number;
  isInitializing: boolean;
  onStop?: () => void;
}

export function OptimizationProgress({ 
  generation, 
  totalGenerations, 
  bestFitness,
  isInitializing,
  onStop
}: OptimizationProgressProps) {
  const progress = (generation / totalGenerations) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-2">
        <div className="flex flex-col gap-1">
          <div className="flex gap-4 text-sm">
            {isInitializing ? (
              <span className="text-indigo-600">Initializing population...</span>
            ) : (
              <>
                <span>Generation {generation} of {totalGenerations}</span>
                <span>Best Fitness: {bestFitness.toFixed(3)}</span>
              </>
            )}
          </div>
          {isInitializing && (
            <div className="text-xs text-gray-500">
              This may take a few moments as we evaluate initial strategies
            </div>
          )}
        </div>
        {onStop && (
          <button
            onClick={onStop}
            className="flex items-center gap-2 px-3 py-1 text-red-600 hover:text-red-700 border border-red-300 rounded-md disabled:opacity-50"
            disabled={isInitializing}
          >
            <StopCircle className="w-4 h-4" />
            Stop
          </button>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${isInitializing ? 5 : progress}%` }}
        />
      </div>
    </div>
  );
}