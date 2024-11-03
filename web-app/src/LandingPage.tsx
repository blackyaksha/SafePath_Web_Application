import React from 'react';
import './LandingPage.css';

function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header - Fixed header at the top of the page */}
      <header className="fixed top-5 left-0 w-full bg-[#FFFFFF]/0 py-4 flex items-center justify-center">
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
              className="header-rightSide-buttons text-[#AAD400] hover:text-[#C4C98C] sign-in-button">
              Sign in
            </button>
            <button 
              className="header-rightSide-buttons text-[#000000] hover:text-[#AAD400]">
              Create an account
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="flex items-center justify-center min-h-screen bg-cover bg-center" 
        style={{ backgroundImage: 'url(/bg-images/hero-bg-image.png)' }}>
        
        {/* Text in the center left of the hero section */}
        <div className="absolute left-20 top-1/2 transform -translate-y-1/2">
          <h1 className="Hero-Section-HeaderText text-black">Optimize your way out of disasters</h1>
          <h2 className="Hero-Section-SubheadingText text-black mt-3">Utilize our advanced mapping technology for safer evacuations.</h2>
          
          {/* Button for Open Simulation Tool */}
          <button 
            className="open-simulation-button hover:bg-[#302F2D] hover:text-[#dddddd]"
            onClick={() => window.open('/simulation-tool', '_blank')}
          >
            <span>Open Simulation Tool</span>
            <span className="material-icons icon">arrow_outward</span>
          </button>
        </div>

      </section>

      {/* Main Content Area: Displays features */}
      <section className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Main Content Area</h2>
          <p className="text-lg">This is where your main content will go.</p>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
