import React from 'react';
import { Box, Settings, LineChart, TrendingUp, Waves } from 'lucide-react';
import DataUpload from './components/DataUpload';
import OptimizationConfig from './components/OptimizationConfig';
import BacktestConfig from './components/BacktestConfig';
import ResultsContainer from './components/ResultsContainer';
import SignalConfig from './components/SignalConfig';
import { AppProvider } from './context/AppContext';
import { useAppContext } from './context/AppContext';

function AppContent() {
  const { activeTab, setActiveTab } = useAppContext();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-[1920px] mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center gap-3">
          <Box className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Genetic Signal Generator
          </h1>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto py-6 sm:px-6 lg:px-8">
        <div className="space-y-6 px-4 sm:px-0">
          {/* Data Upload at the top */}
          <DataUpload />
          
          {/* Main Content */}
          <div className="bg-white shadow rounded-lg">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab('signals')}
                      className={`${
                        activeTab === 'signals'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2`}
                    >
                      <Waves className="w-4 h-4" />
                      Signals
                    </button>
                    <button
                      onClick={() => setActiveTab('optimization')}
                      className={`${
                        activeTab === 'optimization'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2`}
                    >
                      <Settings className="w-4 h-4" />
                      Optimization
                    </button>
                    <button
                      onClick={() => setActiveTab('backtest')}
                      className={`${
                        activeTab === 'backtest'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2`}
                    >
                      <LineChart className="w-4 h-4" />
                      Backtest
                    </button>
                    <button
                      onClick={() => setActiveTab('results')}
                      className={`${
                        activeTab === 'results'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      Results
                    </button>
                  </nav>
                </div>
                <div className="p-4">
                  {activeTab === 'signals' && <SignalConfig />}
                  {activeTab === 'optimization' && <OptimizationConfig />}
                  {activeTab === 'backtest' && <BacktestConfig />}
                  {activeTab === 'results' && <ResultsContainer />}
                </div>
              </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <React.StrictMode>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </React.StrictMode>
  );
}

export default App;