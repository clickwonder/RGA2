import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Check, Save, FolderOpen, Trash2 } from 'lucide-react';
import { SignalGroup, SavedConfiguration } from '../types';
import { useAppContext, CompleteConfiguration } from '../context/AppContext';
import { getSignalsForCategory } from '../utils/signalUtils';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

function SaveModal({ isOpen, onClose, onSave }: SaveModalProps) {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-medium mb-4">Save Configuration</h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Configuration name"
          className="w-full p-2 border rounded mb-4"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (name.trim()) {
                onSave(name);
                onClose();
              }
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

interface LoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (config: SavedConfiguration) => void;
  savedConfigs: SavedConfiguration[];
  onDelete: (id: string) => void;
}

function LoadModal({ isOpen, onClose, onLoad, savedConfigs, onDelete }: LoadModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-medium mb-4">Load Configuration</h3>
        {savedConfigs.length === 0 ? (
          <p className="text-gray-500">No saved configurations</p>
        ) : (
          <div className="space-y-2">
            {savedConfigs.map((config) => (
              <div key={config.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{config.name}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(config.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onLoad(config)}
                    className="p-1 text-gray-600 hover:text-gray-800"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => onDelete(config.id)}
                    className="p-1 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface SignalCategoryProps {
  title: string;
  signals: string[];
  groupId: string;
  selectedSignals: { [key: string]: string[] };
  onToggleSignal: (groupId: string, signal: string) => void;
  totalSignals: number;
}

function SignalCategory({ title, signals, groupId, selectedSignals, onToggleSignal, totalSignals }: SignalCategoryProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const allSelected = signals.every(signal => selectedSignals[groupId].includes(signal));
  const enabledCount = signals.filter(signal => selectedSignals[groupId].includes(signal)).length;
  
  const toggleAll = () => {
    if (allSelected) {
      signals.forEach(signal => {
        if (selectedSignals[groupId].includes(signal)) {
          onToggleSignal(groupId, signal);
        }
      });
    } else {
      signals.forEach(signal => {
        if (!selectedSignals[groupId].includes(signal)) {
          onToggleSignal(groupId, signal);
        }
      });
    }
  };

  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            onClick={e => e.stopPropagation()}
          />
          <span className="text-sm font-medium">
            {title}
            <span className="ml-2 text-gray-500">
              ({enabledCount} of {totalSignals} Enabled)
            </span>
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="px-3 py-2 border-t space-y-2">
          {signals.map(signal => (
            <label key={signal} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedSignals[groupId].includes(signal)}
                onChange={() => onToggleSignal(groupId, signal)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm">{signal}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

interface EntryGroupProps {
  title: string;
  groupId: string;
  isOpen: boolean;
  onToggle: () => void;
  selectedSignals: { [key: string]: string[] };
  onToggleSignal: (groupId: string, signal: string) => void;
}

function EntryGroup({ title, groupId, isOpen, onToggle, selectedSignals, onToggleSignal }: EntryGroupProps) {
  const categories = {
    'Candlestick Patterns': [
      'BullishEngulfing', 'BearishEngulfing', 'UpCandle', 'DownCandle',
      'ThreeUpCandles', 'ThreeDownCandles', 'BullishHarami', 'BearishHarami',
      'Doji', 'Hammer', 'ShootingStar', 'EveningStar', 'MorningStar'
    ],
    'Oscillators': [
      'RSIBelow30', 'RSIAbove70', 'StochasticBelow20', 'StochasticAbove80',
      'StochKCrossAboveD', 'StochKCrossBelowD', 'ADXAbove30'
    ],
    'Moving Averages': [
      'SMA50AboveSMA200', 'SMA50BelowSMA200', 'SMA7AboveSMA21', 'SMA7BelowSMA21',
      'EMA20AboveEMA50', 'EMA20BelowEMA50', 'SMA21AboveSMA50', 'SMA21BelowSMA50'
    ],
    'Bollinger Bands': [
      'PriceAboveUpper', 'PriceBelowLower', 'CloseAboveBB2_20Upper', 'CloseBelowBB2_20Lower',
      'CloseAboveBB3_20Upper', 'CloseBelowBB3_20Lower', 'CloseAboveBB1_20Upper', 'CloseBelowBB1_20Lower'
    ],
    'Volume': [
      'VolumeIncreasing', 'VolumeDecreasing', 'CMFAbove40', 'CMFAbove35',
      'CMFAbove30', 'CMFBelowMinus40', 'CMFBelowMinus30', 'CMFBelowMinus20'
    ],
    'Trend': [
      'CCIAbove250', 'CCIAbove200', 'CCIAbove150', 'CCIAbove100',
      'CCIBelowMinus250', 'CCIBelowMinus200', 'CCIBelowMinus150', 'CCIBelowMinus100',
      'LinRegSlopeAbove5', 'LinRegSlopeAbove10', 'LinRegSlopeBelowMinus5', 'LinRegSlopeBelowMinus10'
    ],
    'Aroon': [
      'AroonUpAboveDown', 'AroonUpBelowDown', 'AroonOscAbove90',
      'AroonOscAbove80', 'AroonOscBelowMinus90', 'AroonOscBelowMinus80'
    ],
    'Choppiness': [
      'ChoppinessIndexAbove70', 'ChoppinessIndexAbove65', 'ChoppinessIndexAbove60',
      'ChoppinessIndexBelow40', 'ChoppinessIndexBelow35', 'ChoppinessIndexBelow30'
    ],
    'Support/Resistance': [
      'PriceAboveS1', 'PriceAboveS2', 'PriceAboveS3', 'PriceBelowR1',
      'PriceBelowR2', 'PriceBelowR3', 'PriceBelowS1', 'PriceBelowS2',
      'PriceBelowS3', 'PriceAboveR1', 'PriceAboveR2', 'PriceAboveR3'
    ],
    'Fibonacci': [
      'PriceAbove236Retracement', 'PriceAbove382Retracement', 'PriceAbove500Retracement',
      'PriceAbove618Retracement', 'PriceBelow236Retracement', 'PriceBelow382Retracement',
      'PriceBelow500Retracement', 'PriceBelow618Retracement'
    ]
  };

  return (
    <div className="border rounded-lg">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left border-b"
      >
        <span className="font-medium">{title}</span>
        <ChevronDown className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="p-4 space-y-3">
          {Object.entries(categories).map(([category, signals]) => (
            <SignalCategory
              key={category}
              title={category}
              groupId={groupId}
              signals={signals}
              selectedSignals={selectedSignals}
              onToggleSignal={onToggleSignal}
              totalSignals={signals.length}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SignalConfig() {
  const {
    entryMode,
    setEntryMode,
    setDateRange,
    selectedSignals,
    setSelectedSignals,
    openGroups,
    setOpenGroups,
    dataFiles,
    setDataFiles,
    activeFileId,
    optimizationSettings,
    backtestSettings,
    setOptimizationSettings,
    setBacktestSettings,
    setActiveFileId
  } = useAppContext();
  const [selectedSplit, setSelectedSplit] = useState(70);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState<SavedConfiguration[]>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('signalConfigs') : null;
      if (!saved) return [];
      const configs = JSON.parse(saved);
      // Clean up old configs on load
      return configs.slice(0, 5);  // Keep only 5 most recent
    } catch (e) {
      console.error('Error loading saved configs:', e);
      return [];
    }
  });

  const updateDateRangeSplit = useCallback(
    (inputData: BarData[], splitRatio: number) => {
      if (!inputData || inputData.length === 0) return;
      
      // Ensure all dates are valid Date objects
      if (!inputData.every(d => d.time instanceof Date)) return;
      
      const sortedDates = [...inputData].sort((a, b) => a.time.getTime() - b.time.getTime());
      const splitIndex = Math.floor(sortedDates.length * (splitRatio / 100));

      setDateRange({
        inSample: {
          start: sortedDates[0].time,
          end: sortedDates[splitIndex - 1].time
        },
        outSample: {
          start: sortedDates[splitIndex].time,
          end: sortedDates[sortedDates.length - 1].time
        }
      });
    },
    [setDateRange]
  );

  const saveToLocalStorage = (configs: SavedConfiguration[]) => {
    try {
      // Keep only 5 most recent configurations
      const recentConfigs = configs
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5)
        .map(config => ({
          ...config,
          config: {
            ...config.config,
            // Don't store the full data array in localStorage
            dataFile: config.config.dataFile ? {
              id: config.config.dataFile.id,
              name: config.config.dataFile.name,
              // Only store a reference to the file, not the data
              data: []
            } : null
          }
        }));

      localStorage.setItem('signalConfigs', JSON.stringify(recentConfigs));
      return recentConfigs;
    } catch (e) {
      console.error('Error saving configs:', e);
      return configs;
    }
  };

  // Save complete configuration
  const toggleSignal = (groupId: string, signal: string) => {
    setSelectedSignals((prev) => {
      return {
        ...prev,
        [groupId]: prev[groupId as keyof typeof prev].includes(signal)
          ? prev[groupId as keyof typeof prev].filter(s => s !== signal)
          : [...prev[groupId as keyof typeof prev], signal]
      };
    });
  };

  const handleSave = (name: string) => {
    // Limit the number of saved configs
    if (savedConfigs.length >= 5) {
      alert('Maximum of 5 configurations allowed. Please delete some old configurations first.');
      return;
    }

    const newConfig: SavedConfiguration = {
      id: Date.now().toString(),
      name,
      timestamp: Date.now(),
      config: {
        entryMode,
        selectedSignals,
        openGroups,
        optimizationSettings,
        backtestSettings
      }
    };

    const updatedConfigs = [...savedConfigs, newConfig];
    setSavedConfigs(saveToLocalStorage(updatedConfigs));
  };

  // Load complete configuration
  const handleLoad = (config: SavedConfiguration) => {
    setEntryMode(config.config.entryMode);
    setSelectedSignals(config.config.selectedSignals);
    setOpenGroups(config.config.openGroups);
    if (config.config.optimizationSettings) {
      setOptimizationSettings(prev => ({
        ...prev,
        ...config.config.optimizationSettings
      }));
    }
    if (config.config.backtestSettings) {
      setBacktestSettings(prev => ({
        ...prev,
        ...config.config.backtestSettings
      }));
    }
    setIsLoadModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const updatedConfigs = savedConfigs.filter(config => config.id !== id);
    setSavedConfigs(saveToLocalStorage(updatedConfigs));
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2 mb-4">
        <button
          onClick={() => setIsLoadModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border rounded-md hover:bg-gray-50"
        >
          <FolderOpen className="w-4 h-4" />
          Load
        </button>
        <button
          onClick={() => setIsSaveModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>

      <div>
        <div className="grid grid-cols-2 gap-4">
          {/* Entry Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Entry Mode</label>
            <select
              value={entryMode}
              onChange={(e) => setEntryMode(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="signals">Signals (OR Logic)</option>
              <option value="confirmations">Confirmations (AND Logic)</option>
              <option value="split">Split Entries</option>
            </select>
          </div>

          {/* Signal Groups */}
          <div className="col-span-2">
            <div className="space-y-3">
              <EntryGroup
                title="Entry Group 1"
                groupId="entry1"
                isOpen={openGroups.entry1}
                onToggle={() => setOpenGroups(prev => ({ ...prev, entry1: !prev.entry1 }))}
                selectedSignals={selectedSignals}
                onToggleSignal={toggleSignal}
              />
              <EntryGroup
                title="Entry Group 2"
                groupId="entry2"
                isOpen={openGroups.entry2}
                onToggle={() => setOpenGroups(prev => ({ ...prev, entry2: !prev.entry2 }))}
                selectedSignals={selectedSignals}
                onToggleSignal={toggleSignal}
              />
              <EntryGroup
                title="Entry Group 3"
                groupId="entry3"
                isOpen={openGroups.entry3}
                onToggle={() => setOpenGroups(prev => ({ ...prev, entry3: !prev.entry3 }))}
                selectedSignals={selectedSignals}
                onToggleSignal={toggleSignal}
              />
            </div>
          </div>
        </div>
      </div>
      
      <SaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSave}
      />
      
      <LoadModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
        onLoad={handleLoad}
        savedConfigs={savedConfigs}
        onDelete={handleDelete}
      />
    </div>
  );
}