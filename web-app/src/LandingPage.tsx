import { useRef, useState, useEffect } from "react";
import "./LandingPage.css";
import SignInModal from "./Modal Components/SignIn"; // Import SignIn Modal
import SignUpModal from "./Modal Components/SignUp"; // Import SignUp Modal

function LandingPage() {
  const [isSignInOpen, setSignInOpen] = useState(false);
  const [isSignUpOpen, setSignUpOpen] = useState(false);
  const [logoSrc, setLogoSrc] = useState("/logo/SafePath-Text-ForDarkBG.png"); // Dynamic logo state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isHeroVisible, setHeroVisible] = useState(true);

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

  const mainContentRef = useRef<HTMLDivElement | null>(null); // ref for Main Content Area
  const downloadMobileAppRef = useRef<HTMLDivElement | null>(null); // ref for Download Mobile App
  const heroSectionRef = useRef<HTMLDivElement | null>(null); // Ref for Hero Section

  const copyEmail = () => {
    navigator.clipboard.writeText("safepath@proton.me");
    alert("Email address copied to clipboard!");
  };

  const copyPhone = () => {
    navigator.clipboard.writeText("9655076304");
    alert("Phone number copied to clipboard!");
  };

  const scrollToMainContent = () => {
    mainContentRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToDownloadMobileApp = () => {
    downloadMobileAppRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const features = [
    {
      icon: "map",
      name: "3D MAP VIEW",
      description:
        "View a beautifully detailed 3D representation of the area for better situational awareness.",
    },
    {
      icon: "directions",
      name: "OPTIMIZE EVACUATION ROUTES",
      description: "Generate the safest and fastest routes during emergencies.",
    },
    {
      icon: "warning",
      name: "SIMULATE HAZARDS",
      description:
        "Simulate various hazards to better prepare for real-life scenarios.",
    },
    {
      icon: "location_city",
      name: "IDENTIFY AREAS & ENTITIES AFFECTED BY HAZARDS",
      description: "Identify the regions and populations impacted by hazards.",
    },
    {
      icon: "report_problem",
      name: "REPORT HAZARDS",
      description: "Quickly report hazards for real-time updates and alerts.",
    },
  ];

  const [startIndex, setStartIndex] = useState(0);

  const handleNext = () => {
    setStartIndex((prevIndex) => (prevIndex + 1) % features.length);
  };

  const handlePrevious = () => {
    setStartIndex(
      (prevIndex) => (prevIndex - 1 + features.length) % features.length
    );
  };

  const visibleFeatures = [
    features[(startIndex + 3) % features.length],
    features[(startIndex + 4) % features.length],
    features[startIndex],
    features[(startIndex + 1) % features.length],
    features[(startIndex + 2) % features.length],
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === heroSectionRef.current) {
            setHeroVisible(entry.isIntersecting);
          }
          if (entry.isIntersecting) {
            if (entry.target === heroSectionRef.current) {
              setLogoSrc("/logo/SafePath-Text-ForDarkBG.png");
            } else if (
              entry.target === mainContentRef.current ||
              entry.target === downloadMobileAppRef.current
            ) {
              setLogoSrc("/logo/SafePath-Text-ForLightBG.png");
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    if (heroSectionRef.current) observer.observe(heroSectionRef.current);
    if (mainContentRef.current) observer.observe(mainContentRef.current);
    if (downloadMobileAppRef.current)
      observer.observe(downloadMobileAppRef.current);

    return () => {
      if (heroSectionRef.current) observer.unobserve(heroSectionRef.current);
      if (mainContentRef.current) observer.unobserve(mainContentRef.current);
      if (downloadMobileAppRef.current)
        observer.unobserve(downloadMobileAppRef.current);
    };
  }, []);

  // Intersection Observer logic to change the logo dynamically
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === heroSectionRef.current) {
              setLogoSrc("/logo/SafePath-Text-ForDarkBG.png"); // Dark background logo (Hero section)
            } else if (
              entry.target === mainContentRef.current ||
              entry.target === downloadMobileAppRef.current
            ) {
              setLogoSrc("/logo/SafePath-Text-ForLightBG.png"); // Light background logo
            }
          }
        });
      },
      { threshold: 0.5 } // Trigger when 50% of the section is visible
    );

    if (heroSectionRef.current) observer.observe(heroSectionRef.current);
    if (mainContentRef.current) observer.observe(mainContentRef.current);
    if (downloadMobileAppRef.current)
      observer.observe(downloadMobileAppRef.current);

    return () => {
      if (heroSectionRef.current) observer.unobserve(heroSectionRef.current);
      if (mainContentRef.current) observer.unobserve(mainContentRef.current);
      if (downloadMobileAppRef.current)
        observer.unobserve(downloadMobileAppRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-5 left-0 w-full bg-[#FFFFFF]/0 py-4 flex items-center justify-center z-10">
        <div className="relative w-full max-w-[412px] flex justify-center">
          <div className="absolute md:left-[-500px] left-[15px] flex items-center">
            <a href="/" className="flex items-center">
              <img
                src="/logo/SafePath-Logos.png"
                alt="SafePath Logo"
                className="h-[70px] w-[70px]"
              />
              <img
                src={logoSrc}
                alt="SafePath Text"
                className="h-[33px] w-[150px]"
              />
            </a>
          </div>

          {/* --- HAMBURGER MENU BUTTON for MOBILE --- */}
          <button
            className="md:hidden absolute right-4 top-3 z-20 p-2 focus:outline-none"
            aria-label="Open navigation menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {/* Hamburger (SVG) */}
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect
                y="7"
                width="32"
                height="3"
                rx="1.5"
                fill={isHeroVisible ? "white" : "#292929"}
              />{" "}
              {/* change color */}
              <rect
                y="15"
                width="32"
                height="3"
                rx="1.5"
                fill={isHeroVisible ? "white" : "#292929"}
              />
              <rect
                y="23"
                width="32"
                height="3"
                rx="1.5"
                fill={isHeroVisible ? "white" : "#292929"}
              />
            </svg>
          </button>
          {/* -------------------------------------- */}

          {/* --- NAVIGATION BUTTONS --- */}
          <div
            className={`
        bg-[#292929]/70 h-[64px] w-[355px] flex items-center justify-center rounded-[10px] header-shadow px-[36px]
        ${mobileMenuOpen ? "flex" : "hidden"} 
        md:flex /* Show on desktop always, on mobile only if open */
        absolute md:static top-20 right-4 md:right-auto md:top-auto z-20
        transition-all
      `}
            style={{
              // On mobile: floating menu
              ...(mobileMenuOpen && {
                position: "absolute",
                flexDirection: "column",
                width: "210px",
                height: "auto",
                boxShadow: "0 8px 32px rgba(0,0,0,0.33)",
              }),
            }}
          >
            <div className="flex md:space-x-9 flex-col md:flex-row w-full md:w-auto">
              <button className="header-container-buttons text-white hover:text-[#AAD400] w-full md:w-auto text-left md:text-center py-2 md:py-0">
                About
              </button>
              <button
                className="header-container-buttons text-white hover:text-[#AAD400] w-full md:w-auto text-left md:text-center py-2 md:py-0"
                onClick={() => window.open("/report-a-hazard", "_blank")}
              >
                Report a hazard
              </button>
              <button className="header-container-buttons text-white hover:text-[#AAD400] w-full md:w-auto text-left md:text-center py-2 md:py-0">
                Pricing
              </button>
              <button
                className="header-container-buttons text-white hover:text-[#AAD400] w-full md:hidden text-left md:text-center py-2 md:py-0"
                onClick={() => {
                  setSignInOpen(true);
                  setMobileMenuOpen(false);
                }}
              >
                Sign in
              </button>
              <button
                className="header-container-buttons text-white hover:text-[#AAD400] w-full md:hidden text-left md:text-center py-2 md:py-0"
                onClick={() => {
                  setSignUpOpen(true);
                  setMobileMenuOpen(false);
                }}
              >
                Create an account
              </button>
            </div>
          </div>

          <div className="absolute right-[-475px] top-0 h-16 items-center space-x-9 md:flex hidden">
            <button
              className="header-rightSide-buttons text-[#AAD400] sign-in-button"
              onClick={openSignInModal}
            >
              Sign in
            </button>
            <button
              className="header-rightSide-buttons text-[#ffffff] hover:bg-[#ffffff] hover:text-[#AAD400] create-account-button"
              onClick={openSignUpModal}
            >
              Create an account
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="flex items-center justify-center min-h-screen bg-cover bg-center hero-section"
        style={{ backgroundImage: "url(/bg-images/bg5.png)" }}
        ref={heroSectionRef} // Reference for IntersectionObserver
      >
        <div className="hero-text-container">
          <h1 className="Hero-Section-HeaderText text-white">
            Optimize your way <br className="mobile-break" /> out of disasters
          </h1>

          {/* Desktop version (visible on md and up) */}
          {/* Desktop version (visible on md and up) */}
          <h2 className="Hero-Section-SubheadingText text-[#f2f2f2] hidden md:block">
            Leverage our advanced mapping technology to simulate hazards,
            optimize evacuation routes,
            <br />
            and ensure safer and more efficient evacuations for everyone.
          </h2>

          {/* Mobile version (visible on small screens) */}
          <h2 className="Hero-Section-SubheadingText text-[#f2f2f2] block md:hidden">
            Leverage our advanced mapping technology to <br />
            simulate hazards, optimize evacuation routes, <br />
            and ensure safer and more efficient <br />
            evacuations for everyone.
          </h2>

          <div className="flex items-center">
            <button
              className="open-simulation-button hover:bg-[#ffffff] hover:text-[#AAD400]"
              onClick={() => window.open("/simulation-tool", "_blank")}
            >
              <span>Try Simulation Tool</span>
              <span className="material-icons icon">arrow_outward</span>
            </button>
            <button
              className="explore-features-button hover:bg-[#ffffff] text-[#ffffff] hover:text-[#AAD400]"
              onClick={scrollToMainContent}
            >
              <span>Explore Features</span>
            </button>
            <button
              className="download-mobileApp-button flex items-center hover:bg-[#ffffff] text-[#AAD400] hover:text-[#AAD400]"
              onClick={scrollToDownloadMobileApp}
            >
              <span className="material-icons icon">phone_android</span>
              <span>Download Mobile App</span>
            </button>
          </div>
        </div>
      </section>

      {/* Features and Download Mobile App Section */}
      <div
        className="features-and-download-section bg-cover"
        style={{ backgroundImage: "url(/bg-images/bg8.png)" }}
      >
<section
  className="main-content-lp flex items-center justify-center min-h-screen"
  ref={mainContentRef}
>
  <div className="text-center">
    <h2 className="features-text">Features</h2>

    <div className="flex flex-col md:flex-row items-center justify-center md:space-x-20 space-y-10 md:space-y-0 mt-8">
      {/* Video container */}
      <div className="demo-container">
        <video
          src="/feature-demo/3D Map View.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="demo-video"
        />
      </div>

      {/* Feature navigation container */}
      <div className="feature-navigation-container text-center">
        <button onClick={handlePrevious} className="navigate-button mb-6">
          <span className="material-icons">navigate_before</span>
        </button>
        <div className="feature-stack">
          {visibleFeatures.map((feature, index) => (
            <div
              key={index}
              className={`feature-item ${
                index === 2
                  ? "feature-size-large expandable middle-feature"
                  : index === 1 || index === 3
                  ? "feature-size-medium"
                  : "feature-size-small"
              }`}
            >
              <div className="feature-content">
                {index === 2 && (
                  <span className="material-icons feature-icon">
                    {feature.icon}
                  </span>
                )}
                <span className="feature-name">{feature.name}</span>
              </div>
              {index === 2 && (
                <p className="feature-description">{feature.description}</p>
              )}
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


        {/* Download Mobile App Section */}
        <section
          className="flex items-center justify-center min-h-screen"
          ref={downloadMobileAppRef}
        >
          <div className="flex items-center space-x-40">
            <div className="md:text-left text-center">
              <h2 className="download-mobileApp-headingText text-black mt-7 mb-2">
                Preparedness in your pocket
              </h2>
              <p className="hidden md:block download-mobileApp-subheadingText text-black mt-3">
                Get the latest optimized evacuation routes at your fingertips.
              </p>
              <p className="md:hidden download-mobileApp-subheadingText text-black mt-3">
                Get the latest optimized evacuation routes at your fingertips. Download our mobile app now!
              </p>
              <img
                src={"/section-display-images/MobileAppSplashScreen.png"}
                alt="Mobile App Splash Screen"
                className="mobileAppSplashScreen h-[590px] w-[288.59px] md:hidden mx-auto"
              />
              <p className="hidden md:block download-mobileApp-subheadingText text-black">
                Download our mobile app now!
              </p>
              <div className="flex md:justify-start justify-center space-x-5 mt-10 md:mb-0 mb-5">
                <a
                  href="https://www.apple.com/app-store/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="/section-display-images/AppStoreDownloadButton.png"
                    alt="Download on the App Store"
                    className="h-[49px]"
                  />
                </a>
                <a
                  href="https://play.google.com/store"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="/section-display-images/GooglePlayDownloadButton.png"
                    alt="Get it on Google Play"
                    className="h-[49px]"
                  />
                </a>
              </div>
            </div>
            <div className="hidden md:block">
              <img
                src={"/section-display-images/MobileAppSplashScreen.png"}
                alt="Mobile App Splash Screen"
                className="mobileAppSplashScreen h-[590px] w-[288.59px]"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer
        className="footer-section"
        style={{ backgroundImage: "url(/bg-images/footer-bg-image.png)" }}
      >
        <div className="footer-header">
          {/* Socials Section */}
          <div className="socials-text-container">
            <div className="socials-text">SOCIALS</div>
            <div className="social-icons">
              <button>
                <img
                  src="/icon-images/FB-icon-white.png"
                  alt="Facebook Logo"
                  className="social-icon"
                />
              </button>
              <button>
                <img
                  src="/icon-images/LinkedIn-icon-white.png"
                  alt="LinkedIn Logo"
                  className="social-icon"
                />
              </button>
            </div>
          </div>

          {/* Contact Us Section */}
          <div className="contact-us-container">
            <div className="contact-us-text">CONTACT US</div>
            <button className="contact-email" onClick={copyEmail}>
              <span className="material-icons mail-icon">mail</span>
              <span className="email-ad-text hover:text-[#AAD400]">
                safepath@proton.me
              </span>
            </button>
            <button className="contact-phone mt-[17px]" onClick={copyPhone}>
              <span className="material-icons call-icon">call</span>
              <span className="phone-text hover:text-[#AAD400]">
                +63 965 507 6304
              </span>
            </button>
          </div>

          {/* About Section */}
          <div className="about-text-container">
            <div className="about-text">ABOUT</div>
            <div className="about-links">
              <button className="about-link flex hover:text-[#AAD400]">
                <span>What is SafePath</span>
              </button>
              <button className="about-link flex hover:text-[#AAD400]">
                <span>The Team Behind SafePath</span>
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

        <div className="footer-divider"></div>

        {/* Footer Bottom Section */}
        <div className="footer-copyright-container">
          <div className="footer-copyright">
            © 2025 SafePath. All rights reserved.
          </div>
          <div className="footer-options">
            <a href="/terms" className="footer-option-link">
              Terms of Service
            </a>
            <a href="/careers" className="footer-option-link">
              Feedback
            </a>
            <a href="/help" className="footer-option-link">
              Help Center
            </a>
          </div>
        </div>
      </footer>

      {/* Sign Up Modal */}
      <SignUpModal
        isOpen={isSignUpOpen}
        onClose={closeSignUpModal}
        onSwitchToSignIn={openSignInModal}
      />

      {/* Sign In Modal */}
      <SignInModal
        isOpen={isSignInOpen}
        onClose={closeSignInModal}
        onSwitchToSignUp={openSignUpModal}
      />
    </div>
  );
}

export default LandingPage;
