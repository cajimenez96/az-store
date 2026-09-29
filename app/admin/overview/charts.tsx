'use client';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const Charts = ({
  data: { salesData },
}: {
  data: { salesData: { month: string; totalSales: number }[] };
}) => {
  return (
    <ResponsiveContainer width='100%' height={320}>
      <BarChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis
          dataKey='month'
          stroke='#707072'
          fontSize={11}
          tickLine={false}
          axisLine={false}
          className='uppercase font-medium'
        />
        <YAxis
          stroke='#707072'
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ventas']}
          contentStyle={{
            backgroundColor: '#111111',
            borderRadius: '12px',
            border: 'none',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 500,
          }}
          itemStyle={{ color: '#ffffff' }}
          labelStyle={{ color: '#9e9ea0', marginBottom: '4px' }}
        />
        <Bar
          dataKey='totalSales'
          fill='#111111'
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default Charts;
