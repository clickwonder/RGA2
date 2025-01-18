import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  isPositive?: boolean;
}

export function MetricCard({ title, value, isPositive }: MetricCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="text-sm text-gray-500">{title}</div>
      <div className={`text-xl font-semibold ${
        isPositive === undefined ? '' : isPositive ? 'text-green-600' : 'text-red-600'
      }`}>
        {value}
      </div>
    </div>
  );
}