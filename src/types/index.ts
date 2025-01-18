export interface DataFile {
  id: string;
  name: string;
  data: BarData[];
  size: number;
  lastModified: number;
  path: string;
}

export interface BarData {
  time: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Signal {
  namespace: string;  // e.g. "CandlestickPatterns"
  name: string;      // e.g. "Doji"
}

export interface EntryGroup {
  signals: Signal[];
}

export interface SignalCombination {
  mode: 'Signals' | 'Confirmations' | 'Split';
  entries: {
    entry1: Signal[];
    entry2: Signal[];
    entry3: Signal[];
  };
  profitTarget: number;
  stopLoss: number;
  trailingStop: number;
}

export interface BacktestResult {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  netProfit: number;
  profitFactor: number;
  maxDrawdown: number;
  averageWin: number;
  averageLoss: number;
  trades: Trade[];
}

export interface Trade {
  entryTime: Date;
  exitTime: Date;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  direction: number;  // 1 for long, -1 for short
  profit: number;
  entryReason: string;
  exitReason: string;
}

export interface OptimizationResult {
  combination: SignalCombination;
  fitness: number;
  inSampleResults: BacktestResult;
  outOfSampleResults: BacktestResult;
}

export interface GeneticSettings {
  populationSize: number;
  generations: number;
  debug: boolean;
  mutationRate: number;
  crossoverRate: number;
  elitismRate: number;
}

// Add other existing types here...