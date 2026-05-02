import React, { memo, useState } from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { FiChevronDown } from 'react-icons/fi';
import './interactiveWidgets.css';

interface IChartDataPoint {
    name: string;
    [key: string]: string | number;
}

interface ILiveChartProps {
    data: IChartDataPoint[];
    dataKeys: string[];
    colors?: string[];
}

const DEFAULT_COLORS = ['#7081fd', '#e93939', '#2ecc71', '#f1c40f'];

const dataFormatter = (value: number | string, keyName?: string): string => {
    const numValue = Number(value);

    if (isNaN(numValue)) return String(value);

    const key = (keyName || '').toLowerCase();

    if (key.includes('revenue') || key.includes('price') || key.includes('cost') || key.includes('sales'))
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
            numValue,
        );

    if (key.includes('percent') || key.includes('rate') || key.includes('margin')) return `${numValue}%`;

    return new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(numValue);
};

const getDefaultChartType = (data: IChartDataPoint[]): 'line' | 'bar' => {
    if (!data || data.length === 0) return 'line';

    if (data.length > 7) return 'line';

    const firstX = String(data[0].name).toLowerCase();
    const timePatterns = [
        /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/,
        /^(mon|tue|wed|thu|fri|sat|sun)/,
        /^20\d{2}$/,
        /^q[1-4]$/,
    ];

    const isTimeBased = timePatterns.some((pattern) => pattern.test(firstX));
    return isTimeBased ? 'line' : 'bar';
};

const DataVisualizer = ({ data, dataKeys, colors = DEFAULT_COLORS }: ILiveChartProps) => {
    const [chartType, setChartType] = useState<'line' | 'bar'>(() => getDefaultChartType(data));

    if (!data || data.length === 0) return <div className="response-error">Invalid chart data provided.</div>;

    const dynamicTitle = dataKeys.length > 0 ? dataKeys.join(' vs ') : 'Data Overview';

    const commonAxisProps = {
        stroke: 'var(--light-text-clr)',
        tick: { fontSize: 12, fill: 'var(--light-text-clr)' },
    };

    return (
        <div className="chart-widget">
            <div className="chart-header">
                <span style={{ textTransform: 'capitalize', letterSpacing: '0.5px' }}>{dynamicTitle}</span>
                <div className="chart-select-wrapper">
                    <select
                        value={chartType}
                        onChange={(e) => setChartType(e.target.value as 'line' | 'bar')}
                        className="chart-select"
                    >
                        <option value="line">Line Chart</option>
                        <option value="bar">Bar Chart</option>
                    </select>
                    <FiChevronDown className="chart-select-icon" />
                </div>
            </div>

            <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'line' ? (
                        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />

                            <XAxis dataKey="name" {...commonAxisProps} />

                            <YAxis {...commonAxisProps} tickFormatter={(val) => dataFormatter(val, dataKeys[0])} />

                            <Tooltip
                                cursor={{ fill: 'var(--fill-muted)' }}
                                contentStyle={{
                                    backgroundColor: 'var(--components-bg)',
                                    borderColor: 'var(--border-glass)',
                                    color: 'var(--text-clr)',
                                    borderRadius: '8px',
                                }}
                                formatter={(value: number, name: string) => [dataFormatter(value, name), name]}
                            />

                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

                            {dataKeys.map((key, index) => (
                                <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={2}
                                    activeDot={{ r: 6, fill: 'var(--bg-clr)', stroke: colors[index % colors.length] }}
                                />
                            ))}
                        </LineChart>
                    ) : (
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />

                            <XAxis dataKey="name" {...commonAxisProps} />

                            <YAxis {...commonAxisProps} tickFormatter={(val) => dataFormatter(val, dataKeys[0])} />

                            <Tooltip
                                cursor={{ fill: 'var(--fill-muted)' }}
                                contentStyle={{
                                    backgroundColor: 'var(--components-bg)',
                                    borderColor: 'var(--border-glass)',
                                    color: 'var(--text-clr)',
                                    borderRadius: '8px',
                                }}
                                formatter={(value: number, name: string) => [dataFormatter(value, name), name]}
                            />

                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

                            {dataKeys.map((key, index) => (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    fill={colors[index % colors.length]}
                                    radius={[4, 4, 0, 0]}
                                />
                            ))}
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default memo(DataVisualizer);
