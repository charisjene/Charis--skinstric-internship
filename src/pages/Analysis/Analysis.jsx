import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Analysis.css';

const Analysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const analysisData = location.state?.analysisData;

  useEffect(() => {
    // Check if we have analysis data (from gallery upload)
    if (analysisData) {
      console.log('Analysis data received:', analysisData);
      // If we have data from gallery upload, skip the analyzing animation
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    } else {
      // Simulate analysis process for camera photos
      const analyzeTimer = setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisComplete(true);
      }, 3000); // 3 seconds for analysis

      return () => clearTimeout(analyzeTimer);
    }
  }, [analysisData]);

  const handleBack = () => {
    // Determine where to go back based on data source
    if (analysisData?.source === 'gallery') {
      navigate('/facescan');
    } else {
      navigate('/camera');
    }
  };

  const handleGetSummary = () => {
    // Navigate to summary or next step
    navigate('/summary'); // Update with your next route
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    
    if (category === 'demographics') {
      // Get demographics data from various sources
      let demographicsData = null;
      let photoData = null;

      // Try to get data from analysis state (gallery upload or camera)
      if (analysisData?.demographicsData) {
        demographicsData = analysisData.demographicsData;
        photoData = analysisData.photoData;
        console.log('Using demographics data from analysisData:', demographicsData);
      } else {
        // Try to get data from localStorage (fallback)
        try {
          const storedDemographics = localStorage.getItem('skinstric_demographics');
          const storedPhoto = localStorage.getItem('skinstric_captured_photo');
          
          if (storedDemographics) {
            demographicsData = JSON.parse(storedDemographics);
            console.log('Using demographics data from localStorage:', demographicsData);
          }
          if (storedPhoto) {
            photoData = storedPhoto;
          }
        } catch (err) {
          console.error('Error loading stored data:', err);
        }
      }

      // Debug logging
      console.log('Demographics data check:', {
        hasAnalysisData: !!analysisData,
        hasDemographicsData: !!demographicsData,
        demographicsData: demographicsData,
        hasPhotoData: !!photoData
      });

      if (demographicsData) {
        navigate('/demographics', { 
          state: { 
            demographicsData,
            photoData,
            source: analysisData?.source || 'unknown'
          } 
        });
      } else {
        // If no demographics data is available, create mock data and proceed
        console.warn('No demographic data available, creating mock data');
        const mockData = generateMockDemographics();
        localStorage.setItem('skinstric_demographics', JSON.stringify(mockData));
        
        navigate('/demographics', { 
          state: { 
            demographicsData: mockData,
            photoData: photoData || null,
            source: 'mock_fallback'
          } 
        });
      }
    } else {
      // Handle other categories as needed
      console.log(`Category ${category} clicked`);
      // You can implement other analysis categories here
      // For now, show a placeholder message
      alert(`${category.toUpperCase()} analysis coming soon!`);
    }
  };

  // Function to generate mock demographic data as fallback
  const generateMockDemographics = () => {
    const races = ['White', 'Black', 'Asian', 'Hispanic', 'Middle Eastern', 'Indian'];
    const ages = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
    const sexes = ['Male', 'Female'];
    
    // Generate random confidences
    const raceConfidences = races.map(race => ({
      race,
      confidence: Math.floor(Math.random() * 30) + 10 // 10-40% confidence
    }));
    
    // Normalize to 100%
    const total = raceConfidences.reduce((sum, item) => sum + item.confidence, 0);
    raceConfidences.forEach(item => {
      item.confidence = Math.round((item.confidence / total) * 100);
    });
    
    // Sort by confidence descending
    raceConfidences.sort((a, b) => b.confidence - a.confidence);
    
    return {
      race: raceConfidences[0].race,
      age: ages[Math.floor(Math.random() * ages.length)],
      sex: sexes[Math.floor(Math.random() * sexes.length)],
      race_confidences: raceConfidences,
      confidence_score: raceConfidences[0].confidence,
      timestamp: new Date().toISOString(),
      source: 'mock_fallback',
      isMockData: true
    };
  };

  return (
    <div className="analysis-wrapper">
      {/* Navigation */}
      <div className="analysis-nav">
        <span className="nav-logo">SKINSTRIC</span>
        <div className="nav-divider">
        <span className="nav-section">ANALYSIS</span>
        </div>
      </div>

      {/* Top Label */}
      <div className="analysis-header">
        <h2 className="analysis-title">A.I. ANALYSIS</h2>
        <p className="analysis-subtitle">
          A.I. HAS ESTIMATED THE FOLLOWING.<br />
          FIX ESTIMATED INFORMATION IF NEEDED.
        </p>
      </div>

      <main className="analysis-main">
        {isAnalyzing ? (
          // Analyzing State
          <section className="analyzing-section">
            <div className="analyzing-container">
              <div className="diamond-container">
                <div className="analysis-diamond analysis-diamond-1 rotating"></div>
                <div className="analysis-diamond analysis-diamond-2 rotating-slow"></div>
                <div className="analysis-diamond analysis-diamond-3 rotating-slower"></div>
                
                <div className="inner-content">
                  <h3 className="analyzing-text">ANALYZING...</h3>
                  <div className="progress-dots">
                    <span className="dot active"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="results-section">
            <div className="diamond-grid-container">
              {/* Outer dashed diamond */}
              <div className="outer-diamond-border"></div>
              <div className="outer-diamond-border-2"></div>
              <div className="outer-diamond-border-3"></div>
              <div className="diamond-grid">
                {/* Demographics - Top */}
                <button 
                  className={`category-diamond top-diamond ${selectedCategory === 'demographics' ? 'selected' : ''}`}
                  onClick={() => handleCategoryClick('demographics')}
                >
                  <div className="diamond-content">
                    <span className="category-label">DEMOGRAPHICS</span>
                  </div>
                </button>

                {/* Skin Type Details - Left */}
                <button 
                  className={`category-diamond left-diamond ${selectedCategory === 'skintype' ? 'selected' : ''}`}
                  onClick={() => handleCategoryClick('skintype')}
                >
                  <div className="diamond-content">
                    <span className="category-label">SKIN TYPE<br />DETAILS</span>
                  </div>
                </button>

                {/* Cosmetic Concerns - Right */}
                <button 
                  className={`category-diamond right-diamond ${selectedCategory === 'cosmetic' ? 'selected' : ''}`}
                  onClick={() => handleCategoryClick('cosmetic')}
                >
                  <div className="diamond-content">
                    <span className="category-label">COSMETIC<br />CONCERNS</span>
                  </div>
                </button>

                {/* Weather - Bottom */}
                <button 
                  className={`category-diamond bottom-diamond ${selectedCategory === 'weather' ? 'selected' : ''}`}
                  onClick={() => handleCategoryClick('weather')}
                >
                  <div className="diamond-content">
                    <span className="category-label">WEATHER</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Show data source indicator */}
            {/* {analysisData?.source && (
              <div className="data-source-indicator">
                <p className="source-text">
                  Source: {analysisData.source === 'gallery' ? 'Gallery Upload' : 'Camera Capture'}
                </p>
              </div>
            )} */}
          </section>
        )}

        {/* Back button - always visible */}
        <button className="analysis-back-btn" onClick={handleBack}>
          <div className="back-btn-diamond">
            <span className="back-arrow">◀</span>
          </div>
          <span className="back-text">BACK</span>
        </button>

        {/* Get Summary button - visible when analysis is complete */}
        {analysisComplete && !isAnalyzing && (
          <button className="get-summary-btn" onClick={handleGetSummary}>
            <span className="summary-text">GET SUMMARY</span>
            <div className="summary-btn-diamond">
              <span className="summary-arrow">▶</span>
            </div>
          </button>
        )}
      </main>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info" style={{ 
          position: 'absolute', 
          top: '10px', 
          right: '10px', 
          background: 'rgba(0,0,0,0.8)', 
          color: 'white', 
          padding: '10px', 
          fontSize: '12px',
          borderRadius: '4px',
          maxWidth: '300px',
          overflow: 'auto'
        }}>
          <details>
            <summary>Debug: Analysis Data</summary>
            <pre>{JSON.stringify(analysisData, null, 2)}</pre>
          </details>
          <details style={{ marginTop: '10px' }}>
            <summary>Debug: LocalStorage</summary>
            <pre>
              Demographics: {localStorage.getItem('skinstric_demographics')?.substring(0, 200)}...
              {'\n'}
              Photo: {localStorage.getItem('skinstric_captured_photo') ? 'Available' : 'Not found'}
              {'\n'}
              User Data: {localStorage.getItem('skinstric_user_data')}
            </pre>
          </details>
          <button 
            onClick={() => {
              console.log('=== DEBUG DATA ===');
              console.log('analysisData:', analysisData);
              console.log('localStorage demographics:', localStorage.getItem('skinstric_demographics'));
              console.log('localStorage photo:', localStorage.getItem('skinstric_captured_photo') ? 'Available' : 'Not found');
            }}
            style={{
              marginTop: '10px',
              padding: '5px 10px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Log Debug Data
          </button>
        </div>
      )}
    </div>
  );
};

export default Analysis;