'use client';

import { useState, useEffect } from 'react';

export default function Survey1() {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

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
        // Shuffle images for randomness
        const shuffled = [...data.images].sort(() => Math.random() - 0.5);
        setImages(shuffled);
        setLoading(false);
      })
      .catch(err => {
        console.error('Survey 1: Caught error during fetch:', err);
        setLoading(false);
      });
  }, []);

  const handleRating = async (rating: number) => {
    const image = images[currentIndex];
    
    // Optimistically move to next
    if (currentIndex + 1 >= images.length) {
      setImages(prev => [...prev].sort(() => Math.random() - 0.5));
      setCurrentIndex(0);
    } else {
      setCurrentIndex(currentIndex + 1);
    }

    await fetch('/api/survey1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, rating }),
    });
  };

  if (loading) return <div>Loading images...</div>;
  
  if (images.length === 0) {
    return <div>No images found.</div>;
  }

  return (
    <div className="card">
      <h2>How realistically human does this robot look?</h2>
      <p style={{ color: 'var(--border)' }}>1 = Not human at all | 4 = Cartoonish/Animatronic | 7 = Barely tell it's a robot</p>
      
      <div className="image-display">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/images/${images[currentIndex]}`} alt="Robot" />
      </div>

      <p>Image {currentIndex + 1} of {images.length}</p>

      <div className="rating-buttons">
        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
          <button key={num} onClick={() => handleRating(num)}>
            {num}
          </button>
        ))}
      </div>
    </div>
  );
}
