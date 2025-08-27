import React from 'react';
import './RotatingDiamonds.css';


import ResDiamondLarge from '../../assets/resDiamondLarge.svg';

const RotatingDiamonds = ({ icon, onClick, alt = "icon", loadingText }) => {
  return (
    <div className="diamond-wrapper">
      {/* Use the same SVG for all three diamonds, scaled via CSS */}
      <img src={ResDiamondLarge} alt="Diamond Large" className="diamond large" />
      <img src={ResDiamondLarge} alt="Diamond Medium" className="diamond medium" />
      <img src={ResDiamondLarge} alt="Diamond Small" className="diamond small" />
      
      <img src={icon} alt={alt} className="center-icon" onClick={onClick} />

      {loadingText && (
        <div className="loading-text-overlay">
          <p className="loading-text">{loadingText}</p>
          <p className="loading-subtitle">TO GET BETTER RESULTS MAKE SURE TO HAVE</p>
          <div className="loading-indicators">
            <span className="indicator-text">◇ NEUTRAL EXPRESSION</span>
            <span className="indicator-text">◇ FRONTAL POSE</span>
            <span className="indicator-text">◇ ADEQUATE LIGHTING</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RotatingDiamonds;