import React, { useState } from 'react';
import { IconButton, styled, Radio, RadioGroup, Checkbox, FormControlLabel, Slider, TextField } from '@mui/material';
import Switch, { SwitchProps } from '@mui/material/Switch';

interface OptimizeRouteControlsProps {
  onSearch: (value: string) => void;
  viewMode: string;
  setViewMode: (mode: string) => void;
}

const OptimizeRouteControls: React.FC<OptimizeRouteControlsProps> = ({ onSearch, viewMode, setViewMode }) => {
  
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
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(event.target.value);
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

  const handleGPSButtonClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationString = `Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`;
          onSearch(locationString); // Update the search bar with the user's location
        },
        (error) => {
          console.error('Error fetching GPS location:', error);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
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
      <div
        className="search-bar-container"
        style={{
          backgroundColor: 'white',
          padding: '6px',
          borderRadius: '8px',
          boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)',
          width: '320px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ marginTop: '12px', marginBottom: '16px', fontSize: '13px', fontWeight: '650', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
          Find the safest evacuation route near you
        </div>
        <div style={{ position: 'relative', width: '260px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              className="explore-features-searchBar"
              placeholder="Enter starting location..."
              onChange={handleSearchChange}
              style={{ width: '100%', paddingRight: '80px' }}
            />
            <IconButton
              style={{ position: 'absolute', right: '35px', top: '50%', transform: 'translateY(-50%)', padding: '8px' }}
              aria-label="search"
              disableRipple
            >
              <span className="material-icons" style={{ fontSize: '20px' }}>search</span>
            </IconButton>
            <IconButton
              style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', padding: '8px' }}
              aria-label="Use GPS Location"
              onClick={handleGPSButtonClick}
              disableRipple
            >
              <span className="material-icons" style={{ fontSize: '20px' }}>near_me</span>
            </IconButton>
          </div>
          <div style={{ height: '10px' }}></div>
          <div style={{ position: 'relative', width: '200px', display: 'flex', alignItems: 'center' }}>
            <input
              type="number"
              className="explore-features-searchBar"
              placeholder="Enter search radius..."
              style={{ width: '100%', paddingRight: '10px' }}
            />
            <span style={{ marginLeft: '8px', fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: '600' }}>km</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0px', marginBottom: '12px', width: '260px', alignItems: 'flex-end' }}>
          <button
            className="next-button"
            aria-label="Next"
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '12px',
              transition: 'color 0.3s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#AAD400')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
          >
            <span>Next</span>
            <span className="material-icons" style={{ marginLeft: '5px', fontSize: '16px' }}>arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Display Mode */}
      <div className="display-control flex flex-col items-center" style={{ width: '320px' }}>
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

    </div>
  );
};

export default OptimizeRouteControls;
