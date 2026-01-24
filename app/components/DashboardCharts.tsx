"use client";

import React from 'react';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useProjects } from '../context/ProjectsContext';

const DashboardCharts = () => {
  const { projects } = useProjects();

  // Calculate project status distribution
  const statusCounts = {
    'Jarayonda': projects.filter(p => p.status === 'Jarayonda').length,
    'Qabul qilindi': projects.filter(p => p.status === 'Qabul qilindi').length,
    'Rad etildi': projects.filter(p => p.status === 'Rad etildi').length,
  };

  // Mock time series data (using existing project counts)
  const totalProjects = projects.length;
  const activeProjects = statusCounts['Jarayonda'];
  
  // Generate mock monthly data for line chart
  const lineData = [
    { month: 'Yanvar', loyihalar: Math.floor(totalProjects * 0.3) },
    { month: 'Fevral', loyihalar: Math.floor(totalProjects * 0.5) },
    { month: 'Mart', loyihalar: Math.floor(totalProjects * 0.7) },
    { month: 'Aprel', loyihalar: Math.floor(totalProjects * 0.85) },
    { month: 'May', loyihalar: totalProjects },
    { month: 'Iyun', loyihalar: totalProjects },
  ];

  // Pie chart data
  const pieData = [
    { name: 'Jarayonda', value: statusCounts['Jarayonda'], color: '#f97316' },
    { name: 'Qabul qilindi', value: statusCounts['Qabul qilindi'], color: '#10b981' },
    { name: 'Rad etildi', value: statusCounts['Rad etildi'], color: '#ef4444' },
  ].filter(item => item.value > 0);

  return (
    <div className="charts-section">
      <h2 className="charts-section-title">
        📊 Statistika va tahlil
      </h2>
      
      <div className="charts-grid">
        {/* Line Chart */}
        <div className="chart-card">
          <h3 className="chart-title">Loyihalar o'sishi</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(226, 232, 240, 0.4)',
                  borderRadius: '12px',
                  padding: '12px',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="loyihalar" 
                stroke="#f97316" 
                strokeWidth={3}
                dot={{ fill: '#f97316', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="chart-card">
          <h3 className="chart-title">Loyiha holati taqsimoti</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(226, 232, 240, 0.4)',
                  borderRadius: '12px',
                  padding: '12px',
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '14px', color: '#64748b' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
