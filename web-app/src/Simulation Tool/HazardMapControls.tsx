import React, { useState } from 'react';
import { IconButton, styled, Radio, RadioGroup, Checkbox, FormControlLabel, Slider, TextField } from '@mui/material';
import Switch, { SwitchProps } from '@mui/material/Switch';
import Autosuggest from 'react-autosuggest'; // Import Autosuggest
import './SimulationTool.css'; // Import your CSS file for styling

interface HazardMapControlsProps {
  onSearch: (value: string) => void;
  viewMode: string;
  setViewMode: (mode: string) => void;
  setMapCenter: (center: [number, number]) => void;
}

interface Suggestion {
  name: string;
  lat: string;
  lon: string;
}

const HazardMapControls: React.FC<HazardMapControlsProps> = ({ onSearch, viewMode, setViewMode, setMapCenter }) => {
  
  const [forecastHazardsEnabled, setForecastHazardsEnabled] = useState(false);  // State to track switch status
  const [hazardAssessmentEnabled, sethazardAssessmentEnabled] = useState(false);  // State to track switch status
  const [hazardAssessmentCoverage, setHazardAssessmentCoverage] = useState('Per Hazard Zone');  // default to 'Per Hazard Zone'

  const [checkbox1, setCheckbox1] = useState(false);  // State for checkbox 1
  const [checkbox2, setCheckbox2] = useState(false);  // State for checkbox 2

  // Existing state declarations
  const [floodCheckbox, setFloodCheckbox] = useState(false);
  const [selectedFloodLevel, setSelectedFloodLevel] = useState<string | null>(null); // State to track selected flood level
  const [severeFloodValue, setSevereFloodValue] = useState<number | string>("");

  // Event handler for flood level radio buttons
  const handleFloodLevelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFloodLevel(event.target.value);
  };

  const handleSevereFloodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    // Allow empty value for clearing the input field
    if (value === "" || !isNaN(parseFloat(value)) && parseFloat(value) >= 2.5) {
      setSevereFloodValue(value);
    }
  };

  const sliderStyle = {
    width: '160px',
    height: '3px', // Set the thickness here
  };
  
  const [debrisCheckbox, setDebrisCheckbox] = useState(false);

  const [dropdownVisible1, setDropdownVisible1] = useState(false);  // State for showing/hiding checkboxes
  const [dropdownVisible2, setDropdownVisible2] = useState(false);  // State for showing/hiding checkboxes

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]); // State for suggestions
  const [searchValue, setSearchValue] = useState(''); // State for search input

  // Function to fetch suggestions
  const fetchSuggestions = async (value: string) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}`);
      const results = await response.json();
      setSuggestions(results.map((result: any) => ({
        name: result.display_name,
        lat: result.lat,
        lon: result.lon
      })));
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  // Function to handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>, { newValue }: any) => {
    setSearchValue(newValue);
    onSearch(newValue); // Call the original onSearch function
  };

  // Function to handle suggestion selection
  const handleSuggestionSelected = (event: any, { suggestion }: { suggestion: Suggestion }) => {
    setMapCenter([parseFloat(suggestion.lat), parseFloat(suggestion.lon)]);
    onSearch(suggestion.name);
  };

  // Function to get suggestions
  const getSuggestions = ({ value }: any) => {
    fetchSuggestions(value);
  };

  // Function to clear suggestions
  const clearSuggestions = () => {
    setSuggestions([]);
  };

  // Function to render suggestion
  const renderSuggestion = (suggestion: Suggestion) => (
    <div className="suggestion-item">
      {suggestion.name}
    </div>
  );

  const handleSearchChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onSearch(value);

    if (value) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}`);
        const results = await response.json();
        if (results.length > 0) {
          const { lat, lon } = results[0];
          setMapCenter([parseFloat(lat), parseFloat(lon)]);
        }
      } catch (error) {
        console.error('Error fetching location:', error);
      }
    }
  };

  const handleHazardAssessmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    sethazardAssessmentEnabled(event.target.checked);
  };

  const handleForecastHazardsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForecastHazardsEnabled(event.target.checked);
  };

  const handleCheckboxChange1 = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCheckbox1(event.target.checked);
  };

  const handleCheckboxChange2 = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCheckbox2(event.target.checked);
  };

  const handleFloodCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFloodCheckbox(event.target.checked);
  };

  const handleDebrisCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDebrisCheckbox(event.target.checked);
  };

  const StyledRadio1 = styled(Radio)(({ theme }) => ({
    padding: theme.spacing(1),  // Adjust padding to reduce button size
    "& .MuiSvgIcon-root": {
      fontSize: "18px",  // Set smaller icon size
    },
  }));

  const IOSSwitch = styled((props: SwitchProps) => (
    <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
  ))(({ theme }) => ({
    width: 34,
    height: 18,
    padding: 0,
    '& .MuiSwitch-switchBase': {
      padding: 0,
      margin: 2,
      transitionDuration: '200ms',
      '&.Mui-checked': {
        transform: 'translateX(16px)',
        color: 'white',
        '& + .MuiSwitch-track': {
          backgroundColor: '#AAD400',
          opacity: 1,
          border: 0,
        },
        '&.Mui-disabled + .MuiSwitch-track': {
          opacity: 0.5,
        },
      },
    },
    '& .MuiSwitch-thumb': {
      boxSizing: 'border-box',
      width: 14,
      height: 14,
    },
    '& .MuiSwitch-track': {
      borderRadius: 26 / 2,
      backgroundColor: 'gray',
      opacity: 1,
      transition: theme.transitions.create(['background-color'], {
        duration: 500,
      }),
    },
  }));

  const StyledRadio = styled(Radio)(({ theme }) => ({
    '&.Mui-checked': {
      color: '#AAD400', // Set the color when the radio button is selected
    },
    '&.MuiRadio-root': {
      color: '#000000', // Default color
    },
  }));

  const handleSearchButtonClick = async () => {
    onSearch(searchValue);

    if (searchValue) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchValue)}`);
        const results = await response.json();
        if (results.length > 0) {
          const { lat, lon } = results[0];
          setMapCenter([parseFloat(lat), parseFloat(lon)]);
        }
      } catch (error) {
        console.error('Error fetching location:', error);
      }
    }
  };

  // Add a new function to handle GPS location
  const handleGPSButtonClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          const locationString = `Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`;
          setSearchValue(locationString); // Update the search bar with the user's location
          onSearch(locationString);
        },
        (error) => {
          console.error('Error fetching GPS location:', error);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className="explore-map-controls">
      <div className="search-bar-container" style={{ position: 'relative', width: '100%' }}>
        <Autosuggest
          suggestions={suggestions}
          onSuggestionsFetchRequested={getSuggestions}
          onSuggestionsClearRequested={clearSuggestions}
          getSuggestionValue={(suggestion: Suggestion) => suggestion.name}
          renderSuggestion={renderSuggestion}
          onSuggestionSelected={handleSuggestionSelected}
          inputProps={{
            placeholder: 'Enter location...',
            value: searchValue,
            onChange: handleInputChange,
            className: 'explore-features-searchBar', // Use the same class for styling
            style: { paddingRight: '74px' } // Adjust padding to prevent overlap
          }}
          theme={{
            container: 'autosuggest-container',
            suggestionsContainer: suggestions.length > 0 ? 'suggestions-container' : 'suggestions-container hidden', // Conditionally apply 'hidden' class
            suggestionsList: 'suggestions-list',
            suggestion: 'suggestion-item',
            suggestionHighlighted: 'suggestion-item-highlighted'
          }}
        />
        <button className="search-icon-button" aria-label="Search" onClick={handleSearchButtonClick} style={{ right: '43px' }}>
          <span className="material-icons">search</span>
        </button>
        <button className="search-icon-button" aria-label="Use GPS Location" onClick={handleGPSButtonClick} style={{ right: '13px' }}>
          <span className="material-icons">near_me</span>
        </button>
      </div>

      {/* Display Mode */}
      <div className="display-control flex flex-col items-center">
        <div className="display-control-header mb-2">
          <h4 className="text-center">Display Mode</h4>
        </div>
        <RadioGroup
          row
          aria-label="view"
          name="view"
          className="flex justify-center gap-[26px] mt-1.5"
          value={viewMode}  // bind to the viewMode prop
          onChange={(e) => setViewMode(e.target.value)}  // update the viewMode when the user selects a radio button
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

      {/* Forecast Hazards */}
      <div 
        className="forecast-hazards-control" 
        style={{ 
          height: forecastHazardsEnabled ? '213px' : '37px',  // Auto height when expanded, fixed when collapsed
          maxHeight: '240px',  // Max height is 350px
          transition: 'height 0.2s ease',  // Smooth transition for height
          overflowY: 'hidden',  // Enable scroll only when expanded
        }}
      >
        {/* Header section */}
        <div className="forecast-hazards-header flex justify-between items-center">
          <h4 className="ml-4">Hazard Zones</h4>
          <IOSSwitch 
            className="ml-auto mr-4" 
            checked={forecastHazardsEnabled} 
            onChange={handleForecastHazardsChange} 
          />
        </div>

        {/* Content section */}
        {forecastHazardsEnabled && (
          <div 
            className="hazard-assessment-content"
            style={{
              maxHeight: '165px',  // This allows space for the header and maintains the 350px max height 
              overflowY: 'auto',  // Enables scrolling within this section only
            }}
          >
            <RadioGroup
              row
              aria-label="view"
              name="view"
              className="flex justify-center gap-[26px] mt-3.5"
              value={hazardAssessmentCoverage}  
              onChange={(e) => setHazardAssessmentCoverage(e.target.value)}  
            >
              <div className="flex flex-col items-center">
                <span className="forecast-hazards-radio-texts text-center">View only</span>
                <StyledRadio value="Per Hazard Zone" />
              </div>
              <div className="flex flex-col items-center">
                <span className="forecast-hazards-radio-texts text-center">Simulation</span>
                <StyledRadio value="Barangay Level" />
              </div>
            </RadioGroup>

            {/* Divider Line */}
            <hr className="mt-2 border-t-2 w-[249px] mx-auto border-gray-300" />

            {/* Checkboxes */}
            <div className="checkboxes ml-6 mt-4 flex flex-col gap-1">
              <FormControlLabel
                control={<Checkbox checked={floodCheckbox} onChange={handleFloodCheckboxChange} size="small" />}
                label={<div className="ml-2 checkbox-label-container">
                    <span className="forecast-hazards-radio-texts">Flood</span>
                </div>}
                className="checkbox-label"
              />
              {floodCheckbox && (
                <RadioGroup name="floodOptions" className="ml-7 custom-radio-group" value={selectedFloodLevel} onChange={handleFloodLevelChange}>
                  
                  <FormControlLabel value="low" control={<StyledRadio1 />} label="Minor (1.0m - 1.5m)" />
                  {/* Conditionally render slider when "Minor (1.0m - 1.5m)" is selected */}
                  {selectedFloodLevel === 'low' && (
                    <Slider 
                      defaultValue={1.0} 
                      min={1.0} 
                      max={1.5} 
                      step={0.1} 
                      style={sliderStyle}
                      size='small'
                      valueLabelDisplay="auto"
                      className="ml-7 mt-0.5 mb-1"
                    />
                  )}
                  <FormControlLabel value="medium" control={<StyledRadio1 />} label="Moderate (1.5m - 2.5m)" />
                  {/* Conditionally render slider when "Moderate (1.5m - 2.5m)" is selected */}
                  {selectedFloodLevel === 'medium' && (
                    <Slider 
                      defaultValue={1.5} 
                      min={1.5} 
                      max={2.5} 
                      step={0.1} 
                      style={sliderStyle}
                      size='small'
                      valueLabelDisplay="auto"
                      className="ml-7 mt-0.5 mb-1"
                    />
                  )}

                  <FormControlLabel value="high" control={<StyledRadio1 />} label="Severe (2.5m - up)" />
                  {/* Conditionally render TextField when "Severe (2.5m - up)" is selected */}
                  {selectedFloodLevel === "high" && (
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px', marginBottom: '10px' }}>
                      <TextField
                        type="number"
                        value={severeFloodValue}
                        onChange={handleSevereFloodChange}
                        inputProps={{
                          min: 2.5, // Enforces the minimum value
                          step: 0.1, // Optionally define a step
                          style: {
                            fontSize: '15px', // Reduced font size
                          }
                        }}
                        style={{ marginLeft: '25px', marginTop: '1px', width: '100px' }}
                        InputProps={{
                          style: {
                            padding: '0.1px 1px', // Reduce padding to make the input smaller
                          },
                        }}
                      />
                      <span style={{ marginLeft: '8px', alignSelf: 'center' }}>m</span>
                    </div>
                  )}
                  
                </RadioGroup>
              )}

              <FormControlLabel
                label={<div className="ml-2 checkbox-label-container">
                    <span className="forecast-hazards-radio-texts">Debris</span>
                </div>}
                control={<Checkbox checked={debrisCheckbox} onChange={handleDebrisCheckboxChange} size="small"/>}
                className="checkbox-label"
              />
              {debrisCheckbox && (
                <div className="debris-options ml-7">
                  <div className="debris-option">
                    <span className="debris-text">Existing</span>
                    <IconButton 
                      aria-label="toggle dropdown" 
                      className="dropdown-icon"
                      onClick={() => setDropdownVisible1(!dropdownVisible1)}  // Toggle visibility
                    >
                      <span className="material-icons">
                        {dropdownVisible1 ? 'arrow_drop_up' : 'arrow_drop_down'}
                      </span>
                    </IconButton>
                  </div>
                  {dropdownVisible1 && (
                    <div className="checkbox-list flex-col">
                      <FormControlLabel
                        className="custom-checkbox-label"
                        control={<Checkbox size="small"/>}
                        label={<div className="checkbox-label-container">
                          <span className="checkbox-label-text">Closed/Blocked Roads</span>
                        </div>}                        
                      />
                      <FormControlLabel
                        className="custom-checkbox-label"
                        control={<Checkbox size="small"/>}
                        label={<div className="checkbox-label-container">
                          <span className="checkbox-label-text">Environmental Hazards</span>
                          <span className="checkbox-description">(e.g. Fallen Trees, Landslide Debris)</span>
                        </div>}        
                      />
                      <FormControlLabel
                        className="custom-checkbox-label"
                        control={<Checkbox size="small"/>}
                        label={<div className="checkbox-label-container">
                          <span className="checkbox-label-text">Collapsed Man-made Structures</span>
                          <span className="checkbox-description">(e.g. Buildings, Houses, Utility Poles)</span>
                        </div>}                        
                      />
                    </div>
                  )}

                  <div className="debris-option">
                    <span className="debris-text">Potential</span>
                    <IconButton 
                      aria-label="toggle dropdown" 
                      className="dropdown-icon"
                      onClick={() => setDropdownVisible2(!dropdownVisible2)}  // Toggle visibility of checkboxes
                    >
                      <span className="material-icons">
                        {dropdownVisible2 ? 'arrow_drop_up' : 'arrow_drop_down'}
                      </span>
                    </IconButton>
                  </div>
                  {dropdownVisible2 && (
                      <div className="checkbox-list flex-col">
                        <FormControlLabel
                          control={<Checkbox size="small"/>}
                          label={<div className="checkbox-label-container">
                            <span className="checkbox-label-text">Closed/Blocked Roads</span>
                          </div>}
                        />
                        <FormControlLabel
                          control={<Checkbox size="small"/>}
                          label={<div className="checkbox-label-container">
                            <span className="checkbox-label-text">Environmental Hazards</span>
                            <span className="checkbox-description">(e.g. Trees, Landslides)</span>
                          </div>}
                        />
                        <FormControlLabel
                          control={<Checkbox size="small"/>}
                          label={<div className="checkbox-label-container">
                            <span className="checkbox-label-text">Man-made Structures</span>
                            <span className="checkbox-description">(e.g. Buildings, Houses, Utility Poles)</span>
                          </div>}
                        />
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hazard Assessment */}
      <div 
        className="hazard-assessment-control" 
        style={{ 
            height: hazardAssessmentEnabled ? '245px' : '37px',  // Use fixed height values
            transition: 'height 0.2s ease'  // Smooth transition for height
        }}
        >
        
        <div className="hazard-assessment-header flex justify-between items-center">
          <h4 className="ml-4">Simulate Hazards</h4>
          <IOSSwitch 
            className="ml-auto mr-4" 
            checked={hazardAssessmentEnabled} 
            onChange={handleHazardAssessmentChange} 
          />
        </div>
        {hazardAssessmentEnabled && (
          <div className="hazard-assessment-content">
            <RadioGroup
                row
                aria-label="view"
                name="view"
                className="flex justify-center gap-[12px] mt-4"
                value={hazardAssessmentCoverage}  
                onChange={(e) => setHazardAssessmentCoverage(e.target.value)}  
                >
                <div className="flex flex-col items-center">
                    <span className="hazards-assessment-radio-texts text-center">Per Hazard Zone</span>
                    <StyledRadio value="Per Hazard Zone" />
                </div>
                <div className="flex flex-col items-center">
                    <span className="hazards-assessment-radio-texts text-center">Barangay Level</span>
                    <StyledRadio value="Barangay Level" />
                </div>
                <div className="flex flex-col items-center">
                    <span className="hazards-assessment-radio-texts text-center">City/Municipal Level</span>
                    <StyledRadio value="City/Municipal Level" />
                </div>
            </RadioGroup>

            {/* Divider Line */}
            <hr className="mt-2 border-t-2 w-[249px] mx-auto border-gray-300" />

            {/* Checkboxes */}
            <div className="checkboxes ml-6 mt-5 flex flex-col gap-5">
              <FormControlLabel
                control={<Checkbox checked={checkbox1} onChange={handleCheckboxChange1} size="small" />}
                label={<div className="ml-2 checkbox-label-container">
                    <span className="checkbox-label-text">Affected Man-made Structures</span>
                    <span className="checkbox-description">(e.g. Houses, Buildings, Facilities)</span>
                </div>}
                className="checkbox-label"
              />
              <FormControlLabel
                label={<div className="ml-2 checkbox-label-container">
                    <span className="checkbox-label-text">Affected Population</span>
                    <span className="checkbox-description">(Approximate No. People Affected)</span>
                </div>}
                control={<Checkbox checked={checkbox2} onChange={handleCheckboxChange2} size="small"/>}
                className="checkbox-label"
              />
            </div>
          
          </div>
        )}
      </div>

    </div>
  );
};

export default HazardMapControls;
