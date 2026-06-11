'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const IndustrialRobotIcon = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} style={{ flexShrink: 0 }}>
    <path fill="currentColor" d="M16.65 20.44H16v-2.37a3.07 3.07 0 0 0-6.14 0v2.37h-.64a1.5 1.5 0 0 0-1.5 1.5v1.56a.5.5 0 0 0 .5.5h9.43a.5.5 0 0 0 .5-.5v-1.56a1.5 1.5 0 0 0-1.5-1.5M13 19.1a1.06 1.06 0 0 1 0-2.1a1.06 1.06 0 1 1 0 2.11Z" />
    <path fill="currentColor" d="M23.92 8.81a4.32 4.32 0 0 0-4.13-3.09A4.2 4.2 0 0 0 18 6.1l-2.26-2.32A3 3 0 0 0 11.46.34A3 3 0 0 0 10 2.17L3.72 7a3.2 3.2 0 0 0-1.93.35a3.29 3.29 0 0 0 1.84 6.19l4.76 4.89V18A4.54 4.54 0 0 1 10 14.52L6.52 11a3.25 3.25 0 0 0 0-1.55l4.87-3.85a3 3 0 0 0 2.33.27l2.24 2.26a4.2 4.2 0 0 0-.45 1.9a4.31 4.31 0 0 0 3.21 4.17a1.2 1.2 0 0 0 .32 0a1.25 1.25 0 0 0 .31-2.46a1.81 1.81 0 1 1 2.2-2.26a1.25 1.25 0 1 0 2.39-.7Zm-20.61 2.5a1.05 1.05 0 1 1 1.06-1.05a1 1 0 0 1-1.06 1.05m9.54-7.22A1.1 1.1 0 1 1 14 3a1.09 1.09 0 0 1-1.15 1.09" />
  </svg>
);

const RobotGolemIcon = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} style={{ flexShrink: 0 }}>
    <path fill="currentColor" d="M256.688 18.406c-29.86 0-54.44 21.716-58.875 50.282H315.53c-4.428-28.566-28.983-50.282-58.842-50.282m-104.313 9.282L81.75 99.094c26.37 25.22 50.43 39.66 69.438 45.53c20.595 6.364 34.156 3.076 41.53-4.468c2.482-2.538 4.475-5.84 5.813-9.875c-12.5-13.88-20.124-32.236-20.124-52.31c0-5.28.527-10.45 1.53-15.44c-7.117-10.973-16.213-22.668-27.56-34.843zm208.594 0c-11.35 12.174-20.452 23.87-27.564 34.843a78.3 78.3 0 0 1 1.53 15.44c.002 20.074-7.63 38.43-20.123 52.31c1.334 4.036 3.33 7.338 5.812 9.876c7.374 7.544 20.935 10.832 41.53 4.47c19.01-5.873 43.068-20.313 69.44-45.532l-70.626-71.406zM197.843 87.374c4.008 25.464 24.02 45.487 49.5 49.47v-49.47zm68.187 0v49.47c25.476-3.983 45.466-24.006 49.47-49.47zm-52.655 55.72c-1.93 3.73-4.352 7.127-7.28 10.124c-7.01 7.17-16.34 11.444-27.157 12.843c17.245 30.84 47.478 45.278 77.718 45.187c30.135-.09 60.314-14.62 77.594-45.188c-10.75-1.42-20.024-5.706-27-12.843c-2.926-2.994-5.323-6.4-7.25-10.126c-12.413 8.293-27.313 13.156-43.313 13.156s-30.893-4.863-43.312-13.156zm-105.72.905c-11.884 8.09-22.142 17.595-30.03 28.47c5.18 1.992 10.066 5.204 14.47 9.374c.287.273.557.562.843.844c7.992-10.844 19.192-20.188 33-28.188c-5.933-2.94-12.04-6.43-18.282-10.5zm297.814.156c-6.274 4.077-12.418 7.563-18.376 10.5c13.946 8.04 25.26 17.42 33.312 28.28c.26-.258.518-.527.78-.78c4.39-4.208 9.27-7.476 14.44-9.53c-7.928-10.863-18.222-20.373-30.157-28.47zM65.405 188.844c-4.14.03-8.71 1.797-13.937 6.812c-5.23 5.016-10.76 13.247-15.595 24.78c-9.03 21.54-15.567 54.52-16.406 98.19h91.75c-.836-44.038-7.38-77.138-16.407-98.626c-4.833-11.502-10.363-19.67-15.563-24.594s-9.704-6.592-13.844-6.562zm382.656 0c-4.14.03-8.71 1.797-13.937 6.812c-5.228 5.016-10.758 13.247-15.594 24.78c-9.03 21.54-15.566 54.52-16.405 98.19h91.75c-.835-44.038-7.38-77.138-16.406-98.626c-4.833-11.502-10.364-19.67-15.564-24.594s-9.703-6.592-13.844-6.562m-164.5 37.53a106 106 0 0 1-26.875 3.564c-9.09.027-18.16-1.13-27-3.438c-5.288 5.608-8.437 12.862-8.437 20.656c0 17.25 15.35 31.844 35.438 31.844c20.087 0 35.437-14.593 35.437-31.844c0-7.854-3.2-15.155-8.563-20.78zm-76 41.94c-20.808 10.54-39.378 28.066-52.937 52.248c5.276 2.285 10.287 5.71 15 10.188c12.49-23.23 29.974-38.884 49.25-47.5c-4.683-4.264-8.518-9.31-11.313-14.938zm98.157.248c-2.83 5.618-6.727 10.63-11.44 14.875c19.213 8.67 36.67 24.287 49.19 47.282c.062-.06.123-.13.186-.19c4.588-4.308 9.586-7.692 14.844-9.967c-13.558-23.972-32.056-41.42-52.78-52m-166.595 67.375c-5.454-.038-11.282 2.203-17.688 8.22c-6.405 6.016-13.017 15.817-18.812 29.5c-7.377 17.416-13.346 41.16-16.72 70.937c8.495-4.2 17.876-6.245 27.19-6.22c14.79.043 29.66 5.315 40.968 16.032c9.487 8.993 16.182 21.848 18.093 37.563h23.25c-.856-52.36-8.71-91.89-19.656-117.783c-11.6-27.438-25.718-38.173-36.625-38.25zm234.97 0c-5.455-.038-11.252 2.203-17.658 8.22c-6.405 6.016-13.048 15.817-18.843 29.5c-10.943 25.835-18.774 65.513-19.625 118.312h23.217c1.898-15.826 8.58-28.72 18.094-37.72c11.325-10.712 26.243-15.917 41.033-15.875c9.298.026 18.658 2.098 27.125 6.313c-3.368-29.494-9.328-53.09-16.688-70.5c-11.6-27.44-25.75-38.174-36.656-38.25zm-336.126 1.375c-1.03 3.895-1.02 8.08.186 12.22c3.82 13.102 19.167 21.597 34.53 17.812c15.24-3.754 23.346-17.03 19.75-30.03l-54.47-.002zm382.655 0c-1.028 3.895-1.02 8.08.188 12.22c3.818 13.102 19.166 21.597 34.53 17.812c15.24-3.754 23.347-17.03 19.75-30.03zM113.03 457.063c-10.365-.03-20.612 3.615-28.155 10.75c-5.935 5.615-10.374 13.43-12.03 24.157h80.436c-1.664-10.603-6.128-18.377-12.06-24c-7.56-7.167-17.823-10.878-28.19-10.908zm287.22 0c-10.366-.03-20.582 3.615-28.125 10.75c-5.935 5.615-10.405 13.43-12.063 24.157H440.5c-1.665-10.603-6.13-18.377-12.063-24c-7.56-7.167-17.82-10.878-28.187-10.908z" />
  </svg>
);

