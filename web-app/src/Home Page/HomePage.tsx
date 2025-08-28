import React, { useState } from "react";
import "./HomePage.css";
import Dashboard from "./Side Panel Sections/Dashboard";
import EvacuationRoutes from "./Side Panel Sections/EvacuationRoutes";
import HazardReports from "./Side Panel Sections/HazardReports";
import UserRoles from "./Side Panel Sections/UserRoles";

const HomePage: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedOption, setSelectedOption] = useState("Dashboard");
  const userName = "Antipolo DRRMO";

  const sidebarOptions = [
    { name: "Dashboard", icon: "home" },
    { name: "Evacuation Routes", icon: "route" },
    { name: "Hazard Reports", icon: "report" },
    { name: "User Management", icon: "account_circle" },
  ];

  const bottomOptions = [
    { name: "Help", icon: "help_outline" },
    { name: "Settings", icon: "settings" },
  ];

  const renderContent = () => {
    switch (selectedOption) {
      case "Dashboard":
        return <Dashboard userName={userName} />;
      case "Evacuation Routes":
        return <EvacuationRoutes />;
      case "Hazard Reports":
        return <HazardReports />;
      case "User Management":
        return <UserRoles />;
      default:
        return <Dashboard userName={userName} />;
    }
  };

  return (
    <div className="home-page-container">
      <div className="home-side-panel">
        <div className="sidebar-main-content">
          <div className="logo-container">
            <img
              src="logo/SafePath-Logos.png"
              alt="SafePath Logo"
              className="logo-image"
            />
            <img
              src="logo/SafePath-Text-ForLightBG.png"
              alt="SafePath Text"
              className="logo-text"
            />
          </div>
          <div className="menu-label">Main Menu</div>
          {sidebarOptions.map((option) => (
            <div
              key={option.name}
              className={`sidebar-option ${
                selectedOption === option.name ? "selected" : ""
              }`}
              onClick={() => setSelectedOption(option.name)}
            >
              <span className="material-icons sidebar-icon">{option.icon}</span>
              {option.name}
            </div>
          ))}
        </div>
        <div className="sidebar-bottom-options">
          {bottomOptions.map((option) => (
            <div key={option.name} className="bottom-option">
              <span className="material-icons sidebar-icon">{option.icon}</span>
              {option.name}
            </div>
          ))}
          <div className="gradient-container">
            <div className="mobile-app-section">
              <span className="material-icons">phone_android</span>
              <div className="mobile-app-text">
                <div className="get-app-text">Get the mobile app</div>
                <button className="download-button">Download Now</button>
              </div>
            </div>
          </div>
          <div className="profile-section">
            <div className="profile-image-placeholder"></div>
            <div className="profile-info">
              <div className="profile-name">{userName}</div>
              <button className="sign-out-button">Sign out</button>
            </div>
            <span className="material-icons manage-account-icon">
              manage_accounts
            </span>
          </div>
        </div>
      </div>
      <div className="content-area">
        <button
          className="notification-button"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <span className="material-icons">notifications_none</span>
        </button>
        <div
          className={`notification-container ${
            showNotifications ? "show" : ""
          }`}
        >
          <button
            className="close-notification-button"
            onClick={() => setShowNotifications(false)}
          >
            <span className="material-icons">arrow_forward_ios</span>
          </button>
        </div>
        <div className="home-search-bar">
          <button className="home-search-button">
            <span className="material-icons">search</span>
          </button>
          <input type="text" placeholder="Search" />
        </div>
        {renderContent()}
      </div>
    </div>
  );
};
export default HomePage;
