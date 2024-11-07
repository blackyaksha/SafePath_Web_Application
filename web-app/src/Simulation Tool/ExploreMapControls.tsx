import React, { useState } from 'react';
import { IconButton, styled, Radio, RadioGroup, Checkbox, FormControlLabel } from '@mui/material';
import Switch, { SwitchProps } from '@mui/material/Switch';

interface ExploreMapControlsProps {
  onSearch: (value: string) => void;
}

const ExploreMapControls: React.FC<ExploreMapControlsProps> = ({ onSearch }) => {
  const [forecastHazardsEnabled, setForecastHazardsEnabled] = useState(false);  // State to track switch status
  const [hazardAssessmentEnabled, sethazardAssessmentEnabled] = useState(false);  // State to track switch status
  const [viewMode, setViewMode] = useState('3d');  // default to '3d'
  const [hazardAssessmentCoverage, setHazardAssessmentCoverage] = useState('Per Hazard Zone');  // default to 'Per Hazard Zone'

  const [checkbox1, setCheckbox1] = useState(false);  // State for checkbox 1
  const [checkbox2, setCheckbox2] = useState(false);  // State for checkbox 2

  const [floodCheckbox, setFloodCheckbox] = useState(false);
  const [debrisCheckbox, setDebrisCheckbox] = useState(false);

  const [dropdownVisible1, setDropdownVisible1] = useState(false);  // State for showing/hiding checkboxes
  const [dropdownVisible2, setDropdownVisible2] = useState(false);  // State for showing/hiding checkboxes

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(event.target.value);
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

  return (
    <div className="explore-map-controls">
      <div className="search-bar-container">
        <input
          type="text"
          className="explore-features-searchBar"
          placeholder="Search for locations..."
          onChange={handleSearchChange}
        />
        <button className="search-icon-button" aria-label="Search">
          <span className="material-icons">search</span>
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
            value={viewMode}  // bind to the viewMode state
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
          <h4 className="ml-4">Forecast Hazards</h4>
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
                <RadioGroup name="floodOptions" className="ml-7 custom-radio-group">
                  <FormControlLabel 
                    value="low" 
                    control={<StyledRadio1 />} 
                    label="Minor (1.0m - 1.5m)" 
                  />
                  <FormControlLabel value="medium" control={<StyledRadio1 />} label="Moderate (1.5m - 2.5m)" />
                  <FormControlLabel value="high" control={<StyledRadio1 />} label="Severe (2.5m - up)" />
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
                        control={<Checkbox />}
                        label={<div className="checkbox-label-container">
                          <span className="checkbox-label-text">Closed/Blocked Roads</span>
                        </div>}                        
                      />
                      <FormControlLabel
                        className="custom-checkbox-label"
                        control={<Checkbox />}
                        label={<div className="checkbox-label-container">
                          <span className="checkbox-label-text">Environmental Hazards</span>
                          <span className="checkbox-description">(e.g. Fallen Trees, Landslide Debris)</span>
                        </div>}        
                      />
                      <FormControlLabel
                        className="custom-checkbox-label"
                        control={<Checkbox />}
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
                          control={<Checkbox />}
                          label={<div className="checkbox-label-container">
                            <span className="checkbox-label-text">Closed/Blocked Roads</span>
                          </div>}
                        />
                        <FormControlLabel
                          control={<Checkbox />}
                          label={<div className="checkbox-label-container">
                            <span className="checkbox-label-text">Environmental Hazards</span>
                            <span className="checkbox-description">(e.g. Trees, Landslides)</span>
                          </div>}
                        />
                        <FormControlLabel
                          control={<Checkbox />}
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
          <h4 className="ml-4">Hazard Assessment</h4>
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

export default ExploreMapControls;
