'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BeltSystemAPI } from '../lib/api';
import { beltOrder, getBeltDisplayName, beltColors } from '../lib/utils';
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

function monthsBetween(startISO: string, endISO: string): number {
  const start = new Date(startISO).getTime();
  const end = new Date(endISO).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) return 0;
  const days = (end - start) / (1000 * 60 * 60 * 24);
  return days / 30.44; // average month length
}

type Averages = {
  includeOpen: number[]; // includes those not yet promoted (uses now)
  excludeOpen: number[]; // excludes those not yet promoted
  labels: string[];
};

function computeAverages(belts: RankInformation[]): Averages {
  // Build timelines per practitioner
  const byPractitioner = new Map<string, RankInformation[]>();
  for (const r of belts) {
    const arr = byPractitioner.get(r.achieved_by_profile_id) || [];
    arr.push(r);
    byPractitioner.set(r.achieved_by_profile_id, arr);
  }
  for (const [, arr] of byPractitioner) {
    arr.sort((a, b) => new Date(a.achievement_date).getTime() - new Date(b.achievement_date).getTime());
  }

  const includeSums = new Map<BJJBelt, { total: number; count: number }>();
  const excludeSums = new Map<BJJBelt, { total: number; count: number }>();
  const nowISO = new Date().toISOString();

  for (const belt of CORE_BELTS) {
    includeSums.set(belt, { total: 0, count: 0 });
    excludeSums.set(belt, { total: 0, count: 0 });
  }

  // For each practitioner, compute time at each core belt
  for (const [, timeline] of byPractitioner) {
    // Deduplicate: keep earliest date per belt
    const earliestPerBelt = new Map<BJJBelt, string>();
    for (const r of timeline) {
      if (!CORE_BELTS.includes(r.belt)) continue;
      if (!earliestPerBelt.has(r.belt)) earliestPerBelt.set(r.belt, r.achievement_date);
    }

    // For each belt, find next higher belt date if present
    for (const belt of CORE_BELTS) {
      const start = earliestPerBelt.get(belt);
      if (!start) continue;

      const currentLevel = CORE_BELTS.indexOf(belt);
      let nextDate: string | undefined;
      // Search in full timeline (including senior ranks) for any higher-level belt
      for (const r of timeline) {
        const idx = beltOrder.indexOf(r.belt);
        if (idx > beltOrder.indexOf(belt)) {
          nextDate = r.achievement_date;
          break;
        }
      }

      // Include-open metric: use now if no next promotion
      const includeMonths = monthsBetween(start, nextDate || nowISO);
      const includeAgg = includeSums.get(belt)!;
      includeAgg.total += includeMonths;
      includeAgg.count += 1;

      // Exclude-open metric: only if we have a next promotion
      if (nextDate) {
        const excludeMonths = monthsBetween(start, nextDate);
        const excludeAgg = excludeSums.get(belt)!;
        excludeAgg.total += excludeMonths;
        excludeAgg.count += 1;
      }
    }
  }

  const labels = CORE_BELTS.map(getBeltDisplayName);
  const includeOpen = CORE_BELTS.map((b) => {
    const s = includeSums.get(b)!;
    return s.count ? Number((s.total / s.count).toFixed(1)) : 0;
    
  });
  const excludeOpen = CORE_BELTS.map((b) => {
    const s = excludeSums.get(b)!;
    return s.count ? Number((s.total / s.count).toFixed(1)) : 0;
  });

  return { labels, includeOpen, excludeOpen };
}

export function AverageTimeAtBeltChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['avg-time-at-belt'],
    queryFn: async () => {
      // Fetch a large sample to approximate across network
      const belts = await BeltSystemAPI.getBelts({ limit: 5000, order_by: 'achievement_date', order: 'asc' });
      return belts;
    },
  });

  const averages = useMemo(() => (data ? computeAverages(data) : undefined), [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (!averages) {
    return <div className="flex items-center justify-center h-64 text-gray-500">No data available</div>;
  }

  // Helper to convert hex to rgba with alpha
  const hexToRgba = (hex: string, alpha: number): string => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const includeColors = CORE_BELTS.map((b) => hexToRgba(beltColors[b], 0.35));
  const excludeColors = CORE_BELTS.map((b) => hexToRgba(beltColors[b], 0.85));
  const includeBorders = CORE_BELTS.map((b) => (b === 'White' ? '#111827' : 'transparent'));
  const excludeBorders = CORE_BELTS.map((b) => (b === 'White' ? '#111827' : 'transparent'));

  const chartData = {
    labels: averages.labels,
    datasets: [
      {
        label: 'Including Not Yet Promoted',
        data: averages.includeOpen,
        backgroundColor: includeColors,
        borderColor: includeBorders,
        borderWidth: 2,
        grouped: false,
        barThickness: 24,
      },
      {
        label: 'Excluding Not Yet Promoted',
        data: averages.excludeOpen,
        backgroundColor: excludeColors,
        borderColor: excludeBorders,
        borderWidth: 2,
        grouped: false,
        barThickness: 14,
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
            return `${ctx.dataset.label}: ${ctx.parsed.y} months`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Average months at belt' },
        ticks: { precision: 0 },
      },
    },
  } as const;

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}


