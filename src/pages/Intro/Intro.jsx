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
          type: 'user_info'
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
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep === 1 && formData.name.trim()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && formData.location.trim()) {
      setIsSubmitting(true);
      setError(null);

      const dataToSave = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        timestamp: new Date().toISOString()
      };

      try {
        saveToLocalStorage(dataToSave);
        await saveToAPI(dataToSave);
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
            {!isSubmitting && !isComplete ? (
              <>
                <p className="intro-label">CLICK TO TYPE</p>

                <form className="intro-form" onSubmit={handleSubmit}>
                  <input
                    className="intro-input"
                    type="text"
                    placeholder={currentPlaceholder}
                    value={currentValue}
                    onChange={handleInputChange}
                    autoComplete="off"
                    autoFocus={false}
                    key={currentStep}
                    ref={inputRef}
                    // Remove all width constraints - let text flow naturally
                  />
                </form>

                {error && (
                  <p className="intro-error">
                    Error: {error}
                  </p>
                )}
              </>
            ) : isSubmitting && !isComplete ? (
              <>
                <h2 className="intro-processing">Processing submission</h2>
                <div className="intro-loading-dots">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </>
            ) : (
              <>
                <h2 className="intro-thank-you">Thank you, {formData.name}!</h2>
                <p className="intro-proceed">Proceed for the next step</p>
              </>
            )}
          </section>
        </div>
      </div>

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