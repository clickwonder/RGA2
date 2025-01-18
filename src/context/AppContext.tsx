import React, { createContext, useContext, useState, useEffect } from 'react';
import { BacktestResult, SavedConfiguration, DataFile, OptimizationResult } from '../types';
import { BarData } from '../types';

interface AppContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dataFiles: DataFile[];
  setDataFiles: React.Dispatch<React.SetStateAction<DataFile[]>>;
  activeFileId: string | null;
  setActiveFileId: (id: string | null) => void;
  dateRange: {
    inSample: {
      start: Date | null;
      end: Date | null;
    };
    outSample: {
      start: Date | null;
      end: Date | null;
    };
  };
  setDateRange: (range: {
    inSample: { start: Date | null; end: Date | null };
    outSample: { start: Date | null; end: Date | null };
  }) => void;
  selectedSignals: {
    entry1: string[];
    entry2: string[];
    entry3: string[];
  };
  setSelectedSignals: React.Dispatch<React.SetStateAction<{
    entry1: string[];
    entry2: string[];
    entry3: string[];
  }>>;
  entryMode: string;
  setEntryMode: (mode: string) => void;
  openGroups: {
    entry1: boolean;
    entry2: boolean;
    entry3: boolean;
  };
  setOpenGroups: (groups: { entry1: boolean; entry2: boolean; entry3: boolean }) => void;
  backtestResults: BacktestResult | null;
  setBacktestResults: (results: BacktestResult | null) => void;
  backtestSettings: {
    profitTarget: number;
    stopLoss: number;
    trailingStop: number;
    quantity: number;
  };
  setBacktestSettings: React.Dispatch<React.SetStateAction<{
    profitTarget: number;
    stopLoss: number;
    trailingStop: number;
    quantity: number;
  }>>;
  optimizationSettings: {
    populationSize: number;
    generations: number;
    mutationRate: number;
    inSamplePercentage: number;
    minimumWinRate: number;
    maximumDrawdown: number;
  };
  setOptimizationSettings: React.Dispatch<React.SetStateAction<{
    populationSize: number;
    generations: number;
    mutationRate: number;
    inSamplePercentage: number;
    minimumWinRate: number;
    maximumDrawdown: number;
  }>>;
  optimizationProgress: {
    generation: number;
    totalGenerations: number;
    bestFitness: number;
    isRunning: boolean;
  };
  setOptimizationProgress: React.Dispatch<React.SetStateAction<{
    generation: number;
    totalGenerations: number;
    bestFitness: number;
    isRunning: boolean;
  }>>;
  topStrategies: OptimizationResult[];
  setTopStrategies: React.Dispatch<React.SetStateAction<OptimizationResult[]>>;
  selectedStrategy: number;
  setSelectedStrategy: React.Dispatch<React.SetStateAction<number>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState('signals');
  const [dataFiles, setDataFiles] = useState<DataFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    inSample: { start: Date | null; end: Date | null };
    outSample: { start: Date | null; end: Date | null };
  }>({
    inSample: { start: null, end: null },
    outSample: { start: null, end: null }
  });
  const [selectedSignals, setSelectedSignals] = useState<{
    entry1: string[];
    entry2: string[];
    entry3: string[];
  }>({
    entry1: [],
    entry2: [],
    entry3: []
  });
  const [entryMode, setEntryMode] = useState('signals');
  const [openGroups, setOpenGroups] = useState({
    entry1: true,
    entry2: false,
    entry3: false
  });
  const [backtestResults, setBacktestResults] = useState<BacktestResult | null>(null);
  const [backtestSettings, setBacktestSettings] = useState({
    profitTarget: 20,
    stopLoss: 20,
    trailingStop: 8,
    quantity: 1
  });
  const [optimizationSettings, setOptimizationSettings] = useState({
    populationSize: 10,
    generations: 3,
    debug: false,
    mutationRate: 0.15,
    inSamplePercentage: 0.7,
    minimumWinRate: 0.45,
    maximumDrawdown: 15.0,
    useSelectedSignals: false,
    randomizeEntryMode: false,
    selectedSignals: {
      entryMode: 'signals',
      entry1: [] as string[],
      entry2: [] as string[],
      entry3: [] as string[]
    },
    constraints: {
      minimumTrades: 10,
      minimumWinRate: 0.45,
      maximumDrawdown: 15.0
    },
    exits: {
      fixedTarget: {
        enabled: true,
        params: {
          profitTargetMin: 10,
          profitTargetMax: 50,
          profitTargetStep: 5
        }
      },
      stopLoss: {
        enabled: true,
        params: {
          stopLossMin: 10,
          stopLossMax: 50,
          stopLossStep: 5
        }
      },
      trailingStop: {
        enabled: false,
        params: {
          trailingMin: 5,
          trailingMax: 25,
          trailingStep: 2
        }
      },
      breakeven: {
        enabled: false,
        params: {
          breakevenTicks: 10
        }
      },
      timeStop: {
        enabled: false,
        params: {
          timeLimit: 60
        }
      }
    }
  });

  const [optimizationProgress, setOptimizationProgress] = useState({
    generation: 0,
    totalGenerations: 100,
    bestFitness: 0,
    isRunning: false
  });

  const [topStrategies, setTopStrategies] = useState<OptimizationResult[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<number>(0);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = typeof window !== 'undefined' ? localStorage.getItem('appState') : null;
      if (savedState) {
        const state = JSON.parse(savedState);
        setActiveTab(state.activeTab || 'signals');
        setSelectedSignals(state.selectedSignals || { entry1: [], entry2: [], entry3: [] });
        setEntryMode(state.entryMode || 'signals');
        setOpenGroups(state.openGroups || { entry1: true, entry2: false, entry3: false });
        setBacktestSettings(prev => state.backtestSettings || {
          profitTarget: 20,
          stopLoss: 20,
          trailingStop: 8,
          quantity: 1
        });
        setOptimizationSettings(prev => state.optimizationSettings || {
          populationSize: 200,
          generations: 100,
          mutationRate: 0.15,
          inSamplePercentage: 0.7,
          minimumWinRate: 0.45,
          maximumDrawdown: 15.0
        });
      }
    } catch (e) {
      console.error('Error loading app state:', e);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const state = {
      activeTab,
      selectedSignals,
      entryMode,
      openGroups,
      backtestSettings,
      optimizationSettings
    };
    localStorage.setItem('appState', JSON.stringify(state));
  }, [activeTab, selectedSignals, entryMode, openGroups, backtestSettings, optimizationSettings]);

  // Update selected signals when useSelectedSignals changes
  useEffect(() => {
    if (optimizationSettings.useSelectedSignals) {
      setOptimizationSettings(prev => ({
        ...prev,
        selectedSignals: {
          ...prev.selectedSignals,
          entryMode: entryMode,
          entry1: selectedSignals.entry1,
          entry2: selectedSignals.entry2,
          entry3: selectedSignals.entry3
        }
      }));
    }
  }, [optimizationSettings.useSelectedSignals, selectedSignals, entryMode]);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        dataFiles,
        setDataFiles,
        activeFileId,
        setActiveFileId,
        dateRange,
        setDateRange,
        selectedSignals,
        setSelectedSignals,
        entryMode,
        setEntryMode,
        openGroups,
        setOpenGroups,
        backtestResults,
        setBacktestResults,
        backtestSettings,
        setBacktestSettings,
        optimizationSettings,
        setOptimizationSettings,
        optimizationProgress,
        setOptimizationProgress,
        topStrategies,
        setTopStrategies,
        selectedStrategy,
        setSelectedStrategy
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}