import React from 'react';
import { useState } from 'react';
import './ReportHazards.css';
import SignInModal from '../Modal Components/SignIn'; // Import SignIn Modal
import SignUpModal from '../Modal Components/SignUp'; // Import SignIn Modal
import { Radio, styled, RadioGroup, FormControlLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';

function ReportHazard() {

    const [selectedHazard, setSelectedHazard] = useState<string>(''); // State for selected hazard type

    const [category, setCategory] = useState('');

    const handleChange = (event: SelectChangeEvent<string>) => {
      setCategory(event.target.value);
    };

    // Handle radio button selection
    const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedHazard((event.target as HTMLInputElement).value);
    };

    const StyledRadio1 = styled(Radio)(({ theme }) => ({
        padding: theme.spacing(1),  // Adjust padding to reduce button size
        "& .MuiSvgIcon-root": {
            fontSize: "20px",  // Set smaller icon size
        },
        '&.Mui-checked': {
            color: '#AAD400', // Set the color when the radio button is selected
          },
          '&.MuiRadio-root': {
            color: '#000000', // Default color
          },
        }));
        
  const [isSignInOpen, setSignInOpen] = useState(false);
  const [isSignUpOpen, setSignUpOpen] = useState(false);

  const openSignUpModal = () => {
    setSignUpOpen(true);
    setSignInOpen(false);
  };

  const openSignInModal = () => {
    setSignInOpen(true);
    setSignUpOpen(false);
  };

  const closeSignUpModal = () => {
    setSignUpOpen(false);
  };

  const closeSignInModal = () => {
    setSignInOpen(false);
  };

  const copyEmail = () => {
    navigator.clipboard.writeText("safepath@proton.me");
    alert("Email address copied to clipboard!");
  };

  const copyPhone = () => {
    navigator.clipboard.writeText("9655076304");
    alert("Phone number copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-white">

      {/* Header - Fixed header at the top of the page */}
      <header className="fixed top-5 left-0 w-full bg-[#FFFFFF]/0 py-4 flex items-center justify-center z-10">
        <div className="relative w-full max-w-[412px] flex justify-center">
          
          {/* Logo container with SafePath-Logo and SafePath-Text */}
          <div className="absolute left-[-500px] flex items-center">
            <a href="/" className="flex items-center">
              <img 
                src="/logo/SafePath-Logo.png" 
                alt="SafePath Logo" 
                className="h-[70px] w-[70px]" 
              />
              <img 
                src="/logo/SafePath-Text.png" 
                alt="SafePath Text" 
                className="h-[33px] w-[150px]"
              />
            </a>
          </div>

          {/* Main container for About, Report a hazard, and Simulation Tool buttons */}
          <div className="bg-[#302F2D]/70 h-16 w-full flex items-center justify-center rounded-[10px] header-shadow px-[36px]">
            <div className="flex space-x-9">
              <button 
                className="header-container-buttons text-white hover:text-[#AAD400]">
                About
              </button>
              <button 
                className="header-container-buttons text-white hover:text-[#AAD400]">
                Report a hazard
              </button>
                <a 
                  href="/simulation-tool" 
                  className="header-container-buttons text-white hover:text-[#AAD400]">
                  Simulation Tool
                </a>
            </div>
          </div>

          {/* Right-aligned buttons outside the main container */}
          <div className="absolute right-[-500px] top-0 h-16 flex items-center space-x-9">
            <button 
              className="header-rightSide-buttons text-[#AAD400] hover:text-[#C4C98C] sign-in-button"
              onClick={openSignInModal}  // Open Sign In Modal
              >
              Sign in
            </button>
            <button 
              className="header-rightSide-buttons text-[#000000] hover:text-[#AAD400]"
              onClick={openSignUpModal}  // Open Sign In Modal
              >
              Create an account
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="flex items-center justify-center min-h-screen bg-cover bg-center hero-section" 
        style={{ backgroundImage: 'url(/bg-images/hero-bg-image.png)' }}>
        
        {/* Text in the center left of the hero section */}
        <div className="absolute left-20 top-1/2 transform -translate-y-1/2">
          <h1 className="Main-Section-HeaderText text-black">
            Help us keep<br/>communities safe
          </h1>
          <h2 className="Main-Section-SubheadingText text-black mt-3">
            Use this form to report hazards in your area to help us<br/>improve our hazard maps.
          </h2>
        </div>
        
        {/* White container on the right side */}
        <div className="report-form absolute right-20 top-1/2 transform -translate-y-1/2 bg-white p-8 rounded-lg">
            <div className='report-container'>
                {/* You can add any content inside the white container */}
                <h3 className="reportForm-header text-black font-semibold text-lg">Report a hazard</h3>
                {/* Add form or other content here */}


                {/* Gray container below the text */}
                <div 
                className="reportForm-subheading bg-gray-300 text-center flex items-center justify-center"
                style={{ height: '41px', width: '439px', marginTop: '20px' }}
                >
                <span className="">
                    Section 1: Select hazard type
                </span>
                </div>

                <RadioGroup name="hazardType" className="report-radio-group" value={selectedHazard} onChange={handleRadioChange}>
                  
                  <FormControlLabel value="flood" control={<StyledRadio1 />} label="Flood" />
                  <FormControlLabel value="debris" control={<StyledRadio1 />} label="Debris" />

                    {/* Conditionally render dropdown when "Debris" is selected */}
                    {selectedHazard === 'debris' && (
                        <div className="dropdown-container">
                        <Select
                            value={category} // Controls the selected value
                            onChange={handleChange} 
                            defaultValue=""
                            displayEmpty
                            style={{
                            width: 201,
                            height: 28,
                            fontSize: '12px',
                            color: '#787776',
                            borderRadius: '5px',
                            borderColor: '#CECECE',
                            fontFamily: 'Inter',
                            }}
                        >
                            <MenuItem value="" disabled>Select category</MenuItem> {/* Placeholder */}
                            <MenuItem value={1}>Existing</MenuItem>
                            <MenuItem value={2}>Potential</MenuItem>
                        </Select>
                        </div>
                    )}

                  <FormControlLabel value="other" control={<StyledRadio1 />} label="Other" />
                  
                </RadioGroup>

                <button 
                    className="next-button text-[#000000] hover:text-[#AAD400]"
                    >
                    Next
                    <span className="material-icons icon">arrow_forward</span>
                </button>

            </div>
        </div>

      </section>

      {/* Footer - Fixed footer at the bottom of the page */}
      <footer 
        className="footer-section relative"
        style={{ backgroundImage: 'url(/bg-images/footer-bg-image.png)' }}
      >
        <div className="footer-header">
          <div className="socials-text-container">
            <div className="socials-text">SOCIALS</div>
            <div className="social-icons">
              <button>
                <img 
                  src="/icon-images/FB-icon-white.png" /* Replace with actual path */
                  alt="Facebook Logo" 
                  className="social-icon"
                />
              </button>
              <button>
                <img 
                  src="/icon-images/LinkedIn-icon-white.png" /* Replace with actual path */
                  alt="LinkedIn Logo" 
                  className="social-icon"
                />
              </button>
            </div>
          </div>

          <div className="contact-us-container">
            <div className="contact-us-text">CONTACT US</div>
            <button className="contact-email" onClick={copyEmail}>
              <span className="material-icons mail-icon">mail</span>
              <span className="email-text hover:text-[#AAD400]">safepath@proton.me</span>
            </button>
            <button className="contact-phone mt-[17px]" onClick={copyPhone}>
              <span className="material-icons call-icon">call</span>
              <span className="phone-text hover:text-[#AAD400]">+63 965 507 6304</span>
            </button>
          </div>
          
          <div className="about-text-container">
            <div className="about-text">ABOUT</div>
            <div className="about-links">

              <button className="about-link flex hover:text-[#AAD400]">
                <span>What is SafePath</span>
              </button>
              <button className="about-link flex hover:text-[#AAD400]">
                <span>The Team behind SafePath</span>
              </button>
              <button className="about-link flex hover:text-[#AAD400]">
                <span>Acknowledgments</span>
              </button>
              <button className="about-link flex hover:text-[#AAD400]">
                <span>Privacy Policy</span>
              </button>
              <button className="about-link flex hover:text-[#AAD400]">
                <span>Standards Compliance</span>
              </button>
            </div>
          </div>
        
        </div>

        <div className="footer-logo flex items-center">
          <img 
            src="/logo/SafePath-Logo.png" 
            alt="SafePath Logo" 
            className="h-[70px] w-[70px]" 
          />
          <img 
            src="/logo/SafePath-Text.png" 
            alt="SafePath Text" 
            className="h-[33px] w-[150px]"
          />
        </div>
      </footer>

      {/* Sign Up Modal */}
      <SignUpModal
        isOpen={isSignUpOpen}
        onClose={closeSignUpModal}
        onSwitchToSignIn={openSignInModal} // Pass the function to switch to Sign In
      />

      {/* Sign In Modal */}
      <SignInModal
        isOpen={isSignInOpen}
        onClose={closeSignInModal}
        onSwitchToSignUp={openSignUpModal} // Pass the function to switch to Sign Up
      />

    </div>
  );
}

export default ReportHazard;