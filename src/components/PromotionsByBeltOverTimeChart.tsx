'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BeltSystemAPI } from '../lib/api';
import { beltColors, beltOrder, getBeltDisplayName } from '../lib/utils';
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
import type { BJJBelt, RankInformation } from '../types/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function monthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function PromotionsByBeltOverTimeChart({ months = 12 }: { months?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['promotions-by-belt-over-time', months],
    queryFn: async () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(end.getMonth() - (months - 1));

      // Fetch a large number and rely on server-side ordering
      const belts = await BeltSystemAPI.getBelts({
        from: new Date(start.getFullYear(), start.getMonth(), 1).toISOString(),
        to: new Date(end.getFullYear(), end.getMonth() + 1, 0).toISOString(),
        limit: 2000,
        order_by: 'achievement_date',
        order: 'asc',
      });
      return belts;
    },
  });

  const { labels, datasets } = useMemo(() => {
    const result = { labels: [] as string[], datasets: [] as any[] };
    if (!data || data.length === 0) return result;

    // Build the month range labels
    const end = new Date();
    const start = new Date();
    start.setMonth(end.getMonth() - (months - 1));
    const keys: string[] = [];
    for (
      let y = start.getFullYear(), m = start.getMonth();
      y < end.getFullYear() || (y === end.getFullYear() && m <= end.getMonth());
      m++
    ) {
      const date = new Date(y, m, 1);
      keys.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
      if (m === 11) { y++; m = -1; }
    }

    // Initialize counters per belt per month
    const counters = new Map<string, Map<BJJBelt, number>>();
    for (const key of keys) {
      const inner = new Map<BJJBelt, number>();
      for (const belt of beltOrder) inner.set(belt, 0);
      counters.set(key, inner);
    }

    // Count promotions per month per belt
    for (const b of data as RankInformation[]) {
      const key = monthKey(b.achievement_date);
      const month = counters.get(key);
      if (!month) continue;
      month.set(b.belt, (month.get(b.belt) || 0) + 1);
    }

    // Build datasets: show core ranks explicitly, aggregate all beyond Black as one series
    const coreBelts: BJJBelt[] = ['White', 'Blue', 'Purple', 'Brown', 'Black'];
    const seniorBelts: BJJBelt[] = beltOrder.slice(beltOrder.indexOf('Black') + 1);

    const datasets = [
      ...coreBelts.map((belt) => ({
        label: getBeltDisplayName(belt),
        data: keys.map((k) => counters.get(k)?.get(belt) || 0),
        backgroundColor: beltColors[belt],
        borderColor: beltColors[belt],
        borderWidth: 1,
        stack: 'belts',
      })),
    ];

    // Aggregate senior ranks (Black degrees and Red variants)
    const seniorData = keys.map((k) => {
      const month = counters.get(k);
      if (!month) return 0;
      let sum = 0;
      for (const b of seniorBelts) {
        sum += month.get(b) || 0;
      }
      return sum;
    });

    datasets.push({
      label: 'Senior Ranks',
      data: seniorData,
      backgroundColor: '#6B7280', // gray-500
      borderColor: '#4B5563', // gray-600
      borderWidth: 1,
      stack: 'belts',
    });

    return { labels: keys, datasets };
  }, [data, months]);

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

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const },
      tooltip: { enabled: true },
    },
    scales: {
      y: { beginAtZero: true, stacked: true, ticks: { precision: 0 } },
      x: { stacked: true },
    },
  } as const;

  return (
    <div className="h-64">
      <Bar data={{ labels, datasets }} options={options} />
    </div>
  );
}


