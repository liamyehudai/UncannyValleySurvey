'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const QUESTIONS = [
  "Which robot would you prefer to serve you food?",
  "Which robot would you prefer to take care of a sick loved one?",
  "Which robot would you prefer clean your home?"
];

function renderQuestionText(qText: string) {
  const keyword = "prefer";
  const index = qText.indexOf(keyword);
  if (index === -1) return qText;
  
  const before = qText.substring(0, index + keyword.length);
  const after = qText.substring(index + keyword.length);
  
  return (
    <>
      {before}
      <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)' }}>
        {after}
      </span>
    </>
  );
}

function Confetti() {
  const [pieces, setPieces] = useState<{ id: number; style: React.CSSProperties }[]>([]);

  useEffect(() => {
    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#eab308', '#a855f7', '#ff7849', '#ffc82c'];
    const newPieces = Array.from({ length: 150 }).map((_, i) => {
      const sizeWidth = Math.floor(Math.random() * 8) + 6; // 6px - 14px
      const sizeHeight = Math.floor(Math.random() * 12) + 10; // 10px - 22px
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left = Math.random() * 100; // 0% - 100%
      const duration = Math.random() * 3 + 2.5; // 2.5s - 5.5s
      const delay = Math.random() * 4; // 0s - 4s
      const shape = Math.random();
      const borderRadius = shape > 0.6 ? '50%' : shape > 0.3 ? '3px' : '0px';
      
      const style: React.CSSProperties = {
        width: `${sizeWidth}px`,
        height: `${sizeHeight}px`,
        backgroundColor: color,
        left: `${left}%`,
        borderRadius,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
        transform: `rotate(${Math.random() * 360}deg)`,
      };

      return { id: i, style };
    });
    setPieces(newPieces);
  }, []);

  return (
    <div className="confetti-container">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={p.style} />
      ))}
    </div>
  );
}

