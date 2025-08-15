import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import camera from '../../assets/camera.svg'; 
import gallery from '../../assets/gallery.svg'; 
import camBorder from '../../assets/cameraBorder.svg';
import galleryBorder from '../../assets/galleryBorder.svg';
import './FaceScan.css';
import Nav from '../../Nav';

const FaceScan = () => {
  const [showCameraPermissionModal, setShowCameraPermissionModal] = useState(false);
  const [showGalleryPermissionModal, setShowGalleryPermissionModal] = useState(false);
  const [isSettingUpCamera, setIsSettingUpCamera] = useState(false);
  const [isProcessingGallery, setIsProcessingGallery] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleBack = () => {
    // Clean up camera if it's running
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    navigate('/intro');
  };

  const handleAIScan = () => {
    setShowCameraPermissionModal(true);
  };

  const handleAllowCamera = async () => {
    setShowCameraPermissionModal(false);
    setIsSettingUpCamera(true);

    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      // Stop the stream immediately as we'll start it again in Camera component
      stream.getTracks().forEach(track => track.stop());
      
      // Navigate to camera view after setup
      setTimeout(() => {
        navigate('/camera'); // Navigate to Camera page
      }, 2000);
      
    } catch (error) {
      console.error('Camera access denied:', error);
      setIsSettingUpCamera(false);
      alert('Camera access was denied. Please enable camera permissions to use this feature.');
    }
  };

  const handleDenyCamera = () => {
    setShowCameraPermissionModal(false);
  };

  const handleAccessGallery = () => {
    setShowGalleryPermissionModal(true);
  };

  const handleAllowGallery = () => {
    setShowGalleryPermissionModal(false);
    // Trigger file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDenyGallery = () => {
    setShowGalleryPermissionModal(false);
  };

  const handleFileSelect = async (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  // Validate file type and size
  if (!file.type.startsWith('image/')) {
    alert('Please select a valid image file (JPEG, PNG, etc.)');
    return;
  }
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    alert('Image file is too large. Please select an image smaller than 10MB.');
    return;
  }

  setIsProcessingGallery(true);
  
  // ************************************************************
  // CORRECTED LINE: Declare the variable outside the try block
  let base64Image = null; 
  // ************************************************************

  try {
    // Convert file to base64
    base64Image = await convertFileToBase64(file);

    // Ensure the Base64 string is not empty before proceeding
    if (!base64Image) {
        throw new Error('Image conversion failed. The Base64 string is empty.');
    }

    // Remove the data URI header from the string
    base64Image = base64Image.split(',')[1];
    
    // Ensure the Base64 string is not empty after removing the header
    if (!base64Image) {
        throw new Error('Image data is missing after processing. Please try a different image.');
    }

    console.log('Processing uploaded image...');

    const response = await fetch('https://us-central1-frontend-simplified.cloudfunctions.net/skinstricPhaseTwo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Image: base64Image
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API Error: ${response.status} - ${response.statusText}. Details: ${errorText}`);
    }

    const result = await response.json();
    console.log('Gallery image analysis result:', result);
    
    // Check if the API returned a success status but without the data.
    if (result.success === false) {
      throw new Error(result.message || 'API analysis failed with an unknown error.');
    }
    
    // Store both the image and analysis result in localStorage
    localStorage.setItem('skinstric_captured_photo', `data:${file.type};base64,${base64Image}`);
    localStorage.setItem('skinstric_demographics', JSON.stringify(transformAPIResponse(result.data)));

    navigate('/analysis', {
      state: {
        analysisData: {
          demographicsData: transformAPIResponse(result.data),
          photoData: `data:${file.type};base64,${base64Image}`,
          source: 'gallery'
        }
      }
    });

  } catch (error) {
    console.error('Error processing gallery image:', error);
    alert(`Analysis failed: ${error.message}. Please try again with a different image.`);
    
    // Since base64Image is now in scope, this should work.
    const mockDemographics = generateMockDemographics();
    localStorage.setItem('skinstric_captured_photo', `data:${file.type};base64,${base64Image}`);
    localStorage.setItem('skinstric_demographics', JSON.stringify(mockDemographics));
    navigate('/analysis', { 
      state: { 
        analysisData: {
          demographicsData: mockDemographics,
          photoData: `data:${file.type};base64,${base64Image}`,
          source: 'gallery'
        }
      } 
    });

  } finally {
    setIsProcessingGallery(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }
};

  // Helper function to convert file to base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Function to transform API response to our expected format
  const transformAPIResponse = (apiData) => {
    // Convert race data to sorted array format
    const raceEntries = Object.entries(apiData.race).map(([race, confidence]) => ({
      race: capitalizeWords(race),
      confidence: Math.round(confidence * 100)
    }));
    
    // Sort by confidence descending
    raceEntries.sort((a, b) => b.confidence - a.confidence);
    
    // Get the highest confidence age range
    const ageEntries = Object.entries(apiData.age);
    const topAge = ageEntries.reduce((max, current) => 
      current[1] > max[1] ? current : max
    );
    
    // Get gender with highest confidence
    const topGender = apiData.gender.male > apiData.gender.female ? 'Male' : 'Female';
    
    return {
      race: raceEntries[0].race,
      age: topAge[0],
      sex: topGender,
      race_confidences: raceEntries,
      confidence_score: raceEntries[0].confidence,
      timestamp: new Date().toISOString(),
      source: 'api_phase_two',
      raw_api_data: apiData
    };
  };

  // Helper function to capitalize words
  const capitalizeWords = (str) => {
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Function to generate mock demographic data for testing
  const generateMockDemographics = () => {
    const races = ['White', 'Black', 'Asian', 'Hispanic', 'Middle Eastern', 'Indian'];
    const ages = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
    const sexes = ['Male', 'Female'];
    
    // Generate random confidences that add up to 100%
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
      source: 'gallery_upload'
    };
  };

  return (
    <div className='facescan-wrapper'>
      {/* Only show Nav when not setting up camera or processing gallery */}
      {!isSettingUpCamera && !isProcessingGallery && <Nav />}
      
      {/* Top left label - only show when not setting up camera or processing gallery */}
      {!isSettingUpCamera && !isProcessingGallery && (
        <p className="facescan-top-label">TO START ANALYSIS</p>
      )}
      
      {/* Hidden file input for gallery selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <main className="facescan-main">
        {/* Main Content */}
        {!isSettingUpCamera && !isProcessingGallery ? (
          <section className="facescan-content">
            {/* Left Option - AI Scan */}
            <div className="option-container">
              <button className="option-btn" onClick={handleAIScan}>
           
             
                  {/* Camera icon centered */}
                  <img src={camBorder} alt="Camera" className="option-icon" />
              
              
              </button>
              {/* Camera Permission Modal - positioned relative to this container */}
              {showCameraPermissionModal && (
                <div className="permission-modal">
                  <h3 className="ai-modal-title">ALLOW A.I. TO ACCESS YOUR CAMERA</h3>
                  <div className="modal-divider"></div>
                  <div className="modal-buttons">
                    <button className="modal-btn deny-btn" onClick={handleDenyCamera}>
                      DENY
                    </button>
                    <button className="modal-btn allow-btn" onClick={handleAllowCamera}>
                      ALLOW
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Option - Access Gallery */}
            <div className="option-container">
              <button className="option-btn" onClick={handleAccessGallery}>
              
                 
                  {/* Gallery icon centered */}
                  <img src={galleryBorder} alt="Gallery" className="option-icon" />
              
            
              </button>
              {/* Gallery Permission Modal - positioned relative to this container */}
              {showGalleryPermissionModal && (
                <div className="gallery-modal">
                  <h3 className="ai-modal-title">ALLOW A.I. TO ACCESS YOUR GALLERY</h3>
                  <div className="modal-divider"></div>
                  <div className="modal-buttons">
                    <button className="modal-btn deny-btn" onClick={handleDenyGallery}>
                      DENY
                    </button>
                    <button className="modal-btn allow-btn" onClick={handleAllowGallery}>
                      ALLOW
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : isSettingUpCamera ? (
          /* Loading State - Setting up camera */
          <section className="camera-loading">
            <div className="loading-diamond-container">
                <div className="diamond diamond-small"></div>
                <div className="diamond diamond-medium"></div>
                <div className="diamond diamond-large"></div>
              <img src={camera} alt="Camera" className="loading-icon" />
            </div>
            <p className="loading-text">SETTING UP CAMERA ...</p>
            
            <p className="loading-subtitle">TO GET BETTER RESULTS MAKE SURE TO HAVE</p>
            <div className="loading-indicators">
              <span className="indicator-text">◇ NEUTRAL EXPRESSION</span>
              <span className="indicator-text">◇ FRONTAL POSE</span>
              <span className="indicator-text">◇ ADEQUATE LIGHTING</span>
            </div>
          </section>
        ) : (
          /* Loading State - Processing Gallery Image */
          <section className="gallery-loading">
            <div className="loading-diamond-container">
                <div className="diamond diamond-small"></div>
                <div className="diamond diamond-medium"></div>
                <div className="diamond diamond-large"></div>
              <img src={gallery} alt="Gallery" className="loading-icon" />
            </div>
            <p className="loading-text">ANALYZING IMAGE ...</p>
            
            <p className="loading-subtitle">PROCESSING YOUR UPLOADED PHOTO</p>
            <div className="loading-indicators">
              <span className="indicator-text">◇ DETECTING FACE</span>
              <span className="indicator-text">◇ ANALYZING FEATURES</span>
              <span className="indicator-text">◇ GENERATING RESULTS</span>
            </div>
          </section>
        )}

        {/* Back button - only show when not setting up camera or processing gallery */}
        {!isSettingUpCamera && !isProcessingGallery && (
          <button 
            className="facescan-back" 
            onClick={handleBack}
          >
            <div className="back-diamond">
              <span className="back-arrow">◀</span>
            </div>
            <span>BACK</span>
          </button>
        )}
      </main>
    </div>
  );
};

export default FaceScan;