'use client';
import { useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

export { Bar, Doughnut, Line } from 'react-chartjs-2';

export const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#9CA3AF',
        font: { family: 'DM Sans' }
      }
    },
    tooltip: {
      backgroundColor: '#1F2937',
      titleColor: '#F9FAFB',
      bodyColor: '#F9FAFB',
      borderColor: '#374151',
      borderWidth: 1,
    }
  },
  scales: {
    x: {
      ticks: { color: '#6B7280' },
      grid: { color: '#374151' }
    },
    y: {
      ticks: { color: '#6B7280' },
      grid: { color: '#374151' }
    }
  }
};