export default function Survey2() {
  const [unranked, setUnranked] = useState<string[]>([]);
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null, null, null]);
  const [questionsList, setQuestionsList] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Drag and Drop States
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedSource, setDraggedSource] = useState<'unranked' | 'slots' | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const loadInitialData = async () => {
    setLoading(true);
    setSubmitted(false);
    setSlots([null, null, null, null, null]);
    console.log('Survey 2: Initializing 3-question flow...');
    try {
      const res = await fetch('/api/images');
      if (!res.ok) throw new Error('Failed to fetch images');
      const data = await res.json();
      
      const allImages: string[] = data.images || [];
      if (allImages.length === 0) {
        throw new Error('No images found in images directory');
      }

      // Shuffle and select exactly 5 random images
      const selected = [...allImages].sort(() => Math.random() - 0.5).slice(0, 5);
      setUnranked(selected);

      // Shuffle the 3 unique questions
      const shuffledQuestions = [...QUESTIONS].sort(() => Math.random() - 0.5);
      setQuestionsList(shuffledQuestions);
      setCurrentQuestionIndex(0);
      setLoading(false);
    } catch (err: any) {
      console.error("Survey 2 Error:", err);
      setError("Failed to load survey images. Please try again later.");
      setLoading(false);
    }
  };

  const loadNextQuestion = async (nextIndex: number) => {
    setLoading(true);
    setSlots([null, null, null, null, null]);
    console.log(`Survey 2: Loading question ${nextIndex + 1}...`);
    try {
      const res = await fetch('/api/images');
      if (!res.ok) throw new Error('Failed to fetch images');
      const data = await res.json();
      
      const allImages: string[] = data.images || [];
      if (allImages.length === 0) {
        throw new Error('No images found in images directory');
      }

      // Shuffle and select exactly 5 new random images
      const selected = [...allImages].sort(() => Math.random() - 0.5).slice(0, 5);
      setUnranked(selected);
      setCurrentQuestionIndex(nextIndex);
      setLoading(false);
    } catch (err: any) {
      console.error("Survey 2 Error:", err);
      setError("Failed to load next survey question. Please try again later.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Click handler to move from unranked to first available slot
  const handleUnrankedClick = (img: string, idx: number) => {
    const firstEmpty = slots.findIndex(s => s === null);
    if (firstEmpty !== -1) {
      const newSlots = [...slots];
      newSlots[firstEmpty] = img;
      setSlots(newSlots);
      setUnranked(prev => prev.filter((_, i) => i !== idx));
    }
  };

  // Click handler to remove from slot back to unranked
  const handleRemoveClick = (img: string, slotIdx: number) => {
    const newSlots = [...slots];
    newSlots[slotIdx] = null;
    setSlots(newSlots);
    setUnranked(prev => [...prev, img]);
  };

  // Drag start handlers
  const handleDragStartUnranked = (index: number) => {
    setDraggedSource('unranked');
    setDraggedIndex(index);
  };

  const handleDragStartSlot = (index: number) => {
    setDraggedSource('slots');
    setDraggedIndex(index);
  };

  // Drag over handler
  const handleDragOverSlot = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  // Drop on slot handler
  const handleDropSlot = (targetIdx: number) => {
    if (draggedIndex === null || !draggedSource) return;

    const newSlots = [...slots];
    const newUnranked = [...unranked];

    if (draggedSource === 'unranked') {
      const robot = unranked[draggedIndex];
      const existing = slots[targetIdx];

      newSlots[targetIdx] = robot;
      if (existing) {
        newUnranked[draggedIndex] = existing;
      } else {
        newUnranked.splice(draggedIndex, 1);
      }
    } else if (draggedSource === 'slots') {
      const robot = slots[draggedIndex];
      if (robot) {
        const existing = slots[targetIdx];
        newSlots[targetIdx] = robot;
        newSlots[draggedIndex] = existing;
      }
    }

    setSlots(newSlots);
    setUnranked(newUnranked);
    setDraggedIndex(null);
    setDraggedSource(null);
    setDragOverIndex(null);
  };

  // Drop back to unranked container handler
  const handleDropUnranked = () => {
    if (draggedIndex === null || draggedSource !== 'slots') return;
    
    const robot = slots[draggedIndex];
    if (robot) {
      const newSlots = [...slots];
      newSlots[draggedIndex] = null;
      setSlots(newSlots);
      setUnranked(prev => [...prev, robot]);
    }
    
    setDraggedIndex(null);
    setDraggedSource(null);
  };

  const handleSubmit = async () => {
    if (!slots.every(s => s !== null)) return;
    
    setLoading(true);
    const question = questionsList[currentQuestionIndex];
    try {
      const sessionId = localStorage.getItem('survey_session_id');
      const age = localStorage.getItem('survey_user_age');

      const res = await fetch('/api/survey2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, ranking: slots, sessionId, age }),
      });
      if (!res.ok) throw new Error('Failed to save survey 2 ranking');
      
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex >= 3) {
        setSubmitted(true);
        setLoading(false);
      } else {
        await loadNextQuestion(nextIndex);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to submit ranking. Please try again.");
      setLoading(false);
    }
  };


  if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading Survey 2...</div>;
  if (error) return <div className="card"><p style={{color: 'red'}}>{error}</p><button onClick={loadInitialData}>Retry</button></div>;

  if (submitted) {
    return (
      <>
        <Confetti />
        <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
          <h2 style={{ color: '#22c55e' }}>🎉 Congratulations!</h2>
          <p style={{ fontSize: '1.05rem', margin: '1rem 0' }}>
            You have successfully completed all 3 ranking questions in Survey 2!
          </p>
          <p style={{ color: '#71717a', fontSize: '0.9rem' }}>
            Your responses have been saved to help us analyze the relationship between robot realism and preference.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2.5rem' }}>
            <button onClick={loadInitialData}>Take Survey Again</button>
            <Link href="/analytics">
              <button style={{ background: '#71717a' }}>View Analytics Dashboard</button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  const isComplete = slots.every(s => s !== null);
  const currentQuestion = questionsList[currentQuestionIndex] || "";

  return (
    <div className="card survey2-container">
      <div style={{ float: 'right', fontSize: '0.85rem', color: '#71717a', fontWeight: 'bold' }}>
        Question {currentQuestionIndex + 1} of 3
      </div>
      <div style={{ clear: 'both' }} />

      <h2>Rank the robots for Question {currentQuestionIndex + 1}:</h2>
      <h3 style={{ color: 'var(--foreground)', margin: '1rem 0', fontWeight: '500' }}>
        "{renderQuestionText(currentQuestion)}"
      </h3>
      
      <p style={{ color: '#71717a', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Drag and drop the robots from the pool into the spectrum slots, or click them to auto-fill left to right. Drag items between slots to swap them.
      </p>

      {/* Empty Spectrum Drag & Drop Area */}
      <div className="spectrum-container">
        <div className="spectrum-label-row">
          <span className="label-best">← Best / Most Fit (Green)</span>
          <span className="label-worst">Worst / Least Fit (Red) →</span>
        </div>
        
        <div className="spectrum-slots">
          {[0, 1, 2, 3, 4].map(idx => {
            const img = slots[idx];
            return (
              <div
                key={idx}
                className={`spectrum-slot slot-${idx} ${dragOverIndex === idx ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOverSlot(e, idx)}
                onDragLeave={() => setDragOverIndex(null)}
                onDrop={() => handleDropSlot(idx)}
              >
                <span className="slot-rank-num">#{idx + 1}</span>
                
                {img ? (
                  <div
                    className="slot-filled-item"
                    draggable
                    onDragStart={() => handleDragStartSlot(idx)}
                  >
                    <button
                      className="slot-remove-btn"
                      onClick={() => handleRemoveClick(img, idx)}
                      title="Remove"
                    >
                      ✕
                    </button>
                    <Image
                      src={`/images/${img}`}
                      alt="Ranked robot"
                      className="slot-filled-img"
                      width={150}
                      height={150}
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  <span className="slot-empty-text">Empty Slot</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Unranked Pool */}
      <div className="unranked-title">Robots Pool</div>
      <div
        className="unranked-pool"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropUnranked}
      >
        {unranked.length === 0 && !isComplete ? (
          <span style={{ color: '#71717a' }}>Drag robots here to unrank them</span>
        ) : unranked.length === 0 && isComplete ? (
          <span style={{ color: '#22c55e', fontWeight: 'bold' }}>All robots placed! Ready to submit.</span>
        ) : (
          unranked.map((img, idx) => (
            <div
              key={img}
              className="unranked-item"
              draggable
              onDragStart={() => handleDragStartUnranked(idx)}
              onClick={() => handleUnrankedClick(img, idx)}
              title="Click to place or drag me"
            >
              <Image
                src={`/images/${img}`}
                alt="Unranked robot"
                className="unranked-img"
                width={1000}
                height={1000}
                style={{ objectFit: 'cover' }}
              />
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button
          onClick={handleSubmit}
          disabled={!isComplete}
          style={{
            padding: '1rem 2.5rem',
            fontSize: '1.1rem',
            opacity: isComplete ? 1 : 0.5,
            cursor: isComplete ? 'pointer' : 'not-allowed',
            background: isComplete ? '#22c55e' : '#a1a1aa'
          }}
        >
          {currentQuestionIndex + 1 === 3 ? "Submit & Complete Survey" : "Submit & Next Question"}
        </button>
      </div>
    </div>
  );
}
