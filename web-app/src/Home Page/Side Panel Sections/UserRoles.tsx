// EvacuationRoutes.tsx
import React, { useState, useEffect } from "react";

type FilterType = "All users" | "Active" | "Disabled" | "Deleted";

const UserRoles: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("All users");
  const [isChecked, setIsChecked] = useState(false);
  const [isRouteChecked, setIsRouteChecked] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const [isSpinning, setIsSpinning] = useState(false);

  const handleRefreshClick = () => {
    setIsSpinning(true);
    setTimeout(() => setIsSpinning(false), 1000); // Stop spinning after 1 second
  };

  // Count state variables
  const [allRoutesCount, setAllRoutesCount] = useState<number>(0);
  const [savedCount, setSavedCount] = useState<number>(0);
  const [underReviewCount, setUnderReviewCount] = useState<number>(0);
  const [publishedCount, setPublishedCount] = useState<number>(0);
  const [unpublishedCount, setUnpublishedCount] = useState<number>(0);
  const [deletedCount, setDeletedCount] = useState<number>(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showSortDropdown &&
        !(event.target as Element).closest(".tune-button-container")
      ) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSortDropdown]);

  const counts: Record<FilterType, number> = {
    "All users": allRoutesCount,
    Active: savedCount,
    Disabled: deletedCount,
    Deleted: deletedCount,
  };

  const filterColors: Record<FilterType, string> = {
    "All users": "#F9FFB1",
    Active: "#BCFFB1",
    Disabled: "#F8CFFF",
    Deleted: "#FFCFD0",
  };

  const filterTextColors: Record<FilterType, string> = {
    "All users": "#759100",
    Active: "#207F13",
    Disabled: "#9A06B3",
    Deleted: "#C20004",
  };

  const handleSimulationClick = () => {
    window.open("/simulation-tool", "_blank");
  };

  const filterOptions: FilterType[] = [
    "All users",
    "Active",
    "Disabled",
    "Deleted",
  ];

  const handleFilterClick = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const updateCount = (filter: FilterType, value: number) => {
    switch (filter) {
      case "All users":
        setAllRoutesCount(value);
        break;
      case "Active":
        setSavedCount(value);
        break;
      case "Disabled":
        setDeletedCount(value);
        break;
      case "Disabled":
        setDeletedCount(value);
        break;
    }
  };

  return (
    <div className="evacuation-routes-container">
      <div className="header-section-userRoles">
        <span className="material-icons user-icon">account_circle</span>
        <h1 className="evacuation-routes-title">User Management</h1>
      </div>
      <div className="divider-section">
        <div className="filter-section">
          <button
            className={`refresh-button ${isSpinning ? "spinning" : ""}`}
            onClick={handleRefreshClick}
          >
            <span className="material-icons">refresh</span>
          </button>

          {/* Search Bar */}
          <div className="search-bar">
            <input type="text" placeholder="Search users..." />
            <button className="search-button">
              <span className="material-icons">search</span>
            </button>
          </div>

          <div className="filter-options">
            {filterOptions.map((filter) => (
              <div key={filter} className="filter-option-container">
                <span
                  className={`filter-option-userRoles ${
                    activeFilter === filter ? "active" : ""
                  }`}
                  onClick={() => handleFilterClick(filter)}
                >
                  {filter}
                </span>
                <div
                  className="count-rectangle"
                  style={{
                    backgroundColor: filterColors[filter],
                    color: filterTextColors[filter],
                  }}
                >
                  {counts[filter]}
                </div>
              </div>
            ))}
          </div>
          <div className="icon-buttons-group">
            <div className="tune-button-container">
              <button
                className="tune-button"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
              >
                <span className="material-icons">tune</span>
              </button>
              {showSortDropdown && (
                <div className="sort-dropdown">
                  <button className="sort-option">Latest</button>
                  <button className="sort-option">Oldest</button>
                </div>
              )}
            </div>

            <button className="publish-route-button">
              <span className="material-icons">publish</span>
            </button>
            <button className="delete-button">
              <span className="material-icons">delete_outline</span>
            </button>
          </div>
        </div>
        <hr className="divider-line" />
        <div className="dark-rectangle">
          <span
            className="material-icons checkbox-icon"
            onClick={() => setIsChecked(!isChecked)}
          >
            {isChecked ? "check_box" : "check_box_outline_blank"}
          </span>
          <span className="route-id-text">Display Name</span>
          <div className="info-category-texts-set1">
            <span className="username-text">Username</span>
            <span className="email-text">Email</span>
          </div>
          <span className="signin-method-text">Sign in Method</span>
          <span className="date-created-text">Date Created</span>
          <span className="created-by-text">Status</span>
        </div>

        <div className="scrollable-list">
          {Array.from({ length: 20 }).map((_, index) => (
            <div key={index} className="white-rectangle">
              <span
                className="route-checkbox material-icons checkbox-icon"
                onClick={() => setIsChecked(!isChecked)}
              >
                {isChecked ? "check_box" : "check_box_outline_blank"}
              </span>
              <span className="route-id">John Doe</span>
              <div className="route-info-category-set1">
                <span className="username">johndoe28</span>
                <span className="hazard-report-description">
                  john_doe@sample.com
                </span>
              </div>
              <span className="email">Email, Password</span>
              <span className="date-created-user">10-01-2024</span>
              <span className="status-container disabled-status">Disabled</span>
              <button className="more-options-button">
                <span
                  className="material-icons"
                  style={{ fontSize: "24px", color: "black" }}
                >
                  more_horiz
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserRoles;
