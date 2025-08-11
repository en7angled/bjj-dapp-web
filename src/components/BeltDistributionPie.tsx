'use client';

import { useQuery } from '@tanstack/react-query';
import { BeltSystemAPI } from '../lib/api';
import { beltColors, beltOrder, getBeltDisplayName } from '../lib/utils';
import type { BJJBelt, BeltFrequency } from '../types/api';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const CORE_BELTS: BJJBelt[] = ['White', 'Blue', 'Purple', 'Brown', 'Black'];

export function BeltDistributionPie() {
  const { data, isLoading } = useQuery({
    queryKey: ['belts-frequency-pie'],
    queryFn: () => BeltSystemAPI.getBeltsFrequency(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-64 text-gray-500">No data available</div>;
  }

  // Aggregate into core belts + Senior Ranks
  const freqMap = new Map<BJJBelt | 'Senior Ranks', number>();
  for (const b of CORE_BELTS) freqMap.set(b, 0);
  freqMap.set('Senior Ranks', 0);

  for (const item of data as BeltFrequency[]) {
    if (CORE_BELTS.includes(item.belt)) {
      freqMap.set(item.belt, (freqMap.get(item.belt) || 0) + item.count);
    } else {
      freqMap.set('Senior Ranks', (freqMap.get('Senior Ranks') || 0) + item.count);
    }
  }

  const labels = [...CORE_BELTS, 'Senior Ranks'] as (BJJBelt | 'Senior Ranks')[];
  const values = labels.map((l) => freqMap.get(l) || 0);
  const total = values.reduce((a, b) => a + b, 0);

  const backgroundColor = [
    beltColors.White,
    beltColors.Blue,
    beltColors.Purple,
    beltColors.Brown,
    beltColors.Black,
    '#6B7280',
  ];

  const chartData = {
    labels: labels.map((l) => (typeof l === 'string' && l !== 'Senior Ranks' ? getBeltDisplayName(l as BJJBelt) : String(l))),
    datasets: [
      {
        label: 'Practitioner share',
        data: values,
        backgroundColor,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const },
      tooltip: {
        callbacks: {
          label: function (ctx: any) {
            const count = ctx.parsed;
            const pct = total ? ((count / total) * 100).toFixed(1) : '0.0';
            return `${ctx.label}: ${count} (${pct}%)`;
          },
        },
      },
    },
  } as const;

  return (
    <div>
      <div className="text-sm text-gray-600 mb-2">Total practitioners: <span className="font-semibold text-gray-900">{total.toLocaleString()}</span></div>
      <div className="h-64">
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
}


