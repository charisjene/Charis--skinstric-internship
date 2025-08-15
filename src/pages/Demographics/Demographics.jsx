import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Demographics.css';

const Demographics = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [demographics, setDemographics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('race');
  const [selectedRace, setSelectedRace] = useState(null);
  const [selectedAge, setSelectedAge] = useState(null);
  const [selectedSex, setSelectedSex] = useState(null);

  // Mock age and sex data for modals
  const ageRanges = [
    { range: '0-9', confidence: 0 },
    { range: '10-19', confidence: 4 },
    { range: '20-29', confidence: 96 },
    { range: '30-39', confidence: 2 },
    { range: '40-49', confidence: 0 },
    { range: '50-59', confidence: 0 },
    { range: '60-69', confidence: 0 },
    { range: '70+', confidence: 0 }
  ];

  const sexOptions = [
    { option: 'Male', confidence: 48 },
    { option: 'Female', confidence: 52 }
  ];

  useEffect(() => {
    const loadDemographicsData = () => {
      try {
        let demographicsData = location.state?.demographicsData;
        
        if (!demographicsData) {
          const storedData = localStorage.getItem('skinstric_demographics');
          if (storedData) {
            demographicsData = JSON.parse(storedData);
          }
        }
        
        if (demographicsData) {
          setDemographics(demographicsData);
          if (demographicsData.race_confidences?.length > 0) {
            setSelectedRace(demographicsData.race_confidences[0].race);
          } else if (demographicsData.race) {
            setSelectedRace(demographicsData.race);
          }
          
          // Set initial age and sex selections
          setSelectedAge(demographicsData.age || '20-29');
          setSelectedSex(demographicsData.sex || 'Female');
        } else {
          setError('No demographic data available. Please retake the photo.');
        }
      } catch (err) {
        console.error('Error loading demographics data:', err);
        setError(`Error loading demographic data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadDemographicsData();
  }, [location.state]);

  const handleBack = () => {
    navigate('/analysis');
  };

  const handleTabClick = (tab) => {
    setSelectedTab(tab);
    // No modals - just change the selected tab to update the display
  };

  const handleRaceSelection = (race) => {
    setSelectedRace(race);
    setSelectedTab('race');
  };

  const handleAgeSelection = (age) => {
    setSelectedAge(age);
  };

  const handleSexSelection = (sex) => {
    setSelectedSex(sex);
  };

  const handleReset = () => {
    // Reset to default values
    if (demographics?.race_confidences?.length > 0) {
      setSelectedRace(demographics.race_confidences[0].race);
    }
    setSelectedAge(demographics?.age || '20-29');
    setSelectedSex(demographics?.sex || 'Female');
    setSelectedTab('race');
  };

  const handleConfirm = () => {
    // Handle confirmation logic
    console.log('Confirmed demographics:', {
      race: selectedRace,
      age: selectedAge,
      sex: selectedSex
    });
    // Navigate to next step or show confirmation
    alert('Demographics confirmed!');
  };

  const getSelectedValue = () => {
    switch (selectedTab) {
      case 'race':
        return selectedRace || demographics?.race || 'Unknown';
      case 'age':
        return selectedAge || demographics?.age || 'Unknown';
      case 'sex':
        return selectedSex || demographics?.sex || 'Unknown';
      default:
        return 'Unknown';
    }
  };

  const getSelectedConfidence = () => {
    if (selectedTab === 'race' && demographics?.race_confidences) {
      const raceData = demographics.race_confidences.find(
        (item) => item.race === selectedRace
      );
      return raceData?.confidence || 0;
    } else if (selectedTab === 'age') {
      const ageData = ageRanges.find(item => item.range === selectedAge);
      return ageData?.confidence || 96;
    } else if (selectedTab === 'sex') {
      const sexData = sexOptions.find(item => item.option === selectedSex);
      return sexData?.confidence || 52;
    }
    return demographics?.confidence_score || 85;
  };

  if (isLoading) {
    return (
      <div className="demographics-wrapper">
        <div className="demographics-header">
          <div className="nav-breadcrumb">
            <span className="nav-logo">SKINSTRIC</span>
            <span className="nav-divider">|</span>
            <span className="nav-section">ANALYSIS</span>
          </div>
          <div className="title-section">
            <h1 className="page-title">DEMOGRAPHICS</h1>
            <p className="page-subtitle">LOADING...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="demographics-wrapper">
        <div className="demographics-header">
          <div className="nav-breadcrumb">
            <span className="nav-logo">SKINSTRIC</span>
            <span className="nav-divider">|</span>
            <span className="nav-section">ANALYSIS</span>
          </div>
          <div className="title-section">
            <h1 className="page-title">DEMOGRAPHICS</h1>
            <p className="page-subtitle">ERROR</p>
          </div>
        </div>
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={() => navigate('/camera')} className="retry-button">
            Retake Photo
          </button>
        </div>
        <button className="back-button" onClick={handleBack}>
          <span className="back-arrow">◀</span>
          <span className="back-text">BACK</span>
        </button>
      </div>
    );
  }

  return (
    <div className="demographics-wrapper">
      {/* Header */}
      <div className="demographics-header">
        <div className="nav-breadcrumb">
          <span className="nav-logo">SKINSTRIC</span>
          <div className="nav-divider">
          <span className="nav-section">ANALYSIS</span>
          </div>
        </div>
        <div className="title-section">
          <h1 className="page-title">DEMOGRAPHICS</h1>
          <p className="page-subtitle">PREDICTED RACE & AGE</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="demographics-content">
        {/* Left Panel - Category Tabs */}
        <div className="left-panel">
          <div
            className={`category-tab ${selectedTab === 'race' ? 'active' : ''}`}
            onClick={() => handleTabClick('race')}
          >
            <div className="tab-value">{selectedRace || demographics?.race || 'Unknown'}</div>
            <div className="tab-label">RACE</div>
          </div>
          <div
            className={`category-tab ${selectedTab === 'age' ? 'active' : ''}`}
            onClick={() => handleTabClick('age')}
          >
            <div className="tab-value">{selectedAge || demographics?.age || 'Unknown'}</div>
            <div className="tab-label">AGE</div>
          </div>
          <div
            className={`category-tab ${selectedTab === 'sex' ? 'active' : ''}`}
            onClick={() => handleTabClick('sex')}
          >
            <div className="tab-value">{selectedSex || demographics?.sex || 'Unknown'}</div>
            <div className="tab-label">SEX</div>
          </div>
        </div>

       {/* Center Panel - Selected Value & Confidence */}
        <div className="center-panel">
          <div className="selected-value-top">{getSelectedValue()}</div>
          
          {/* Confidence Circle */}
          <div className="confidence-circle">
            <svg className="circle-svg" viewBox="0 0 200 200">
              <circle
                className="circle-background"
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="#f0f0f0"
                strokeWidth="8"
              />
              <circle
                className="circle-progress"
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="#000"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 90}
                strokeDashoffset={
                  2 * Math.PI * 90 - (getSelectedConfidence() / 100) * 2 * Math.PI * 90
                }
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: '100px 100px',
                  transition: 'stroke-dashoffset 0.5s ease'
                }}
              />
            </svg>
            <div className="confidence-percentage">{getSelectedConfidence()}%</div>
          </div>
        </div>


        {/* Right Panel - Dynamic List based on selected tab */}
        <div className="right-panel">
          <div className="list-header">
            <span className="header-race">
              {selectedTab === 'race' ? 'RACE' : 
               selectedTab === 'age' ? 'AGE' : 'SEX'}
            </span>
            <span className="header-confidence">A.I. CONFIDENCE</span>
          </div>
          <div className="race-list">
            {selectedTab === 'race' && (
              demographics?.race_confidences?.map((item, index) => (
                <div
                  key={index}
                  className={`race-item ${selectedRace === item.race ? 'selected' : ''}`}
                  onClick={() => handleRaceSelection(item.race)}
                >
                  <div className="race-checkbox">
                    <span className={`checkbox ${selectedRace === item.race ? 'checked' : ''}`}>
                      {selectedRace === item.race ? '◆' : '◇'}
                    </span>
                  </div>
                  <div className="race-name">{item.race}</div>
                  <div className="race-confidence">{item.confidence}%</div>
                </div>
              )) || (
                <div className="no-data">No detailed race data available</div>
              )
            )}
            
            {selectedTab === 'age' && (
              ageRanges.map((item, index) => (
                <div
                  key={index}
                  className={`race-item ${selectedAge === item.range ? 'selected' : ''}`}
                  onClick={() => handleAgeSelection(item.range)}
                >
                  <div className="race-checkbox">
                    <span className={`checkbox ${selectedAge === item.range ? 'checked' : ''}`}>
                      {selectedAge === item.range ? '◆' : '◇'}
                    </span>
                  </div>
                  <div className="race-name">{item.range}</div>
                  <div className="race-confidence">{item.confidence}%</div>
                </div>
              ))
            )}
            
            {selectedTab === 'sex' && (
              sexOptions.map((item, index) => (
                <div
                  key={index}
                  className={`race-item ${selectedSex === item.option ? 'selected' : ''}`}
                  onClick={() => handleSexSelection(item.option)}
                >
                  <div className="race-checkbox">
                    <span className={`checkbox ${selectedSex === item.option ? 'checked' : ''}`}>
                      {selectedSex === item.option ? '◆' : '◇'}
                    </span>
                  </div>
                  <div className="race-name">{item.option}</div>
                  <div className="race-confidence">{item.confidence}%</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bottom-section">
        {/* Back Button */}
         <button className="demographics-back-btn" onClick={handleBack}>
          <div className="back-btn-diamond">
            <span className="back-arrow">◀</span>
          </div>
          <span className="back-text">BACK</span>
        </button>

        {/* Correction Text */}
        <div className="correction-text">
          If A.I. estimate is wrong, select the correct one.
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="reset-button" onClick={handleReset}>
            RESET
          </button>
          <button className="confirm-button" onClick={handleConfirm}>
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
};

export default Demographics;