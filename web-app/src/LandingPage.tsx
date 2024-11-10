import React from 'react';
import { useRef, useState } from 'react';
import './LandingPage.css';

function LandingPage() {

  const mainContentRef = useRef<HTMLDivElement | null>(null);       // ref for Main Content Area
  const downloadMobileAppRef = useRef<HTMLDivElement | null>(null); // ref for Download Mobile App

  const copyEmail = () => {
    navigator.clipboard.writeText("safepath@proton.me");
    alert("Email address copied to clipboard!");
  };

  const copyPhone = () => {
    navigator.clipboard.writeText("9655076304");
    alert("Phone number copied to clipboard!");
  };

  // Scroll function for the "Explore Features" button
  const scrollToMainContent = () => {
    mainContentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll function for the "Download Mobile App" button
  const scrollToDownloadMobileApp = () => {
    downloadMobileAppRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Array of features to display in circular motion
  const features = [
    "3D MAP VIEW", "OPTIMIZE EVACUATION ROUTES", 
    "VIEW & SIMULATE HAZARDS", 
    "IDENTIFY AREAS & ENTITIES AFFECTED BY HAZARDS", 
    "REPORT EXISTING & POTENTIAL HAZARDS"
  ];
  const [startIndex, setStartIndex] = useState(0); // Start index for visible features


  // Handle circular navigation
  const handleNext = () => {
    setStartIndex((prevIndex) => (prevIndex + 1) % features.length);
  };

  const handlePrevious = () => {
    setStartIndex((prevIndex) => (prevIndex - 1 + features.length) % features.length);
  };

  // Calculate the displayed features based on the current index
  const visibleFeatures = [
    features[(startIndex + 3) % features.length],
    features[(startIndex + 4) % features.length],
    features[startIndex],
    features[(startIndex + 1) % features.length],
    features[(startIndex + 2) % features.length],
  ];

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
        className="flex items-center justify-center min-h-screen bg-cover bg-center hero-section" 
        style={{ backgroundImage: 'url(/bg-images/hero-bg-image.png)' }}>
        
        {/* Text in the center left of the hero section */}
        <div className="absolute left-20 top-1/2 transform -translate-y-1/2">
          <h1 className="Hero-Section-HeaderText text-black">Optimize your way out of disasters</h1>
          <h2 className="Hero-Section-SubheadingText text-black mt-3">Utilize our advanced mapping technology for safer evacuations.</h2>

        
          <div className="flex items-center">
            {/* Button for Open Simulation Tool */}
            <button 
              className="open-simulation-button hover:bg-[#302F2D] hover:text-[#dddddd]"
              onClick={() => window.open('/simulation-tool', '_blank')}
            >
              <span>Open Simulation Tool</span>
              <span className="material-icons icon">arrow_outward</span>
            </button>
            <button 
              className="explore-features-button text-[#000000] hover:text-[#AAD400]"
              onClick={scrollToMainContent}  // Attach scroll function
            >
              <span>Explore Features</span>
            </button>  
            <button 
              className="download-mobileApp-button flex items-center text-[#AAD400] hover:text-[#C4C98C]"
              onClick={scrollToDownloadMobileApp}  // Attach scroll function
            >
              <span className="material-icons icon">phone_android</span>
              <span>Download Mobile App</span>
            </button>  
          </div>
        </div>
      </section>

      {/* Main Content Area: Displays features */}
      <section className="flex items-center justify-center min-h-screen bg-white" ref={mainContentRef}>
        <div className="text-center">
          <h2 className="features-text">Features</h2>
          
          <div className="flex items-center justify-center space-x-20 mt-8">
            {/* Container for video demo */}
            <div className="demo-container">
              {/* Placeholder for video demo */}
            </div>

            {/* Feature navigation and stack */}
            <div className="feature-navigation-container text-center">
              <button onClick={handlePrevious} className="navigate-button mb-6">
                <span className="material-icons">navigate_before</span>
              </button>

              <div className={`feature-stack`}>
                {visibleFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className={`feature-item feature-size-${index === 2 ? 'large' : index === 1 || index === 3 ? 'medium' : 'small'}`}
                  >
                    {feature}
                  </div>
                ))}
              </div>

              <button onClick={handleNext} className="navigate-button mt-6">
                <span className="material-icons">navigate_next</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Download Mobile App: Displays Download Link for Mobile App */}
      <section 
        className="flex items-center justify-center min-h-screen bg-white"
        ref={downloadMobileAppRef}
      >
        <div className="flex items-center space-x-40">
          {/* Text Section */}
          <div className="text-left">
            <h2 className="download-mobileApp-headingText text-black mt-7 mb-2">Preparedness in your pocket</h2>
            <p className="download-mobileApp-subheadingText text-black mt-3">Get the latest optimized evacuation routes at your fingertips.</p>
            <p className="download-mobileApp-subheadingText text-black">Download our mobile app now!</p>

            {/* Download Buttons */}
            <div className="flex space-x-5 mt-10">
              <a href="https://www.apple.com/app-store/" target="_blank" rel="noopener noreferrer">
                <img 
                  src="/section-display-images/AppStoreDownloadButton.png" 
                  alt="Download on the App Store" 
                  className="h-[49px]" 
                />
              </a>
              <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer">
                <img 
                  src="/section-display-images/GooglePlayDownloadButton.png" 
                  alt="Get it on Google Play" 
                  className="h-[49px]" 
                />
              </a>
              <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer">
                <img 
                  src="/section-display-images/FDroidDownloadButton.png" 
                  alt="Get it on F-Droid" 
                  className="h-[49px]" 
                />
              </a>
            </div>
          </div>

          {/* Image Section */}
          <div>
            <img 
              src={"/section-display-images/MobileAppSplashScreen.png"} 
              alt="Mobile App Splash Screen" 
              className="mobileAppSplashScreen h-[590px] w-[288.59px]" 
            />
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

    </div>
  );
}

export default LandingPage;