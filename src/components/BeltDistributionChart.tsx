'use client';

import { useQuery } from '@tanstack/react-query';
import { BeltSystemAPI } from '../lib/api';
import { beltColors, getBeltDisplayName } from '../lib/utils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function BeltDistributionChart() {
  const { data: frequencyData, isLoading } = useQuery({
    queryKey: ['belts-frequency'],
    queryFn: () => BeltSystemAPI.getBeltsFrequency(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!frequencyData || frequencyData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  // Sort by belt order and take top 10 for better visualization
  const sortedData = frequencyData
    .sort((a, b) => a.count - b.count)
    .slice(-10);

  const chartData = {
    labels: sortedData.map(item => getBeltDisplayName(item.belt)),
    datasets: [
      {
        label: 'Number of Belts',
        data: sortedData.map(item => item.count),
        backgroundColor: sortedData.map(item => beltColors[item.belt]),
        borderColor: sortedData.map(item => beltColors[item.belt]),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Count: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0,
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}
