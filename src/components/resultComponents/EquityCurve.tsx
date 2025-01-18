import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { OptimizationResult } from '../../types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface EquityCurveProps {
  inSampleTrades: OptimizationResult['inSampleResults']['trades'];
  outOfSampleTrades: OptimizationResult['outOfSampleResults']['trades'];
}

export function EquityCurve({ inSampleTrades, outOfSampleTrades }: EquityCurveProps) {
  if (!inSampleTrades || !outOfSampleTrades) {
    return <div>No trade data available</div>;
  }

  const inSampleEquity = inSampleTrades.reduce((acc: number[], trade) => {
    const lastEquity = acc.length > 0 ? acc[acc.length - 1] : 0;
    return [...acc, lastEquity + trade.profit];
  }, [0]);

  const outOfSampleEquity = outOfSampleTrades.reduce((acc: number[], trade) => {
    const lastEquity = acc.length > 0 ? acc[acc.length - 1] : inSampleEquity[inSampleEquity.length - 1];
    return [...acc, lastEquity + trade.profit];
  }, []);

  const allPoints = [...inSampleEquity, ...outOfSampleEquity];

  const data = {
    labels: allPoints.map((_, i) => i.toString()),
    datasets: [
      {
        label: 'In-Sample',
        data: [...inSampleEquity, ...Array(outOfSampleEquity.length).fill(null)],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 1,
        fill: false,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Out-of-Sample',
        data: [...Array(inSampleEquity.length).fill(null), ...outOfSampleEquity],
        borderColor: 'rgb(234, 88, 12)',
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
        borderWidth: 1,
        fill: false,
        tension: 0.4,
        pointRadius: 0,
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: 'Trade Number'
        }
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        title: {
          display: true,
          text: 'Cumulative Profit/Loss ($)'
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  return (
    <div style={{ height: '400px' }}>
      <Line data={data} options={options} />
    </div>
  );
}