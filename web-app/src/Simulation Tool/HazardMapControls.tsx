import React, { useState } from "react";
import {
  IconButton,
  styled,
  Radio,
  RadioGroup,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import Switch, { SwitchProps } from "@mui/material/Switch";
import Autosuggest from "react-autosuggest";
import "./SimulationTool.css";

interface HazardMapControlsProps {
  onSearch: (value: string) => void;
  viewMode: string;
  setViewMode: (mode: string) => void;
  setMapCenter: (center: [number, number]) => void;
  onFloodLevelChange: (level: "none" | "low" | "medium" | "high") => void;
  onSearchResult: (lat: number, lng: number) => void;
  setSearchLocation: (location: [number, number] | null) => void; // ✅ Fix: Add this
  selectedFeature: string; // ✅ Fix: Add this
  hydrologicalCheckbox: boolean;
  setHydrologicalCheckbox: (value: boolean) => void;
  floodCheckbox: boolean; // ✅ Accept flood checkbox state
  setFloodCheckbox: (value: boolean) => void; // ✅ Allow updates
  roadClosuresCheckbox: boolean; // ✅ Accept flood checkbox state
  setRoadClosuresCheckbox: (value: boolean) => void; // ✅ Allow updates
}

interface Suggestion {
  name: string;
  lat: number;
  lon: number;
}

const HazardMapControls: React.FC<HazardMapControlsProps> = ({
  onSearch,
  viewMode,
  setViewMode,
  setMapCenter,
  onFloodLevelChange,
  onSearchResult,
  setSearchLocation,
  selectedFeature,
  floodCheckbox,
  setFloodCheckbox,
  hydrologicalCheckbox,
  setHydrologicalCheckbox,
  roadClosuresCheckbox,
  setRoadClosuresCheckbox,
}) => {
  const [forecastHazardsEnabled, setForecastHazardsEnabled] = useState(false);
  const [hazardAssessmentCoverage, setHazardAssessmentCoverage] =
    useState("Per Hazard Zone");
  const [minorFloodChecked, setMinorFloodChecked] = useState(false);
  const [moderateFloodChecked, setModerateFloodChecked] = useState(false);
  const [severeFloodChecked, setSevereFloodChecked] = useState(false);
  const [debrisCheckbox, setDebrisCheckbox] = useState(false);
  const [dropdownVisible1, setDropdownVisible1] = useState(false);
  const [dropdownVisible2, setDropdownVisible2] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searchValue, setSearchValue] = useState("");

  const fetchSuggestions = async (value: string) => {
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
          value
        )}&apiKey=052066f9048a4fd19c3a66f9d5fdaea0`
      );
      const results = await response.json();
      setSuggestions(
        results.features.map((feature: any) => ({
          name: feature.properties.formatted,
          lat: feature.geometry.coordinates[1],
          lon: feature.geometry.coordinates[0],
        }))
      );
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    { newValue }: any
  ) => {
    setSearchValue(newValue);
    onSearch(newValue);
  };

  const handleSuggestionSelected = (
    event: any,
    { suggestion }: { suggestion: Suggestion }
  ) => {
    setMapCenter([suggestion.lat, suggestion.lon]); // ✅ Updates 2D map
    onSearch(suggestion.name);
    onSearchResult(suggestion.lat, suggestion.lon);

    // ✅ Ensure search marker only appears in "Hazard Map" mode
    if (selectedFeature === "map") {
      setSearchLocation([suggestion.lat, suggestion.lon]);
    } else {
      setSearchLocation(null);
    }
  };

  const handleFloodCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const isChecked = event.target.checked;
    setFloodCheckbox(isChecked); // ✅ Update flood checkbox state
  };

  const handleRoadClosuresCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const isChecked = event.target.checked;
    setRoadClosuresCheckbox(isChecked); // ✅ Update flood checkbox state
  };

  const handleHydroCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const isChecked = event.target.checked;
    setHydrologicalCheckbox(isChecked); // ✅ Update flood checkbox state
  };

  const handleMinorFloodChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const isChecked = event.target.checked;
    setMinorFloodChecked(isChecked);
    updateFloodLevel(isChecked, moderateFloodChecked, severeFloodChecked);
  };

  const handleModerateFloodChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const isChecked = event.target.checked;
    setModerateFloodChecked(isChecked);
    updateFloodLevel(minorFloodChecked, isChecked, severeFloodChecked);
  };

  const handleSevereFloodChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const isChecked = event.target.checked;
    setSevereFloodChecked(isChecked);
    updateFloodLevel(minorFloodChecked, moderateFloodChecked, isChecked);
  };

  // Helper function to determine the flood level based on selected checkboxes
  const updateFloodLevel = (
    isLow: boolean,
    isMedium: boolean,
    isHigh: boolean
  ) => {
    if (isHigh) {
      onFloodLevelChange("high");
    } else if (isMedium) {
      onFloodLevelChange("medium");
    } else if (isLow) {
      onFloodLevelChange("low");
    } else {
      onFloodLevelChange("none");
    }
  };

  const StyledRadio = styled(Radio)(({ theme }) => ({
    "&.Mui-checked": {
      color: "#AAD400",
    },
    "&.MuiRadio-root": {
      color: "#000000",
    },
  }));

  const IOSSwitch = styled((props: SwitchProps) => (
    <Switch
      focusVisibleClassName=".Mui-focusVisible"
      disableRipple
      {...props}
    />
  ))(({ theme }) => ({
    width: 34,
    height: 18,
    padding: 0,
    "& .MuiSwitch-switchBase": {
      padding: 0,
      margin: 2,
      transitionDuration: "200ms",
      "&.Mui-checked": {
        transform: "translateX(16px)",
        color: "white",
        "& + .MuiSwitch-track": {
          backgroundColor: "#AAD400",
          opacity: 1,
          border: 0,
        },
        "&.Mui-disabled + .MuiSwitch-track": {
          opacity: 0.5,
        },
      },
    },
    "& .MuiSwitch-thumb": {
      boxSizing: "border-box",
      width: 14,
      height: 14,
    },
    "& .MuiSwitch-track": {
      borderRadius: 26 / 2,
      backgroundColor: "gray",
      opacity: 1,
      transition: theme.transitions.create(["background-color"], {
        duration: 500,
      }),
    },
  }));

  const handleSearchButtonClick = async () => {
    onSearch(searchValue);
    if (searchValue) {
      try {
        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
            searchValue
          )}&apiKey=052066f9048a4fd19c3a66f9d5fdaea0`
        );
        const results = await response.json();
        if (results.features.length > 0) {
          const { geometry } = results.features[0];
          setMapCenter([geometry.coordinates[1], geometry.coordinates[0]]);
        }
      } catch (error) {
        console.error("Error fetching location:", error);
      }
    }
  };

  const handleGPSButtonClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          const locationString = `Lat: ${latitude.toFixed(
            5
          )}, Lon: ${longitude.toFixed(5)}`;
          setSearchValue(locationString);
          onSearch(locationString);
        },
        (error) => {
          console.error("Error fetching GPS location:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className="explore-map-controls">
      <div
        className="search-bar-container"
        style={{ position: "relative", width: "100%" }}
      >
        <Autosuggest
          suggestions={suggestions}
          onSuggestionsFetchRequested={({ value }: { value: string }) =>
            fetchSuggestions(value)
          }
          onSuggestionsClearRequested={() => setSuggestions([])}
          getSuggestionValue={(suggestion: Suggestion) => suggestion.name}
          renderSuggestion={(suggestion: Suggestion) => (
            <div className="suggestion-item">{suggestion.name}</div>
          )}
          onSuggestionSelected={handleSuggestionSelected}
          inputProps={{
            placeholder: "Enter location...",
            value: searchValue,
            onChange: handleInputChange,
            className: "explore-features-searchBar",
            style: { paddingRight: "74px" },
          }}
          theme={{
            container: "autosuggest-container",
            suggestionsContainer:
              suggestions.length > 0
                ? "suggestions-container"
                : "suggestions-container hidden",
            suggestionsList: "suggestions-list",
            suggestion: "suggestion-item",
            suggestionHighlighted: "suggestion-item-highlighted",
          }}
        />
        <button
          className="search-icon-button"
          aria-label="Search"
          onClick={handleSearchButtonClick}
          style={{ right: "43px" }}
        >
          <span className="material-icons">search</span>
        </button>
        <button
          className="search-icon-button"
          aria-label="Use GPS Location"
          onClick={handleGPSButtonClick}
          style={{ right: "13px" }}
        >
          <span className="material-icons">near_me</span>
        </button>
      </div>

      <div className="display-control flex flex-col items-center">
        <div className="display-control-header mb-2">
          <h4 className="text-center">Display Mode</h4>
        </div>
        <RadioGroup
          row
          aria-label="view"
          name="view"
          className="flex justify-center gap-[26px] mt-1.5"
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
        >
          <div className="flex flex-col items-center">
            <span className="radio-button-text text-center">2D View</span>
            <StyledRadio value="2d" />
          </div>
          <div className="flex flex-col items-center">
            <span className="radio-button-text text-center">3D View</span>
            <StyledRadio value="3d" />
          </div>
        </RadioGroup>
      </div>

      <div
        className="forecast-hazards-control"
        style={{
          minHeight: "37px", // ✅ Ensures a small minimum height when disabled
          maxHeight: forecastHazardsEnabled ? "500px" : "37px", // ✅ Expands smoothly
          transition: "max-height 0.4s ease-in-out", // ✅ Smooth animation effect
          overflow: "hidden", // ✅ Prevents unwanted scrolling when collapsed
        }}
      >
        <div className="forecast-hazards-header flex justify-between items-center">
          <span className="material-icons ml-4 text-[18px]">warning</span>
          <h4 className="ml-2">Hazards</h4>
          <IOSSwitch
            className="ml-auto mr-4"
            checked={forecastHazardsEnabled}
            onChange={(e) => setForecastHazardsEnabled(e.target.checked)}
          />
        </div>

        {forecastHazardsEnabled && (
          <div
            className="hazard-assessment-content mb-3"
            style={{
              maxHeight: "405px",
              overflowY: "auto",
            }}
          >
            <div className="checkboxes ml-5 mt-2 flex flex-col">
              <div className="debris-options">
                <div className="debris-option">
                  <div className="flex justify-between items-center">
                    <span className="material-icons text-[18px]">tsunami</span>
                    <span className="hazards-radio-texts ml-2">
                      Hydrological
                    </span>
                  </div>
                  <IconButton
                    aria-label="toggle dropdown"
                    className="dropdown-icon"
                    disableRipple // ✅ Removes ripple effect
                    disableFocusRipple // ✅ Removes focus effect
                    onClick={() => setDropdownVisible1(!dropdownVisible1)}
                  >
                    <span className="material-icons mr-2">
                      {dropdownVisible1 ? "arrow_drop_up" : "arrow_drop_down"}
                    </span>
                  </IconButton>
                </div>
                {dropdownVisible1 && (
                  <div className="checkboxes ml-7 flex flex-col gap-1">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={floodCheckbox}
                          onChange={handleFloodCheckboxChange}
                          size="small"
                        />
                      }
                      label={
                        <div className="ml-1 checkbox-label-container">
                          <span className="hazards-radio-texts">Flood</span>
                        </div>
                      }
                      className="checkbox-label"
                    />
                    {floodCheckbox && (
                      <div className="ml-[20px] custom-checkbox-group flex flex-col gap-1">
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={minorFloodChecked}
                              onChange={handleMinorFloodChange}
                              size="small"
                            />
                          }
                          label={
                            <div className="checkbox-label-container">
                              <span className="hazards-radio-texts">
                                Low (0.1m - 0.5m)
                              </span>
                            </div>
                          }
                          className="block"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={moderateFloodChecked}
                              onChange={handleModerateFloodChange}
                              size="small"
                            />
                          }
                          label={
                            <div className="checkbox-label-container">
                              <span className="hazards-radio-texts">
                                Medium (0.5m - 1.5m)
                              </span>
                            </div>
                          }
                          className="block"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={severeFloodChecked}
                              onChange={handleSevereFloodChange}
                              size="small"
                            />
                          }
                          label={
                            <div className="checkbox-label-container">
                              <span className="hazards-radio-texts">
                                High (1.5m - 2.5m)
                              </span>
                              {severeFloodChecked && (
                                <span
                                  style={{
                                    fontSize: "9px",
                                    color: "gray",
                                    display: "block",
                                  }}
                                >
                                  Note: 2.5m is just a theoretical limit; actual
                                  levels may exceed this under severe
                                  conditions.
                                </span>
                              )}
                            </div>
                          }
                          className="block"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HazardMapControls;
