import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import camera from '../../assets/camera.svg'; 
import gallery from '../../assets/gallery.svg'; 
import camAccess from '../../assets/accessCamera.svg';
import galleryAccess from '../../assets/accessGallery.svg';
import './FaceScan.css';
import Nav from '../../Nav';
import RotatingDiamonds from '../../components/RotatingDiamonds/RotatingDiamonds';

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
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Please select a valid image file (JPEG, PNG, etc.)');
    return;
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    alert('Image file is too large. Please select an image smaller than 10MB.');
    return;
  }

  setIsProcessingGallery(true);

  try {
    // Convert file to base64
    const base64DataUrl = await convertFileToBase64(file);
    
    // Remove the data URL prefix to get just the base64 string
    const base64Image = base64DataUrl.split(',')[1];
    
    console.log('Processing uploaded image...');
    
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('skinstric_user_data') || '{}');
    
    // Send image to API for demographic analysis using Phase Two endpoint
    const response = await fetch('https://us-central1-frontend-simplified.cloudfunctions.net/skinstricPhaseTwo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image // Note: lowercase 'image' field name
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${response.statusText}. Details: ${errorText}`);
    }

    const result = await response.json();
    console.log('Gallery image analysis result:', result);
    
    // Transform the API response to our expected format
    let demographicsData;
    if (result.data && result.data.race && result.data.age && result.data.gender) {
      demographicsData = transformAPIResponse(result.data);
    } else {
      console.log('API response format unexpected, using mock data');
      demographicsData = generateMockDemographics();
      demographicsData.apiMessage = JSON.stringify(result);
      demographicsData.isSimulated = true;
    }
    
    // Store both the image and analysis result in localStorage
    localStorage.setItem('skinstric_captured_photo', base64DataUrl);
    localStorage.setItem('skinstric_demographics', JSON.stringify(demographicsData));
    
    // Navigate directly to Analysis page with the data
    navigate('/analysis', { 
      state: { 
        analysisData: {
          demographicsData: demographicsData,
          photoData: base64DataUrl,
          source: 'gallery'
        }
      } 
    });
    
  } catch (error) {
    console.error('Error processing gallery image:', error);
    
    // Show user-friendly error message
    alert(`Analysis failed: ${error.message}. Please try again with a different image.`);
    
    // For development/testing purposes, create mock data and proceed
    const base64DataUrl = await convertFileToBase64(file);
    const mockDemographics = generateMockDemographics();
    
    localStorage.setItem('skinstric_captured_photo', base64DataUrl);
    localStorage.setItem('skinstric_demographics', JSON.stringify(mockDemographics));
    
    navigate('/analysis', { 
      state: { 
        analysisData: {
          demographicsData: mockDemographics,
          photoData: base64DataUrl,
          source: 'gallery'
        }
      } 
    });
  } finally {
    setIsProcessingGallery(false);
    // Reset file input
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
  // Convert race data to sorted array format with 2 decimal precision
  const raceEntries = Object.entries(apiData.race).map(([race, confidence]) => ({
    race: capitalizeWords(race),
    confidence: parseFloat((confidence * 100).toFixed(2)) // Ensure 2 decimal places
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
  
  // Generate random confidences with decimal precision
  const raceConfidences = races.map(race => ({
    race,
    confidence: parseFloat((Math.random() * 30 + 10).toFixed(2)) // 10.00-40.00% confidence
  }));
  
  // Normalize to 100% while maintaining decimal precision
  const total = raceConfidences.reduce((sum, item) => sum + item.confidence, 0);
  raceConfidences.forEach(item => {
    item.confidence = parseFloat(((item.confidence / total) * 100).toFixed(2));
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
    source: 'gallery_upload', 
    isMockData: true
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
    <div className="icon-with-diamonds">
      <RotatingDiamonds
  icon={camera}
  alt="Camera"
  onClick={handleAIScan}
  show={!isSettingUpCamera}
/>
      <div className="label-container camera">
        <span className="pointer-dot"></span>
        <img src={camAccess} alt="" className="icon-label" />
      </div>
    </div>
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
    <div className="icon-with-diamonds">
      <RotatingDiamonds
  icon={gallery}
  alt="Gallery"
  onClick={handleAccessGallery}
  show={!isProcessingGallery}
/>
      <div className="label-container gallery">
        <span className="pointer-dot"></span>
        <img src={galleryAccess} alt="" className="icon-label" />
      </div>
    </div>
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
            <RotatingDiamonds icon={camera} alt="Camera" show={true} />
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
            <RotatingDiamonds icon={gallery} alt="Gallery" loading={true} />
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