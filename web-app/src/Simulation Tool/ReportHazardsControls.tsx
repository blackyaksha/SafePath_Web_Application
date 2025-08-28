import React, { useState } from 'react';
import { IconButton, styled, Radio, RadioGroup, Checkbox, FormControlLabel } from '@mui/material';
import Switch, { SwitchProps } from '@mui/material/Switch';
import Autosuggest from 'react-autosuggest';
import './SimulationTool.css';


function ReportHazardsControls() {

  
  return (
    <div className="explore-map-controls">
        <div className="report-control"
            style={{
                backgroundImage: "url('/bg-images/bg8.png')",  // ✅ Direct public path
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}        
        >
            {/* ✅ White overlay div */}
            <div 
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(255, 255, 255, 0.55)", // ✅ 75% transparent white
                    borderRadius: '10px'
                }}
            />
            <h3 style={{ fontFamily: "Inter", fontWeight: "600", fontSize: "13.5px", zIndex: 1 }}>Want to help us improve this tool?</h3>
            <button 
            style={{
                border: "1px solid #CECECE",
                padding: "8px 16px",
                borderRadius: "7px",
                backgroundColor: "#302F2D",
                cursor: "pointer",
                fontWeight: "500",
                marginTop: "10px",
                fontSize: "12px",
                color: "white",
                display: "flex", // ✅ Aligns text & icon properly
                alignItems: "center", // ✅ Centers items vertically
                justifyContent: "center", // ✅ Ensures even spacing
                gap: "2px", // ✅ Adds spacing between text and icon
                zIndex: 1,
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            }}
            className="report-button hover:bg-[#ffffff]"
            onClick={() => window.open("/report-a-hazard", "_blank")}
            >
            <span>Report a hazard</span>
            <span className="material-icons icon text-[18px]">arrow_outward</span>
            </button>
        </div>
    </div>

  );
}

export default ReportHazardsControls;
