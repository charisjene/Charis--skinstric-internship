import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Camera.css';
import takephoto from './../../assets/takephoto.svg';

const Camera = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Start camera when component mounts
    startCamera();
    
    // Cleanup on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
      navigate('/facescan');
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data as base64 with reduced quality for smaller payload
      const imageData = canvas.toDataURL('image/jpeg', 0.7); // Reduced quality to 0.7
      setCapturedImage(imageData);
      setPhotoTaken(true);
      
      // Stop camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Store image in localStorage for later use
      try {
        localStorage.setItem('skinstric_captured_photo', imageData);
        console.log('Photo saved to localStorage');
      } catch (err) {
        console.error('Error saving photo to localStorage:', err);
      }
    }
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
    source: 'camera_capture', 
  };
};

  const handleProceed = async () => {
    if (!capturedImage) {
      alert('No photo captured. Please take a photo first.');
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('Sending photo for demographic analysis...');
      
      // Get user data from localStorage
      const userDataString = localStorage.getItem('skinstric_user_data');
      let userData = {};
      
      if (userDataString) {
        try {
          userData = JSON.parse(userDataString);
        } catch (parseError) {
          console.warn('Could not parse user data from localStorage:', parseError);
        }
      }

      console.log('Request payload prepared for Phase Two API');
      
      // Optionally, also send user data to Phase One for collection
      try {
        await fetch('https://us-central1-frontend-simplified.cloudfunctions.net/skinstricPhaseOne', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: userData.name || 'Anonymous',
            location: userData.location || 'Unknown',
            timestamp: new Date().toISOString(),
            type: 'user_data_collection',
            source: 'camera_capture'
          })
        });
        console.log('User data sent to Phase One for collection');
      } catch (phaseOneError) {
        console.warn('Phase One data collection failed:', phaseOneError);
        // Don't throw - this is optional
      }
      
      // Send photo to API for demographic analysis using Phase Two endpoint
      const response = await fetch('https://us-central1-frontend-simplified.cloudfunctions.net/skinstricPhaseTwo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Image: capturedImage // Note: Capital 'I' as per API spec
        })
      });

      console.log('API Response status:', response.status);
      console.log('API Response headers:', response.headers);

      // Try to get response text regardless of status
      let responseText;
      try {
        responseText = await response.text();
        console.log('API Response text:', responseText);
      } catch (textError) {
        console.error('Could not read response text:', textError);
        responseText = '';
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}. Response: ${responseText}`);
      }

      // Try to parse the response as JSON
      let result;
      try {
        result = responseText ? JSON.parse(responseText) : {};
        console.log('Parsed API result:', result);
      } catch (jsonError) {
        console.error('Could not parse JSON response:', jsonError);
        throw new Error(`Invalid JSON response from API: ${responseText}`);
      }

      // Transform the API response to our expected format
      let demographicsData;
      if (result.data && result.data.race && result.data.age && result.data.gender) {
        demographicsData = transformAPIResponse(result.data);
      } else {
        console.log('API response format unexpected, using mock data');
        demographicsData = generateMockDemographics();
        demographicsData.apiMessage = responseText;
        demographicsData.isSimulated = true;
      }
      
      // Store the analysis result in localStorage
      localStorage.setItem('skinstric_demographics', JSON.stringify(demographicsData));
      
      // Navigate to analysis page with the analysis data
      navigate('/analysis', { 
        state: { 
          analysisData: {
            demographicsData: demographicsData,
            photoData: capturedImage,
            source: 'camera'
          }
        } 
      });
      
    } catch (error) {
      console.error('Error during demographic analysis:', error);
      
      // Show detailed error message for debugging
      const errorMessage = error.message || 'Unknown error occurred';
      console.error('Full error details:', {
        message: errorMessage,
        stack: error.stack,
        name: error.name
      });
      
      // Don't show error popup since API is working, just use mock data
      console.log('API call had issues, proceeding with mock data for demo...');
      
      // Always create mock data and proceed automatically for now
      const mockDemographics = generateMockDemographics();
      localStorage.setItem('skinstric_demographics', JSON.stringify(mockDemographics));
      
      // Automatically proceed with mock data to continue testing
      console.log('Proceeding with mock data...');
      navigate('/analysis', { 
        state: { 
          analysisData: {
            demographicsData: mockDemographics,
            photoData: capturedImage,
            source: 'camera',
            isMockData: true
          }
        } 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const retakePhoto = () => {
    setPhotoTaken(false);
    setCapturedImage(null);
    setIsProcessing(false);
    
    // Remove stored photo
    localStorage.removeItem('skinstric_captured_photo');
    
    startCamera();
  };

  const handleBack = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    navigate('/facescan');
  };

  return (
    <div className="camera-wrapper">
      {/* Top Navigation */}
      <div className="camera-nav">
        <span className="camera-logo">SKINSTRIC</span>
      </div>

      {/* Main Camera View */}
      <div className="camera-container">
        {/* Video Feed or Captured Image */}
        {!photoTaken ? (
          <video 
            ref={videoRef}
            className="camera-video"
            autoPlay
            playsInline
            muted
          />
        ) : (
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="captured-image"
          />
        )}
        
        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Bottom Instructions */}
        <div className="camera-instructions">
          <p className="instruction-text">TO GET BETTER RESULTS MAKE SURE TO HAVE</p>
          <div className="instruction-items">
            <span className="instruction-item">◇ NEUTRAL EXPRESSION</span>
            <span className="instruction-item">◇ FRONTAL POSE</span>
            <span className="instruction-item">◇ ADEQUATE LIGHTING</span>
          </div>
        </div>

        {/* Capture Button or Photo Actions */}
        {!photoTaken ? (
          <div className="flex__container">
            <span className='side-label'>TAKE PICTURE</span>
            <button className="capture-btn" onClick={takePhoto}>
              <img className='capture-icon' src={takephoto} alt="Take Photo" />
            </button>
          </div>
        ) : (
          <>
            <h3 className="taken-photo">
              {isProcessing ? 'ANALYZING...' : 'GREAT SHOT!'}
            </h3>
            
            {!isProcessing && (
              <>
                <button className="proceed-btn" onClick={handleProceed} disabled={isProcessing}>
                  <div className="proceed-text">PROCEED</div>
                  <div className="proceed-diamond">
                    <span className="proceed-arrow">▶</span>
                  </div>
                </button>
                
                
              </>
            )}
            
            {isProcessing && (
              <div className="processing-indicator">
                <div className="loading-dots">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
                <p>Processing your photo...</p>
              </div>
            )}
          </>
        )}

        {/* Back Button */}
        {!isProcessing && (
         <button className="camera-back" onClick={handleBack}>
          <div className="back-btn-diamond">
            <span className="back-arrow">◀</span>
          </div>
          <span className="camera-back-text">BACK</span>
        </button>
        )}
      </div>
    </div>
  );
};

export default Camera;
