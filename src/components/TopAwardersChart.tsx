'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BeltSystemAPI } from '../lib/api';
import { beltColors, beltOrder, getBeltDisplayName } from '../lib/utils';
import type { BJJBelt, RankInformation } from '../types/api';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CORE_BELTS: BJJBelt[] = ['White', 'Blue', 'Purple', 'Brown', 'Black'];

export function TopAwardersChart({ days = 90, limit = 10 }: { days?: number; limit?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['top-awarders-stacked', days, limit],
    queryFn: async () => {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      const belts = await BeltSystemAPI.getBelts({
        from: fromDate.toISOString(),
        to: new Date().toISOString(),
        limit: 2000,
        order_by: 'date',
        order: 'desc',
      });

      // Count per awarder per belt category (aggregate post-Black as Senior Ranks)
      const counts = new Map<string, Map<BJJBelt | 'Senior Ranks', number>>();
      const totals = new Map<string, number>();

      const isSenior = (belt: BJJBelt) => beltOrder.indexOf(belt) > beltOrder.indexOf('Black');

      for (const b of belts as RankInformation[]) {
        const awarder = b.awarded_by_profile_id;
        // Ignore self-awarded belts
        if (!awarder || b.achieved_by_profile_id === awarder) continue;
        const bucket: BJJBelt | 'Senior Ranks' = isSenior(b.belt) ? 'Senior Ranks' : b.belt;
        const inner = counts.get(awarder) || new Map<BJJBelt | 'Senior Ranks', number>();
        inner.set(bucket, (inner.get(bucket) || 0) + 1);
        counts.set(awarder, inner);
        totals.set(awarder, (totals.get(awarder) || 0) + 1);
      }

      // Top awarders by total
      const sortedAwarders = Array.from(totals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);

      // Resolve names
      const names = await Promise.all(
        sortedAwarders.map(async (id) => {
          try {
            return (await BeltSystemAPI.resolveProfileName(id)) || id;
          } catch {
            return id;
          }
        })
      );

      return { awarderIds: sortedAwarders, awarderNames: names, counts };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data || data.awarderIds.length === 0) {
    return <div className="flex items-center justify-center h-64 text-gray-500">No data available</div>;
  }

  const labels = data.awarderNames;
  const beltKeys: (BJJBelt | 'Senior Ranks')[] = [...CORE_BELTS, 'Senior Ranks'];

  const datasets = beltKeys.map((bk) => {
    const backgroundColor =
      bk === 'Senior Ranks' ? '#6B7280' : beltColors[bk as BJJBelt];
    const borderColor = bk === 'White' ? '#111827' : backgroundColor;
    const borderWidth = bk === 'White' ? 2 : 1;
    return {
      label: bk === 'Senior Ranks' ? 'Senior Ranks' : getBeltDisplayName(bk as BJJBelt),
      data: data.awarderIds.map((id) => data.counts.get(id)?.get(bk) || 0),
      backgroundColor,
      borderColor,
      borderWidth,
      stack: 'belts',
    };
  });

  const chartData = {
    labels,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${context.parsed.y}`;
          },
        },
      },
      title: { display: false },
    },
    scales: {
      y: { beginAtZero: true, stacked: true, ticks: { precision: 0 } },
      x: { stacked: true, ticks: { maxRotation: 45, minRotation: 0 } },
    },
  } as const;

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}


