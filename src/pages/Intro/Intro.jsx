import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Intro.css';
import Nav from '../../Nav';

const Intro = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    location: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const mirrorRef = useRef(null);
  const [inputWidth, setInputWidth] = useState(0);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('skinstric_user_data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData({
          name: parsedData.name || '',
          location: parsedData.location || ''
        });
      } catch (err) {
        console.error('Error loading saved data:', err);
      }
    }
  }, []);

  // Get current value and placeholder
  const currentValue = currentStep === 1 ? formData.name : formData.location;
  const currentPlaceholder = currentStep === 1 ? "Introduce Yourself" : "Where are you from?";

  // Calculate maximum width based on screen size and diamond constraints
  const getMaxInputWidth = () => {
    const screenWidth = window.innerWidth;
    if (screenWidth >= 768) return 280; // Desktop
    if (screenWidth >= 640) return 140; // Tablet
    if (screenWidth >= 480) return 120; // Mobile
    return 100; // Small mobile
  };

  // Update input width to match text or placeholder, but constrain to diamond
  useEffect(() => {
    if (mirrorRef.current) {
      const measuredWidth = mirrorRef.current.offsetWidth + 2; // +2 for caret
      const maxWidth = getMaxInputWidth();
      setInputWidth(Math.min(measuredWidth, maxWidth));
    }
  }, [currentValue, currentPlaceholder, currentStep]);

  // Handle window resize to recalculate constraints
  useEffect(() => {
    const handleResize = () => {
      if (mirrorRef.current) {
        const measuredWidth = mirrorRef.current.offsetWidth + 2;
        const maxWidth = getMaxInputWidth();
        setInputWidth(Math.min(measuredWidth, maxWidth));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentValue, currentPlaceholder]);

  const saveToLocalStorage = (data) => {
    try {
      localStorage.setItem('skinstric_user_data', JSON.stringify(data));
      console.log('Data saved to localStorage:', data);
    } catch (err) {
      console.error('Error saving to localStorage:', err);
      throw new Error('Failed to save data locally');
    }
  };

  const saveToAPI = async (data) => {
    try {
      const response = await fetch('https://us-central1-frontend-simplified.cloudfunctions.net/skinstricPhaseOne', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          type: 'user_info' // Add type to distinguish from other requests
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      console.log('Data saved successfully to API:', result);
      return result;
    } catch (err) {
      console.error('Error saving data to API:', err);
      // Don't throw here - we'll save to localStorage as fallback
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentStep === 1 && formData.name.trim()) {
      // Move to location question
      setCurrentStep(2);
    } else if (currentStep === 2 && formData.location.trim()) {
      // Both fields complete - save data
      setIsSubmitting(true);
      setError(null);
      
      const dataToSave = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        timestamp: new Date().toISOString()
      };
      
      try {
        // Always save to localStorage first
        saveToLocalStorage(dataToSave);
        
        // Try to save to API (but don't fail if it doesn't work)
        await saveToAPI(dataToSave);
        
        // Show success state
        setIsComplete(true);
        
      } catch (err) {
        setError(err.message);
        setIsSubmitting(false);
      }
    }
  };

  const handleInputChange = (e) => {
    const field = currentStep === 1 ? 'name' : 'location';
    const newFormData = {
      ...formData,
      [field]: e.target.value
    };
    setFormData(newFormData);
    
    // Save to localStorage in real-time
    if (newFormData.name || newFormData.location) {
      try {
        saveToLocalStorage({
          ...newFormData,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error saving to localStorage in real-time:', err);
      }
    }
    
    // Clear any previous errors when user starts typing
    if (error) setError(null);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/');
    }
  };

  const handleProceed = () => {
    // Navigate to FaceScan page when proceed is clicked
    navigate('/facescan');
  };

  return (
    <div className='intro-wrapper'>
      <Nav />
      <p className="intro-top-label">TO START ANALYSIS</p>
      <div className="intro-main-flex">
        <div className="diamond-container">
          <div className="outer-diamond-border"></div>
          <div className="outer-diamond-border-2"></div>
          <div className="outer-diamond-border-3"></div>
          <section className="intro-content">
            {/* Show different content based on state */}
            {!isSubmitting && !isComplete ? (
              <>
                {/* Normal input state */}
                <p className="intro-label">CLICK TO TYPE</p>
                
                <form className="intro-form" onSubmit={handleSubmit} style={{ position: 'relative' }}>
                  <input
                    className="intro-input"
                    type="text"
                    placeholder={currentPlaceholder}
                    value={currentValue}
                    onChange={handleInputChange}
                    autoComplete="off"
                    autoFocus
                    key={currentStep}
                    ref={inputRef}
                    style={{
                      width: inputWidth ? `${inputWidth}px` : undefined,
                      maxWidth: `${getMaxInputWidth()}px`,
                    }}
                  />
                  {/* Mirror span for autosizing */}
                  <span
                    ref={mirrorRef}
                    style={{
                      position: 'absolute',
                      visibility: 'hidden',
                      height: 0,
                      overflow: 'hidden',
                      whiteSpace: 'pre',
                      fontSize: window.getComputedStyle(inputRef.current || document.body).fontSize || '64px',
                      fontWeight: window.getComputedStyle(inputRef.current || document.body).fontWeight || 400,
                      fontFamily: window.getComputedStyle(inputRef.current || document.body).fontFamily || 'inherit',
                      letterSpacing: window.getComputedStyle(inputRef.current || document.body).letterSpacing || '-0.02em',
                      padding: 0,
                      border: 0,
                    }}
                  >
                    {currentValue || currentPlaceholder}
                  </span>
                </form>

                {error && (
                  <p className="intro-error">
                    Error: {error}
                  </p>
                )}
              </>
            ) : isSubmitting && !isComplete ? (
              <>
                {/* Loading state */}
                <h2 className="intro-processing">Processing submission</h2>
                <div className="intro-loading-dots">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </>
            ) : (
              <>
                {/* Success state */}
                <h2 className="intro-thank-you">Thank you, {formData.name}!</h2>
                <p className="intro-proceed">Proceed for the next step</p>
              </>
            )}
          </section>
        </div>
      </div>

      {/* Back button - ALWAYS visible in bottom left */}
      <button 
        className="intro-back" 
        onClick={handleBack}
        disabled={isSubmitting}
      >
        <div className="intro-back-diamond">
          <span className="intro-back-arrow">◀</span>
        </div>
        BACK
      </button>

      {/* Proceed button - visible only in success state (bottom right) */}
      {isComplete && (
        <button 
          className="intro-proceed-btn" 
          onClick={handleProceed}
        >
          PROCEED
          <div className="intro-proceed-diamond">
            <span className="intro-proceed-arrow">▶</span>
          </div>
        </button>
      )}
    </div>
  );
};

export default Intro;