'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BeltSystemAPI } from '../lib/api';
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

type TopAwarder = { id: string; name: string; count: number };

export function TopAwardersChart({ days = 90, limit = 10 }: { days?: number; limit?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['top-awarders', days, limit],
    queryFn: async () => {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      const belts = await BeltSystemAPI.getBelts({
        from: fromDate.toISOString(),
        to: new Date().toISOString(),
        limit: 1000,
        order_by: 'achievement_date',
        order: 'desc',
      });

      const counts = new Map<string, number>();
      for (const b of belts) {
        const id = b.awarded_by_profile_id;
        if (!id) continue;
        counts.set(id, (counts.get(id) || 0) + 1);
      }

      const sorted = Array.from(counts.entries())
        .map(([id, count]) => ({ id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      const names = await Promise.all(
        sorted.map(async (x) => {
          try {
            const name = await BeltSystemAPI.resolveProfileName(x.id);
            return name || x.id;
          } catch {
            return x.id;
          }
        })
      );

      const result: TopAwarder[] = sorted.map((x, i) => ({ id: x.id, name: names[i], count: x.count }));
      return result;
    },
  });

  const labels = useMemo(() => (data ? data.map((d) => d.name) : []), [data]);
  const counts = useMemo(() => (data ? data.map((d) => d.count) : []), [data]);

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

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Promotions Awarded',
        data: counts,
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `Count: ${context.parsed.y}`;
          },
        },
      },
      title: { display: false },
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
      x: { ticks: { maxRotation: 45, minRotation: 0 } },
    },
  } as const;

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}


