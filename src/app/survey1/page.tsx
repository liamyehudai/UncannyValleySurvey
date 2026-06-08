'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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

  const handleRating = async (rating: number) => {
    const image = images[currentIndex];
    
    const sessionId = localStorage.getItem('survey_session_id');
    const age = localStorage.getItem('survey_user_age');
    
    // Save rating POST request
    await fetch('/api/survey1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, rating, sessionId, age }),
    });

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
      <div style={{ float: 'right', fontSize: '0.85rem', color: '#71717a', fontWeight: 'bold' }}>
        Image {currentIndex + 1} of {images.length}
      </div>
      <div style={{ clear: 'both' }} />
      
      <h2>How realistically human does this robot look?</h2>
      <p className="survey-legend">1 = Not human at all | 4 = Cartoonish/Animatronic | 7 = Barely tell it's a robot</p>
      
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