const HumanIcon = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} style={{ flexShrink: 0 }}>
    <path fill="currentColor" d="M13.5 5.5c1.09 0 2-.92 2-2a2 2 0 0 0-2-2c-1.11 0-2 .88-2 2c0 1.08.89 2 2 2M9.89 19.38l1-4.38L13 17v6h2v-7.5l-2.11-2l.61-3A7.3 7.3 0 0 0 19 13v-2c-1.91 0-3.5-1-4.31-2.42l-1-1.58c-.4-.62-1-1-1.69-1c-.31 0-.5.08-.81.08L6 8.28V13h2V9.58l1.79-.7L8.19 17l-4.9-1l-.4 2z" />
  </svg>
);

// Helper function to shuffle and partially prioritize images with fewer votes
function getPrioritizedImages(imagesList: string[], voteCounts: Record<string, number> = {}) {
  const counts = Object.values(voteCounts);
  const totalVotes = counts.reduce((sum, v) => sum + v, 0);
  const avgVotes = counts.length > 0 ? totalVotes / counts.length : 0;
  
  // Adaptive noise factor scale based on vote distribution to balance randomness and prioritization
  const noiseFactor = Math.max(3.0, avgVotes * 1.5);
  
  return [...imagesList].sort((a, b) => {
    const votesA = voteCounts[a] || 0;
    const votesB = voteCounts[b] || 0;
    
    // Score combines actual votes with random noise
    const scoreA = votesA + Math.random() * noiseFactor;
    const scoreB = votesB + Math.random() * noiseFactor;
    
    return scoreA - scoreB;
  });
}

