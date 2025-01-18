import React, { useCallback, useState, useEffect } from 'react';
import { Upload, Trash2, ChevronDown, Check } from 'lucide-react';
import { BarData, DataFile } from '../types';
import { useAppContext } from '../context/AppContext';
import { saveFileToIndexedDB, loadFilesFromIndexedDB, deleteFileFromIndexedDB } from '../utils/storage';

interface SplitButtonProps {
  ratio: number;
  selected: boolean;
  onClick: () => void;
}

function SplitButton({ ratio, selected, onClick }: SplitButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-sm font-medium rounded-md ${
        selected
          ? 'bg-indigo-600 text-white'
          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
      }`}
    >
      {ratio}/
      {100 - ratio}
    </button>
  );
}

export default function DataUpload() {
  const [isOpen, setIsOpen] = React.useState(true);
  const [selectedSplit, setSelectedSplit] = useState(70);
  const { dataFiles, setDataFiles, activeFileId, setActiveFileId, setDateRange } = useAppContext();

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

  // Update date range whenever split ratio changes
  useEffect(() => {
    const activeFile = dataFiles.find(f => f.id === activeFileId);
    if (activeFile) {
      updateDateRangeSplit(activeFile.data, selectedSplit);
    }
  }, [selectedSplit, activeFileId, dataFiles, updateDateRangeSplit]);
  const loadSampleData = useCallback(() => {
    if (dataFiles.length > 0) return;

    // Create properly formatted sample data
    const sampleData: BarData[] = [];
    
    // Generate 3 days of data with 4 bars each
    for (let day = 0; day < 3; day++) {
      for (let bar = 0; bar < 4; bar++) {
        const date = new Date(2023, 0, 3 + day);
        date.setHours(9, 31 + bar, 0, 0); // Set exact time: 9:31, 9:32, 9:33, 9:34
        
        sampleData.push({
          time: date,
          open: 12300 + Math.random() * 100,
          high: 12300 + Math.random() * 100,
          low: 12300 + Math.random() * 100,
          close: 12300 + Math.random() * 100,
          volume: Math.floor(1000 + Math.random() * 6000)
        });
      }
    }

    // Sort the data by date
    sampleData.sort((a, b) => {
      if (!a.time || !b.time) return 0;
      return a.time.getTime() - b.time.getTime();
    });

    const newFile: DataFile = {
      id: 'sample-data',
      name: 'Sample Data.csv',
      data: sampleData
    };

    setDataFiles([newFile]);
    setActiveFileId(newFile.id);
    updateDateRangeSplit(sampleData, selectedSplit);
  }, [dataFiles.length, setDataFiles, setActiveFileId, selectedSplit, updateDateRangeSplit]);

  // Initialize with sample data
  React.useEffect(() => {
    loadSampleData();
  }, [loadSampleData]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check if file with same name already exists
    const existingFile = dataFiles.find(f => f.name === file.name);
    if (existingFile) {
      alert('File with same name already exists');
      return;
    }

    try {
      // Create a unique filename
      const timestamp = Date.now();
      const uniqueFilename = `${timestamp}-${file.name}`;
      const filePath = `/uploads/${uniqueFilename}`;

      // Read file content
      const text = await file.text();
      const lines = text.split('\n')
        .filter(line => line.trim())
        .map(line => line.trim());

      const headers = lines[0].split(',');
    
      const parsedData: BarData[] = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        
        // Ensure we have all required values
        if (values.length < 5) {
          throw new Error('Invalid CSV format: missing columns');
        }

        const parsedDate = new Date(values[0]);
        if (isNaN(parsedDate.getTime())) {
          throw new Error('Invalid date format in CSV');
        }

        const numericValues = values.slice(1, 6).map(v => {
          const num = parseFloat(v);
          if (isNaN(num)) {
            throw new Error('Invalid numeric value in CSV');
          }
          return num;
        });

        return {
          time: parsedDate,
          open: numericValues[0],
          high: numericValues[1],
          low: numericValues[2],
          close: numericValues[3],
          volume: numericValues[4]
        };
      });

      // Sort the parsed data by date
      parsedData.sort((a, b) => {
        if (!a.time || !b.time) {
          throw new Error('Invalid date in data');
        }
        return a.time.getTime() - b.time.getTime();
      });

      if (parsedData.length === 0) {
        throw new Error('No valid data rows found in CSV');
      }

      // Create new file entry
      const newFile: DataFile = {
        id: `file-${timestamp}`,
        name: file.name,
        data: parsedData,
        size: file.size,
        lastModified: file.lastModified,
        path: filePath
      };

      // Save file data to IndexedDB
      await saveFileToIndexedDB(newFile);

      setDataFiles(prev => [...prev, newFile]);
      setActiveFileId(newFile.id);
      updateDateRangeSplit(parsedData, selectedSplit);

    } catch (error) {
      console.error('Error processing file:', error instanceof Error ? error.message : 'Unknown error');
      alert('Error processing file. Please ensure the file is properly formatted.');
    }
  }, [setDataFiles, setActiveFileId, updateDateRangeSplit, selectedSplit]);

  const handleDeleteFile = useCallback(async (fileId: string) => {
    // Delete from IndexedDB
    try {
      await deleteFileFromIndexedDB(fileId);
    } catch (error) {
      console.error('Error deleting file from IndexedDB:', error);
    }

    // Update state
    setDataFiles(prev => {
      const newFiles = prev.filter(f => f.id !== fileId);
      if (activeFileId === fileId) {
        const nextFile = newFiles[0];
        setActiveFileId(nextFile?.id || null);
        if (nextFile) {
          updateDateRangeSplit(nextFile.data, selectedSplit);
        }
      }
      return newFiles;
    });
  }, [activeFileId, setActiveFileId, selectedSplit, updateDateRangeSplit]);

  // Load saved files from IndexedDB on mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const files = await loadFilesFromIndexedDB();
        if (files.length > 0) {
          setDataFiles(files);
          if (!activeFileId) {
            setActiveFileId(files[0].id);
            updateDateRangeSplit(files[0].data, selectedSplit);
          }
        }
      } catch (error) {
        console.error('Error loading files from IndexedDB:', error);
      }
    };
    loadFiles();
  }, []);
  const handleSelectFile = useCallback((fileId: string) => {
    setActiveFileId(fileId);
    const file = dataFiles.find(f => f.id === fileId);
    if (file) {
      updateDateRangeSplit(file.data, selectedSplit);
    }
  }, [dataFiles, setActiveFileId, selectedSplit, updateDateRangeSplit]);

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full px-4 py-3 flex items-center justify-between text-left border-b bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-medium text-gray-900">Data Upload</h3>
        </div>
        <ChevronDown className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && <div className="px-4 py-5 sm:p-6">
        <div className="flex flex-col space-y-4">
          <p className="text-sm text-gray-500 max-w-lg">
            Upload your CSV file containing OHLCV data
          </p>
          <div className="flex items-center">
            <label className="relative cursor-pointer bg-indigo-600 rounded-md font-medium text-white hover:bg-indigo-500 
                            focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
              <span className="px-4 py-2 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload CSV
              </span>
              <input
                type="file"
                className="sr-only"
                accept=".csv"
                onChange={handleFileUpload}
              />
            </label>
          </div>
          
          {dataFiles.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700">Uploaded Files</h4>
                <div className="flex gap-2">
                  {[90, 80, 70, 60, 50].map((ratio) => (
                    <SplitButton
                      key={ratio}
                      ratio={ratio}
                      selected={selectedSplit === ratio}
                      onClick={() => {
                        const activeFile = dataFiles.find(f => f.id === activeFileId);
                        if (activeFile) {
                          setSelectedSplit(ratio);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {dataFiles.map((file) => (
                  <div 
                    key={file.id} 
                    className={`flex items-center justify-between rounded p-2 cursor-pointer
                      ${file.id === activeFileId ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50'}`}
                    onClick={() => handleSelectFile(file.id)}
                  >
                    <div className="flex items-center gap-2">
                      {file.id === activeFileId && <Check className="w-4 h-4 text-indigo-600" />}
                      <span className="text-sm font-mono truncate">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file.id);
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {dataFiles.length === 0 && <p className="text-sm text-gray-500">No files uploaded</p>}
        </div>
      </div>}
    </div>
  );
}