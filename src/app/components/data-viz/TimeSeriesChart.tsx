import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale, TooltipItem } from 'chart.js';

ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale);

interface TimeSeriesChartProps {
    style?: React.CSSProperties;
    data: { period: string; Positive: number; Neutral: number; Negative: number }[]; // Data format for sentiment trends
}

export default function TimeSeriesChart({ style, data }: TimeSeriesChartProps) {
    // Extract labels and datasets from the input data
    const labels = data.map((entry) => entry.period); // Periods as labels (e.g., Q1, Q2, Q3, ...)
    const positiveData = data.map((entry) => entry.Positive);
    const neutralData = data.map((entry) => entry.Neutral);
    const negativeData = data.map((entry) => entry.Negative);

    const chartData = {
        labels, // Labels for the x-axis
        datasets: [
            {
                label: 'Positive',
                data: positiveData,
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                borderColor: '#4CAF50',
                borderWidth: 2,
                fill: true,
            },
            {
                label: 'Neutral',
                data: neutralData,
                backgroundColor: 'rgba(158, 158, 158, 0.2)',
                borderColor: '#9E9E9E',
                borderWidth: 2,
                fill: true,
            },
            {
                label: 'Negative',
                data: negativeData,
                backgroundColor: 'rgba(244, 67, 54, 0.2)',
                borderColor: '#F44336',
                borderWidth: 2,
                fill: true,
            },
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
            tooltip: {
                callbacks: {
                    label: function (tooltipItem: TooltipItem<'line'>) {
                        return `${tooltipItem.dataset.label}: ${tooltipItem.raw}`;
                    },
                },
            },
        },
    };

    return (
        <div style={style}>
            <div style={{ position: 'relative', width: '100%', height: '95%' }}>
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
}
