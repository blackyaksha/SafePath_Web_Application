import React from 'react';
import './LandingPage.css';

function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header - Fixed header at the top of the page */}
      <header className="fixed top-5 left-0 w-full bg-[#FFFFFF]/0 py-4">
        <div className="bg-[#302F2D]/70 h-16 w-[412px] mx-auto flex items-center justify-between rounded-[10px] header-shadow px-[36px]">
          {/* Header buttons with padding for equal spacing */}
          <button 
            style={{ fontSize: '15px', fontFamily: 'Inter', fontWeight: '500' }} 
            className="text-white hover:text-[#AAD400]">
            About
          </button>
          <button 
            style={{ fontSize: '15px', fontFamily: 'Inter', fontWeight: '500' }} 
            className="text-white hover:text-[#AAD400]">
            Report a hazard
          </button>
          <button 
            style={{ fontSize: '15px', fontFamily: 'Inter', fontWeight: '500' }} 
            className="text-white hover:text-[#AAD400]">
            Simulation Tool
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="flex items-center justify-center min-h-screen bg-cover bg-center" 
        style={{ backgroundImage: 'url(/bg-images/hero-bg-image.png)' }}>
        {/* Hero section content can go here */}
      </section>

      {/* Main Content Area: Displays features*/}
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
