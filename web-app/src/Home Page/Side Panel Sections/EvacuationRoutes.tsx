// EvacuationRoutes.tsx
import React, { useState, useEffect } from "react";

type FilterType =
  | "All Optimized Routes"
  | "Saved"
  | "Under Review"
  | "Published"
  | "Unpublished"
  | "Deleted";

const EvacuationRoutes: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>(
    "All Optimized Routes"
  );
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
    "All Optimized Routes": allRoutesCount,
    Saved: savedCount,
    "Under Review": underReviewCount,
    Published: publishedCount,
    Unpublished: unpublishedCount,
    Deleted: deletedCount,
  };

  const filterColors: Record<FilterType, string> = {
    "All Optimized Routes": "#F9FFB1",
    Saved: "#BCFFB1",
    "Under Review": "#FFDEB1",
    Published: "#B1DEFF",
    Unpublished: "#F8CFFF",
    Deleted: "#FFCFD0",
  };

  const filterTextColors: Record<FilterType, string> = {
    "All Optimized Routes": "#759100",
    Saved: "#207F13",
    "Under Review": "#C1670D",
    Published: "#194EAA",
    Unpublished: "#9A06B3",
    Deleted: "#C20004",
  };

  const handleSimulationClick = () => {
    window.open("/simulation-tool", "_blank");
  };

  const filterOptions: FilterType[] = [
    "All Optimized Routes",
    "Saved",
    "Under Review",
    "Published",
    "Unpublished",
    "Deleted",
  ];

  const handleFilterClick = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const updateCount = (filter: FilterType, value: number) => {
    switch (filter) {
      case "All Optimized Routes":
        setAllRoutesCount(value);
        break;
      case "Saved":
        setSavedCount(value);
        break;
      case "Under Review":
        setUnderReviewCount(value);
        break;
      case "Published":
        setPublishedCount(value);
        break;
      case "Unpublished":
        setUnpublishedCount(value);
        break;
      case "Deleted":
        setDeletedCount(value);
        break;
    }
  };

  return (
    <div className="evacuation-routes-container">
      <div className="header-section-hazardReports">
        <div className="header-title">
          <span className="material-icons report-icon">route</span>
          <h1 className="evacuation-routes-title">Evacuation Routes</h1>
        </div>
        <button
          className="simulation-button hover:bg-[#646362]"
          onClick={handleSimulationClick}
        >
          Open Simulation Tool
          <span className="material-icons">arrow_outward</span>
        </button>
      </div>

      <div className="divider-section">
        <div className="filter-section">
          <button
            className={`refresh-button ${isSpinning ? "spinning" : ""}`}
            onClick={handleRefreshClick}
          >
            <span className="material-icons">refresh</span>
          </button>
          <div className="filter-options">
            {filterOptions.map((filter) => (
              <div key={filter} className="filter-option-container">
                <span
                  className={`filter-option ${
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
          <span className="route-id-text">Route ID</span>
          <div className="info-category-texts-set1">
            <span className="starting-location-text">Starting Location</span>
            <span className="destination-text">Destination</span>
            <span className="description-text">Description</span>
          </div>
          <span className="date-created-text">Date Created</span>
          <span className="created-by-text">Created By</span>
          <span className="status-text">Status</span>
        </div>

        <div className="scrollable-list">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="white-rectangle">
              <span
                className="route-checkbox material-icons checkbox-icon"
                onClick={() => setIsRouteChecked(!isRouteChecked)}
              >
                {isRouteChecked ? "check_box" : "check_box_outline_blank"}
              </span>
              <span className="route-id">241201</span>
              <div className="route-info-category-set1">
                <span className="route-starting-location">
                  Lung Center of the Philippines, Quezon Avenue, Quezon City,
                  1100 Metro Manila, Philippines
                </span>
                <span className="route-destination">
                  Armed Forces of the Philippines Medical Center, V. Luna Road,
                  Quezon City, 1100 Metro Manila, Philippines
                </span>
                <span className="route-description">
                  Description of the most optimal route in the face of the earth
                </span>
              </div>
              <span className="date-created">10-01-2024</span>
              <span className="created-by">Antipolo DRRMO</span>
              <span className="status-container-evac route-status">
                Published
              </span>
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

export default EvacuationRoutes;
