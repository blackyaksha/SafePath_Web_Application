// Dashboard.tsx
import React from "react";

interface DashboardProps {
  userName: string;
}

const Dashboard: React.FC<DashboardProps> = ({ userName }) => {
  return (
    <div className="dashboard-container">
      <div className="welcome-container">
        <div className="welcome-text">Welcome Back,</div>
        <div className="welcome-name">{userName}</div>
      </div>
      {/* Add other dashboard-specific content here */}
    </div>
  );
};

export default Dashboard;