export default function Survey1() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Rating tracking & industrial warning modal
  const [ratingsHistory, setRatingsHistory] = useState<number[]>([]);
  const [showIndustrialModal, setShowIndustrialModal] = useState(false);
  
  // Age Modal States
  const [showAgeModal, setShowAgeModal] = useState(true);
  const [ageInput, setAgeInput] = useState('');
  const [ageError, setAgeError] = useState('');

  useEffect(() => {
    console.log('Survey 1: Fetching images from /api/images...');
    fetch('/api/images')
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          console.error(`Survey 1: HTTP Error ${res.status} - ${text}`);
          throw new Error(`HTTP Error: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Survey 1: Successfully received data:', data);
        if (!data.images) {
          console.error('Survey 1: "images" property missing from response data');
          setLoading(false);
          return;
        }
        const counts = data.voteCounts || {};
        setVoteCounts(counts);
        
        // Prioritize images with fewer votes to balance representation
        const prioritized = getPrioritizedImages(data.images, counts);
        setImages(prioritized);
        setLoading(false);
      })
      .catch(err => {
        console.error('Survey 1: Caught error during fetch:', err);
        setLoading(false);
      });
  }, []);

  const handleAgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ageNum = parseInt(ageInput, 10);
    if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
      setAgeError('Please enter a valid age between 1 and 120.');
      return;
    }
    
    // Generate unique session ID
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    
    localStorage.setItem('survey_session_id', sessionId);
    localStorage.setItem('survey_user_age', String(ageNum));
    
    setShowAgeModal(false);
    setAgeError('');
  };

  const handleResetSurvey = () => {
    setRatingsHistory([]);
    setAnsweredCount(0);
    setCurrentIndex(0);
    setShowIndustrialModal(false);
  };

  const handleRating = async (rating: number) => {
    const image = images[currentIndex];
    const sessionId = localStorage.getItem('survey_session_id');
    const age = localStorage.getItem('survey_user_age');
    
    const newRatingsHistory = [...ratingsHistory, rating];
    const onesCount = newRatingsHistory.filter(r => r === 1).length;
    
    // Save rating POST request
    await fetch('/api/survey1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, rating, sessionId, age }),
    });

    if (onesCount >= 3) {
      setShowIndustrialModal(true);
      try {
        await fetch('/api/survey1', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      } catch (err) {
        console.error('Failed to clear ratings:', err);
      }
      return;
    }

    setRatingsHistory(newRatingsHistory);
    const nextCount = answeredCount + 1;
    setAnsweredCount(nextCount);

    if (nextCount >= 5) {
      router.push('/survey2');
    } else {
      // Move to next image
      if (currentIndex + 1 >= images.length) {
        const prioritized = getPrioritizedImages(images, voteCounts);
        setImages(prioritized);
        setCurrentIndex(0);
      } else {
        setCurrentIndex(currentIndex + 1);
      }
    }
  };

  if (showIndustrialModal) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: '500px' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Attention</h2>
          <p style={{ fontSize: '1.05rem', marginBottom: '1.5rem', fontWeight: '500' }}>
            You are marking a lot of robots as industrial looking, do they look like this? Try again
          </p>
          <div style={{ position: 'relative', width: '100%', height: '250px', marginBottom: '1.5rem', borderRadius: '8px', overflow: 'hidden' }}>
            <Image
              src="/IndurstrialRobotExample.jpg"
              alt="Industrial Robot Example"
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>
          <button 
            onClick={handleResetSurvey}
            style={{ 
              background: '#ef4444', 
              color: '#ffffff', 
              padding: '0.75rem 2rem', 
              fontSize: '1rem', 
              fontWeight: 'bold' 
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (showAgeModal) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Welcome to the Survey</h2>
          <p>Please enter your age to begin the survey:</p>
          <form onSubmit={handleAgeSubmit}>
            <input
              type="number"
              min="1"
              max="120"
              value={ageInput}
              onChange={(e) => {
                setAgeInput(e.target.value);
                setAgeError('');
              }}
              placeholder="Enter your age"
              required
              autoFocus
            />
            {ageError && <div className="error-message">{ageError}</div>}
            <button type="submit">Start Survey</button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading images...</div>;
  
  if (images.length === 0) {
    return <div>No images found.</div>;
  }

  return (
    <div className="card">
      <h2>How realistically human does this robot look?</h2>
      
      <div className="survey-legend-flex" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', margin: '0.5rem 0 1.5rem 0', color: '#71717a', fontSize: '0.9rem', fontWeight: '500' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <IndustrialRobotIcon size={18} />
          <span>1 = Industrial robot</span>
        </div>
        <span style={{ color: 'var(--border)' }}>|</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <RobotGolemIcon size={18} />
          <span>4 = Cartoonish/Animatronic</span>
        </div>
        <span style={{ color: 'var(--border)' }}>|</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <HumanIcon size={18} />
          <span>7 = Barely tell it's a robot</span>
        </div>
      </div>
      
      <div className="image-display">
        <Image
          src={`/images/${images[currentIndex]}`}
          alt="Robot"
          width={1000}
          height={1000}
          style={{ width: '100%', height: 'auto', maxHeight: '50vh', objectFit: 'contain', borderRadius: '8px' }}
          priority
        />
      </div>

      <p style={{ color: '#71717a', fontSize: '0.9rem' }}>Question {answeredCount + 1} of 5</p>

      <div className="rating-buttons">
        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
          <button
            key={num}
            onClick={() => handleRating(num)}
            className={`rating-btn rating-${num}`}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
}


