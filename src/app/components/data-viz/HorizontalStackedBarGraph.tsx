import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend, TooltipItem } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

interface HorizontalStackedBarGraphProps {
    tagCounts: { [key: string]: { positive: number; neutral: number; negative: number } };
    style?: React.CSSProperties;
}


const HorizontalStackedBarGraph: React.FC<HorizontalStackedBarGraphProps> = ({ tagCounts, style }) => {
    // Transform `tagCounts` into Chart.js format
    console.log("Tag Counts in Chart Component:", tagCounts);
    
    const labels = Object.keys(tagCounts);
    const datasets = [
        {
            label: 'Positive',
            data: labels.map((tag) => tagCounts[tag].positive),
            backgroundColor: '#4CAF50',
        },
        {
            label: 'Neutral',
            data: labels.map((tag) => tagCounts[tag].neutral),
            backgroundColor: '#9E9E9E',
        },
        {
            label: 'Negative',
            data: labels.map((tag) => tagCounts[tag].negative),
            backgroundColor: '#F44336',
        },
    ];

    const data = { labels, datasets };

    console.log("Chart Data:", { labels, datasets });

    const options = {
        responsive: true,
        indexAxis: 'y' as const,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            tooltip: {
                callbacks: {
                    label: function (tooltipItem: TooltipItem<'bar'>) {
                        const label = tooltipItem.dataset.label || '';
                        const value = tooltipItem.raw;
                        return `${label}: ${value}`;
                    },
                },
            },
        },
        scales: {
            x: {
                stacked: true,
                display: false,
            },
            y: {
                stacked: true,
                barThickness: 30,
            },
        },
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
            <Bar data={data} options={options} />
        </div>
    );
};

export default HorizontalStackedBarGraph;
