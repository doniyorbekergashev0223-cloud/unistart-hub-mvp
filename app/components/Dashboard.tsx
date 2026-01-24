"use client";

import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import StatisticsCards from './StatisticsCards';
import DashboardCharts from './DashboardCharts';
import ProjectTable from './ProjectTable';
import '../styles/Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-main">
        <Topbar />
        <div className="dashboard-content">
          <StatisticsCards />
          <DashboardCharts />
          <ProjectTable />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;