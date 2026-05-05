'use client';

import { useState, useEffect } from 'react';

const QUESTIONS = [
  "Which robot would you prefer to serve you food?",
  "Which robot would you prefer to take care of a sick loved one?",
  "Which robot would you prefer clean your home?"
];

export default function Survey2() {
  const [images, setImages] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    console.log('Survey 2: Fetching images and stats...');
      try {
        const [imagesRes, statsRes] = await Promise.all([
          fetch('/api/images').then(async r => {
            if (!r.ok) {
              console.error('Survey 2: Error fetching /api/images', r.status);
              throw new Error('Failed to fetch images');
            }
            const data = await r.json();
            console.log('Survey 2: images data:', data);
            return data;
          }),
          fetch('/api/survey1').then(async r => {
            if (!r.ok) {
              console.error('Survey 2: Error fetching /api/survey1', r.status);
              throw new Error('Failed to fetch survey1 stats');
            }
            const data = await r.json();
            console.log('Survey 2: survey1 data:', data);
            return data;
          })
        ]);
        
        const allImages: string[] = imagesRes.images || [];
        const stats: Record<string, { count: number; average: number }> = statsRes.stats || {};
        
        // Group images by rounded average 1-7
        const pools: Record<number, string[]> = { 1:[], 2:[], 3:[], 4:[], 5:[], 6:[], 7:[] };
        const unrated: string[] = [];

        for (const img of allImages) {
          if (stats[img] && stats[img].count > 0) {
            const rounded = Math.round(stats[img].average);
            const clamped = Math.max(1, Math.min(7, rounded));
            pools[clamped].push(img);
          } else {
            unrated.push(img);
          }
        }

        const selected: string[] = [];
        
        // Pick one from each pool 1-7 if available
        for (let i = 1; i <= 7; i++) {
          if (pools[i].length > 0) {
            const randomImg = pools[i][Math.floor(Math.random() * pools[i].length)];
            selected.push(randomImg);
            pools[i] = pools[i].filter(img => img !== randomImg); // remove picked
          }
        }

        // Fill remaining up to 10
        const remainingPool = [...Object.values(pools).flat(), ...unrated];
        while (selected.length < 10 && remainingPool.length > 0) {
          const idx = Math.floor(Math.random() * remainingPool.length);
          selected.push(remainingPool[idx]);
          remainingPool.splice(idx, 1);
        }

        // Shuffle selected
        selected.sort(() => Math.random() - 0.5);

        setImages(selected);
        setQuestion(QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]);
        setLoading(false);
      } catch (err) {
        console.error("Survey 2 Error:", err);
        setError("Failed to load data. Make sure to complete Survey 1 first to generate stats.");
        setLoading(false);
      }
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = async (chosenImage: string) => {
    setLoading(true);
    await fetch('/api/survey2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, chosenImage, displayedImages: images }),
    });
    loadData();
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="card"><p style={{color: 'red'}}>{error}</p></div>;

  return (
    <div className="card" style={{ maxWidth: '1000px' }}>
      <h2>{question}</h2>
      <p>Select one image from the options below:</p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '1rem',
        marginTop: '2rem'
      }}>
        {images.map(img => (
          <div 
            key={img} 
            style={{ 
              cursor: 'pointer', 
              border: '2px solid transparent', 
              borderRadius: '8px',
              overflow: 'hidden',
              transition: 'transform 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            onClick={() => handleSelect(img)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/images/${img}`} alt="Robot Option" style={{ width: '100%', display: 'block' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
