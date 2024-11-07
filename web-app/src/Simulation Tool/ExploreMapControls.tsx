import React, { useState } from 'react';
import { styled, Radio, RadioGroup, Checkbox, FormControlLabel } from '@mui/material';
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

      {/* Forecast Hazards*/}
      <div 
        className="forecast-hazards-control" 
        style={{ 
            height: forecastHazardsEnabled ? '225px' : '37px',  // Use fixed height values
            transition: 'height 0.2s ease',  // Smooth transition for height
        }}
        >
        
        <div className="forecast-hazards-header flex justify-between items-center">
          <h4 className="ml-4">Forecast Hazards</h4>
          <IOSSwitch 
            className="ml-auto mr-4" 
            checked={forecastHazardsEnabled} 
            onChange={handleForecastHazardsChange} 
          />
        </div>
        {forecastHazardsEnabled && (
          <div 
            className="hazard-assessment-content"
            style={{
              maxHeight: '175px',  // Adjusted to fit within the 250px container
              overflowY: 'auto'    // Enables scrolling for this content only
            }}
          >
            <RadioGroup
                row
                aria-label="view"
                name="view"
                className="flex justify-center gap-[26px] mt-3"
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
            <hr className="mt-1 border-t-2 w-[249px] mx-auto border-gray-300" />

            {/* Checkboxes */}
            <div className="checkboxes ml-6 mt-5 flex flex-col gap-5">
              <FormControlLabel
                control={<Checkbox checked={checkbox1} onChange={handleCheckboxChange1} size="small" />}
                label={<div className="ml-2 checkbox-label-container">
                    <span className="forecast-hazards-radio-texts">Flood</span>
                </div>}
                className="checkbox-label"
              />
              {checkbox1 && (
                <RadioGroup name="floodOptions" className="ml-10">
                  <FormControlLabel value="low" control={<StyledRadio />} label="Minor" />
                  <FormControlLabel value="medium" control={<StyledRadio />} label="Moderate" />
                  <FormControlLabel value="high" control={<StyledRadio />} label="Severe" />
                </RadioGroup>
              )}

              <FormControlLabel
                label={<div className="ml-2 checkbox-label-container">
                    <span className="forecast-hazards-radio-texts">Debris</span>
                </div>}
                control={<Checkbox checked={checkbox2} onChange={handleCheckboxChange2} size="small"/>}
                className="checkbox-label"
              />
              {checkbox2 && (
                <RadioGroup name="debrisOptions" className="ml-10">
                  <FormControlLabel value="light" control={<StyledRadio />} label="Light" />
                  <FormControlLabel value="moderate" control={<StyledRadio />} label="Moderate" />
                  <FormControlLabel value="severe" control={<StyledRadio />} label="Severe" />
                </RadioGroup>
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
