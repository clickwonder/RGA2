import { BarData, GeneticSettings, SignalCombination, BacktestResult } from '../types';
import { runBacktest } from '../utils/backtest';
import { runWalkForwardAnalysis, runMonteCarloSimulation } from '../utils/validation';
import { generateRandomCombination, crossover, mutate, calculateFitness } from '../utils/genetic';

interface SlimBacktestResults {
  netProfit: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  maxDrawdown: number;
}

interface SlimStrategy {
  combination: SignalCombination;
  fitness: number;
  inSampleResults: SlimBacktestResults;
  outOfSampleResults: SlimBacktestResults;
}

let shouldStop = false;
let currentGeneration = 0;

function log(message: string, data?: any, settings?: GeneticSettings) {
  if (settings?.debug) {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
}

interface Individual {
  combination: SignalCombination;
  fitness: number;
  inSampleResults: BacktestResult | null;
  outOfSampleResults: BacktestResult | null;
  walkForwardResults?: any;
  monteCarloResults?: any;
}

function splitData(data: BarData[], splitRatio: number): {
  inSample: BarData[];
  outOfSample: BarData[];
} {
  const splitIndex = Math.floor(data.length * splitRatio);
  return {
    inSample: data.slice(0, splitIndex),
    outOfSample: data.slice(splitIndex)
  };
}

self.onmessage = async (e: MessageEvent) => {
  const { data, settings } = e.data;
  
  if (e.data.type === 'stop') {
    shouldStop = true;
    return;
  }
  
  let population: Individual[] = [];
  
  // Ensure we have valid settings
  if (!settings.exits || !settings.exits.fixedTarget || !settings.exits.stopLoss) {
    self.postMessage({ 
      type: 'error', 
      error: 'Invalid optimization settings' 
    });
    return;
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    self.postMessage({ 
      type: 'error', 
      error: 'Invalid or empty data provided' 
    });
    return;
  }

  shouldStop = false;
  currentGeneration = 0;

  try {
    const { inSample, outOfSample } = splitData(data, settings.inSamplePercentage);
    
    log('Data split:', {
      total: data.length,
      inSample: inSample.length,
      outOfSample: outOfSample.length
    }, settings);

    let bestIndividual: Individual = {
      combination: generateRandomCombination(settings),
      fitness: 0,
      inSampleResults: null,
      outOfSampleResults: null
    };
    
    // Initialize population
    self.postMessage({
      type: 'progress',
      isInitializing: true,
      generation: 0,
      totalGenerations: settings.generations,
      bestFitness: 0
    });
      
    for (let i = 0; i < settings.populationSize; i++) {
      if (shouldStop) {
        self.postMessage({ type: 'stopped' });
        return;
      }
        
      log(`Initializing individual ${i + 1}/${settings.populationSize}`, null, settings);
      
      const combination = generateRandomCombination(settings);
      log('Generated combination:', {
        mode: combination.mode,
        entries: {
          entry1: combination.entries.entry1.length,
          entry2: combination.entries.entry2.length,
          entry3: combination.entries.entry3.length
        },
        profitTarget: combination.profitTarget,
        stopLoss: combination.stopLoss,
        trailingStop: combination.trailingStop
      }, settings);
      
      const results = runBacktest(inSample, combination);
      log('Backtest results:', {
        trades: results.trades.length,
        netProfit: results.netProfit,
        winRate: (results.winRate * 100).toFixed(1) + '%',
        profitFactor: results.profitFactor.toFixed(2)
      }, settings);
      
      const outOfSampleResults = runBacktest(outOfSample, combination);
      const fitness = calculateFitness(results, settings.fitnessWeights, settings.constraints, true);
      log('Individual fitness:', {
        fitness: fitness.toFixed(4),
        components: {
          trades: results.totalTrades,
          winRate: (results.winRate * 100).toFixed(1) + '%',
          profitFactor: results.profitFactor.toFixed(2),
          netProfit: results.netProfit.toFixed(2),
          maxDrawdown: results.maxDrawdown.toFixed(2)
        }
      }, settings);

      population.push({
        combination,
        fitness,
        inSampleResults: results,
        outOfSampleResults
      });

      // Send progress updates more frequently during initialization
      if (i % 5 === 0) {
        const slimStrategies = population
          .filter(p => p.fitness > 0)
          .slice(0, 10)
          .map(p => ({
            combination: p.combination,
            fitness: p.fitness,
            inSampleResults: {
              netProfit: p.inSampleResults.netProfit,
              winRate: p.inSampleResults.winRate,
              profitFactor: p.inSampleResults.profitFactor,
              totalTrades: p.inSampleResults.totalTrades,
              maxDrawdown: p.inSampleResults.maxDrawdown
            },
            outOfSampleResults: {
              netProfit: p.outOfSampleResults.netProfit,
              winRate: p.outOfSampleResults.winRate,
              profitFactor: p.outOfSampleResults.profitFactor,
              totalTrades: p.outOfSampleResults.totalTrades,
              maxDrawdown: p.outOfSampleResults.maxDrawdown
            }
          }));

        self.postMessage({
          type: 'progress',
          generation: 0,
          bestFitness: Math.max(...population.map(p => p.fitness)),
          validStrategies: slimStrategies
        });
      }
    }

    // Main evolution loop
    for (currentGeneration = 0; currentGeneration < settings.generations; currentGeneration++) {
      if (shouldStop) break;
      
      // Sort by fitness
      population.sort((a, b) => b.fitness - a.fitness);

      // Find valid strategies from current population
      const validStrategies = population.filter(individual => 
        individual.fitness > 0 && 
        individual.inSampleResults &&
        individual.outOfSampleResults
      );

      // Update best individual
      if (population[0].fitness > bestIndividual.fitness) {
        bestIndividual = { ...population[0] };
        bestIndividual = population[0];
      }

      // Create slim version of strategies for progress updates
      const slimStrategies = validStrategies.slice(0, 10).map(p => ({
        combination: p.combination,
        fitness: p.fitness,
        inSampleResults: {
          netProfit: p.inSampleResults.netProfit,
          winRate: p.inSampleResults.winRate,
          profitFactor: p.inSampleResults.profitFactor,
          totalTrades: p.inSampleResults.totalTrades,
          maxDrawdown: p.inSampleResults.maxDrawdown
        },
        outOfSampleResults: {
          netProfit: p.outOfSampleResults.netProfit,
          winRate: p.outOfSampleResults.winRate,
          profitFactor: p.outOfSampleResults.profitFactor,
          totalTrades: p.outOfSampleResults.totalTrades,
          maxDrawdown: p.outOfSampleResults.maxDrawdown
        }
      }));

      // Send progress update with valid strategies
      self.postMessage({
        type: 'progress',
        isInitializing: false,
        generation: currentGeneration + 1,
        totalGenerations: settings.generations,
        bestFitness: bestIndividual.fitness,
        validStrategies: validStrategies
          .map(strategy => ({
            combination: strategy.combination,
            fitness: strategy.fitness,
            inSampleResults: strategy.inSampleResults,
            outOfSampleResults: strategy.outOfSampleResults
          }))
          .slice(0, 10)
      });

      // Create next generation
      const nextGeneration: Individual[] = [];

      // Elitism
      const eliteCount = Math.floor(settings.populationSize * settings.elitismRate);
      nextGeneration.push(...population.slice(0, eliteCount));

      // Crossover and Mutation
      while (nextGeneration.length < settings.populationSize) {
        const parent1 = population[Math.floor(Math.random() * population.length)];
        const parent2 = population[Math.floor(Math.random() * population.length)];

        let child = crossover(parent1.combination, parent2.combination);
        if (Math.random() < settings.mutationRate) {
          child = mutate(child, settings.mutationRate, settings);
        }

        const results = runBacktest(inSample, child);
        const outOfSampleResults = runBacktest(outOfSample, child);
        const fitness = calculateFitness(results, settings.fitnessWeights, settings.constraints);

        nextGeneration.push({
          combination: child,
          fitness,
          inSampleResults: results,
          outOfSampleResults
        });
      }

      population = nextGeneration;
    }

    if (shouldStop) {
      self.postMessage({ type: 'stopped' });
    } else {
      // Run validation only for the best individual at the end
      const walkForwardResults = runWalkForwardAnalysis(data, bestIndividual.combination);
      const monteCarloResults = runMonteCarloSimulation([
        ...bestIndividual.inSampleResults.trades,
        ...bestIndividual.outOfSampleResults.trades
      ]);

      bestIndividual.walkForwardResults = walkForwardResults;
      bestIndividual.monteCarloResults = monteCarloResults;

      self.postMessage({ type: 'complete', result: bestIndividual });
    }
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};