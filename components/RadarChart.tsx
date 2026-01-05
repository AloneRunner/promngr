import React, { useEffect, useState } from 'react';

interface RadarChartProps {
    stats: {
        label: string;
        value: number;
        fullMark: number;
    }[];
    color?: string;
    size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({ stats, color = '#10b981', size = 300 }) => {
    const [animatedValues, setAnimatedValues] = useState<number[]>(stats.map(() => 0));

    useEffect(() => {
        // Simple animation on mount
        const timer = setTimeout(() => {
            setAnimatedValues(stats.map(s => s.value));
        }, 100);
        return () => clearTimeout(timer);
    }, [stats]);

    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    }

    const viewBoxSize = size + 100; // Add padding for labels
    const center = viewBoxSize / 2;
    const radius = size / 2;
    const angleStep = 360 / stats.length;

    // Background Grid (Concentric Hexagons)
    const gridLevels = 4;
    const gridPolygons = [];
    for (let i = 1; i <= gridLevels; i++) {
        const levelRadius = (radius / gridLevels) * i;
        const points = stats.map((_, index) => {
            const { x, y } = polarToCartesian(center, center, levelRadius, index * angleStep);
            return `${x},${y}`;
        }).join(' ');

        gridPolygons.push(
            <polygon
                key={`grid-${i}`}
                points={points}
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1"
            />
        );
    }

    // Data Polygon
    const dataPoints = stats.map((stat, index) => {
        const valueRatio = Math.min(Math.max(animatedValues[index] / stat.fullMark, 0), 1);
        const { x, y } = polarToCartesian(center, center, radius * valueRatio, index * angleStep);
        return `${x},${y}`;
    }).join(' ');

    // Axis Lines and Labels
    const axes = stats.map((stat, index) => {
        const { x, y } = polarToCartesian(center, center, radius, index * angleStep);
        const labelPos = polarToCartesian(center, center, radius + 25, index * angleStep);

        return (
            <g key={`axis-${index}`}>
                <line x1={center} y1={center} x2={x} y2={y} stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
                <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(255, 255, 255, 0.6)"
                    fontSize="11"
                    fontWeight="600"
                    className="uppercase tracking-wider"
                >
                    {stat.label}
                </text>
                <text
                    x={labelPos.x}
                    y={labelPos.y + 12}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={color}
                    fontSize="10"
                    fontWeight="bold"
                >
                    {Math.round(animatedValues[index])}
                </text>
            </g>
        );
    });

    return (
        <div className="flex justify-center items-center w-full">
            <svg width="100%" height="auto" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} style={{ maxWidth: size + 60 }}>
                {gridPolygons}
                <polygon
                    points={dataPoints}
                    fill={color}
                    fillOpacity="0.3"
                    stroke={color}
                    strokeWidth="2"
                    className="transition-all duration-1000 ease-out"
                />
                {axes}
            </svg>
        </div>
    );
};
