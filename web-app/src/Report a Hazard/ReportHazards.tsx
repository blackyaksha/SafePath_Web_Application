import React from "react";
import { useState } from "react";
import "./ReportHazards.css";
import SignInModal from "../Modal Components/SignIn"; // Import SignIn Modal
import SignUpModal from "../Modal Components/SignUp"; // Import SignIn Modal
import {
  Checkbox,
  FormGroup,
  Radio,
  styled,
  RadioGroup,
  FormControlLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";

import {
  ZoomControl,
  MapContainer,
  TileLayer,
  Marker,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet-geosearch/dist/geosearch.css";

// Fix marker icons (Leaflet issue in React)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const SearchControl = () => {
  const map = useMap();

  React.useEffect(() => {
    const provider = new OpenStreetMapProvider();

    const searchControl = new (GeoSearchControl as any)({
      provider,
      style: "bar",
      showMarker: true,
      retainZoomLevel: false,
      animateZoom: true,
      autoClose: true,
      searchLabel: "Enter location",
      keepResult: true,
    });

    map.addControl(searchControl);

    return () => {
      map.removeControl(searchControl);
    };
  }, [map]);

  return null;
};

function ReportHazard() {
  const [selectedHazard, setSelectedHazard] = useState<string>(""); // State for selected hazard type
  const [obstructionError, setObstructionError] = useState(false);
  const [step, setStep] = useState(1); // Start at Section 1

  const [category, setCategory] = useState("");
  const [error, setError] = useState(false);
  const [obstructionOptions, setObstructionOptions] = useState({
    accident: false,
    dangerousConditions: false,
    trafficJam: false,
    roadWorks: false,
    brokenDownVehicle: false,
    debris: false,
  });

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const updatedOptions = {
      ...obstructionOptions,
      [event.target.name]: event.target.checked,
    };

    setObstructionOptions(updatedOptions);

    // Clear error immediately if any box is now checked
    if (selectedHazard === "route obstruction") {
      const isAnyChecked = Object.values(updatedOptions).some(Boolean);
      if (isAnyChecked) {
        setObstructionError(false);
      }
    }
  };

  const handleChange = (event: SelectChangeEvent<string>) => {
    setCategory(event.target.value);
  };

  // Handle radio button selection
  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedHazard((event.target as HTMLInputElement).value);
    if (error) setError(false);
  };

  const StyledRadio1 = styled(Radio)(({ theme }) => ({
    padding: theme.spacing(1), // Adjust padding to reduce button size
    "& .MuiSvgIcon-root": {
      fontSize: "20px", // Set smaller icon size
    },
    "&.Mui-checked": {
      color: "#AAD400", // Set the color when the radio button is selected
    },
    "&.MuiRadio-root": {
      color: "#000000", // Default color
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
      {/* Header */}
      <header className="fixed top-5 left-0 w-full bg-[#FFFFFF]/0 py-4 flex items-center justify-center z-50">
        <div className="relative w-full max-w-[412px] flex justify-center">
          <div className="absolute left-[-500px] flex items-center">
            <a href="/" className="flex items-center">
              <img
                src="/logo/SafePath-Logos.png"
                alt="SafePath Logo"
                className="h-[70px] w-[70px]"
              />
              <img
                src="/logo/SafePath-Text-ForLightBG.png"
                alt="SafePath Text"
                className="h-[33px] w-[150px]"
              />
            </a>
          </div>

          <div className="bg-[#292929]/70 h-[64px] w-[355px] flex items-center justify-center rounded-[10px] header-shadow px-[36px]">
            <div className="flex space-x-9">
              <button className="header-container-buttons text-white hover:text-[#AAD400]">
                About
              </button>
              <button
                className="header-container-buttons text-white hover:text-[#AAD400]"
                onClick={() => window.open("/report-a-hazard", "_blank")}
              >
                Report a hazard
              </button>
              <button className="header-container-buttons text-white hover:text-[#AAD400]">
                Pricing
              </button>
            </div>
          </div>

          <div className="absolute right-[-475px] top-0 h-16 flex items-center space-x-9">
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
        style={{ backgroundImage: "url(/bg-images/hero-bg-image.png)" }}
      >
        {/* Text in the center left of the hero section */}
        <div className="absolute left-[150px] top-1/2 transform -translate-y-1/2 z-50">
          <h1 className="Main-Section-HeaderText text-black text-start">
            Help us keep
            <br />
            communities safe
          </h1>
          <h2 className="Main-Section-SubheadingText text-black mt-3 text-start">
            Use this form to report hazards in your area to help us
            <br />
            improve our routing and navigation.
          </h2>
        </div>

        {/* White container on the right side */}
        <div className="report-form absolute right-20 top-1/2 transform -translate-y-1/2 bg-white p-8 rounded-lg z-10">
          <div className="report-container">
            {/* You can add any content inside the white container */}
            <h3 className="reportForm-header text-black font-semibold text-lg">
              Report a hazard
            </h3>
            {/* Add form or other content here */}

            {/* Gray container below the text */}
            {step === 1 && (
              <>
                <div
                  className="reportForm-subheading bg-gray-300 text-center flex items-center justify-center"
                  style={{ height: "35px", width: "439px", marginTop: "10px" }}
                >
                  <span className="">Section 1: Select hazard type</span>
                </div>

                <RadioGroup
                  name="hazardType"
                  className="report-radio-group"
                  value={selectedHazard}
                  onChange={handleRadioChange}
                >
                  <FormControlLabel
                    value="route obstruction"
                    control={<StyledRadio1 />}
                    label="Route Obstruction"
                  />

                  {selectedHazard === "route obstruction" && (
                    <FormGroup
                      style={{ marginLeft: "25px", marginTop: "-8px" }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={obstructionOptions.accident}
                            onChange={handleCheckboxChange}
                            name="accident"
                          />
                        }
                        label="Accident"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={obstructionOptions.dangerousConditions}
                            onChange={handleCheckboxChange}
                            name="dangerousConditions"
                          />
                        }
                        label="Dangerous Conditions"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={obstructionOptions.trafficJam}
                            onChange={handleCheckboxChange}
                            name="trafficJam"
                          />
                        }
                        label="Traffic Jam"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={obstructionOptions.roadWorks}
                            onChange={handleCheckboxChange}
                            name="roadWorks"
                          />
                        }
                        label="Road Works"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={obstructionOptions.brokenDownVehicle}
                            onChange={handleCheckboxChange}
                            name="brokenDownVehicle"
                          />
                        }
                        label="Broken Down Vehicle"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={obstructionOptions.debris}
                            onChange={handleCheckboxChange}
                            name="debris"
                          />
                        }
                        label="Debris (e.g. fallen tree, landslide, large objects)"
                      />
                      {obstructionError && (
                        <div className="text-red-600 text-[12px] mt-1 ml-2 mb-1">
                          Please select at least one route obstruction.
                        </div>
                      )}
                    </FormGroup>
                  )}

                  <FormControlLabel
                    value="flooded area"
                    control={<StyledRadio1 />}
                    label="Flooded Area"
                  />

                  <FormControlLabel
                    value="closed lane"
                    control={<StyledRadio1 />}
                    label="Closed Lanes"
                  />

                  <FormControlLabel
                    value="closed road"
                    control={<StyledRadio1 />}
                    label="Closed Road"
                  />
                </RadioGroup>

                {error && (
                  <div className="text-red-600 text-[12px] mt-1 ml-2">
                    Please select a hazard type before continuing.
                  </div>
                )}

                <button
                  className="next-button text-[#000000] hover:text-[#AAD400]"
                  onClick={() => {
                    const isRouteObstructionSelected =
                      selectedHazard === "route obstruction";
                    const isAnyCheckboxChecked =
                      Object.values(obstructionOptions).some(Boolean);

                    if (!selectedHazard) {
                      setError(true);
                      setObstructionError(false); // Don't show checkbox error if no hazard is selected
                    } else if (
                      isRouteObstructionSelected &&
                      !isAnyCheckboxChecked
                    ) {
                      setError(false);
                      setObstructionError(true); // Show checkbox error
                    } else {
                      setError(false);
                      setObstructionError(false);
                      setStep(2);
                      // Proceed to next step
                    }
                  }}
                >
                  Next
                  <span className="material-icons icon">arrow_forward</span>
                </button>
              </>
            )}
            {step === 2 && (
              <>
                <div
                  className="reportForm-subheading bg-gray-300 text-center flex items-center justify-center"
                  style={{ height: "35px", width: "439px", marginTop: "10px" }}
                >
                  <span>Section 2: Location</span>
                </div>
                <div
                  className="mt-4"
                  style={{ height: "300px", width: "439px" }}
                >
                  <MapContainer
                    center={[14.5995, 120.9842]} // Metro Manila default
                    zoom={13}
                    scrollWheelZoom={true}
                    style={{
                      height: "100%",
                      width: "100%",
                      borderRadius: "8px",
                    }}
                    zoomControl={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <ZoomControl position="topright" /> {/* Add this */}
                    <SearchControl />
                  </MapContainer>
                </div>

                <div className="flex justify-between mt-4 space-x-4">
                  <button
                    className="back-button text-[#000000] hover:text-[#AAD400] flex items-center space-x-1"
                    onClick={() => setStep(1)}
                  >
                    <span className="material-icons icon">arrow_back</span>
                    <span>Back</span>
                  </button>
                  <button className="submit-button text-[#000000] hover:text-[#AAD400] flex items-center space-x-1">
                    <span>Submit</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

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
