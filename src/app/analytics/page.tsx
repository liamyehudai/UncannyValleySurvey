'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const QUESTIONS = [
  "Which robot would you prefer to serve you food?",
  "Which robot would you prefer to take care of a sick loved one?",
  "Which robot would you prefer clean your home?"
];

const POOL_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#f59e0b',
  4: '#eab308',
  5: '#84cc16',
  6: '#22c55e',
  7: '#10b981'
};

// Helper function to detect low-quality outlier responses
function detectOutliers(session: any) {
  const reasons: string[] = [];

  // 1. Incomplete Session Check
  // A complete session must have at least 5 survey1 ratings AND 3 survey2 task rankings
  const s1Complete = session.survey1 && session.survey1.length >= 5;
  const s2Complete = session.survey2 && session.survey2.length >= 3;
  if (!s1Complete || !s2Complete) {
    reasons.push("Incomplete data");
  }

  // 2. Age Check (under 12 or over 95)
  if (session.age !== undefined && session.age !== null) {
    const ageNum = Number(session.age);
    if (ageNum < 12 || ageNum > 95) {
      reasons.push(`Implausible age (${ageNum})`);
    }
  } else {
    reasons.push("Missing age");
  }

  // 3. Straight-lining Check (giving the exact same rating for all images in Survey 1)
  if (s1Complete) {
    const ratings = session.survey1.map((r: any) => r.rating);
    const firstRating = ratings[0];
    const allSame = ratings.every((r: number) => r === firstRating);
    if (allSame) {
      reasons.push(`Straight-lining (rated all images ${firstRating})`);
    }
  }

  // 4. Speed-running Check (average time per rating < 1.5 seconds or click interval < 800ms)
  if (session.survey1 && session.survey1.length >= 2) {
    const sortedS1 = [...session.survey1].sort((a, b) => a.timestamp - b.timestamp);
    let rapidClicks = 0;
    
    const s1Duration = sortedS1[sortedS1.length - 1].timestamp - sortedS1[0].timestamp;
    const avgTimePerQuestion = s1Duration / (sortedS1.length - 1);
    
    for (let i = 1; i < sortedS1.length; i++) {
      const delta = sortedS1[i].timestamp - sortedS1[i - 1].timestamp;
      if (delta < 800) {
        rapidClicks++;
      }
    }
    
    if (avgTimePerQuestion < 1500 || rapidClicks >= 2) {
      reasons.push(`Speed-running (avg ${(avgTimePerQuestion / 1000).toFixed(1)}s/question)`);
    }
  }

  return {
    isOutlier: reasons.length > 0,
    reasons
  };
}

export default function Analytics() {
  const [rawResponses, setRawResponses] = useState<any[]>([]);
  const [excludeOutliers, setExcludeOutliers] = useState(true);
  const [ignoreFewerThanThreeVotes, setIgnoreFewerThanThreeVotes] = useState(false);
  const [loading, setLoading] = useState(true);

  // Age Filter States
  const [minAge, setMinAge] = useState(1);
  const [maxAge, setMaxAge] = useState(120);
  const [agePreset, setAgePreset] = useState('all');

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = e.target.value;
    setAgePreset(preset);
    if (preset === 'all') {
      setMinAge(1);
      setMaxAge(120);
    } else if (preset === '17-24') {
      setMinAge(17);
      setMaxAge(24);
    } else if (preset === '25-34') {
      setMinAge(25);
      setMaxAge(34);
    } else if (preset === '35-44') {
      setMinAge(35);
      setMaxAge(44);
    } else if (preset === '45-54') {
      setMinAge(45);
      setMaxAge(54);
    } else if (preset === '55-64') {
      setMinAge(55);
      setMaxAge(64);
    } else if (preset === '65+') {
      setMinAge(65);
      setMaxAge(120);
    }
  };

  useEffect(() => {
    async function loadResponses() {
      console.log('Analytics: Fetching session responses...');
      try {
        const res = await fetch('/api/responses');
        if (!res.ok) throw new Error('Failed to fetch responses');
        const responses = await res.json();
        console.log(`Analytics: Successfully fetched ${responses.length} responses.`);
        setRawResponses(responses);
        setLoading(false);
      } catch (err) {
        console.error('Analytics: Error loading responses', err);
        setLoading(false);
      }
    }
    loadResponses();
  }, []);

  const data = useMemo(() => {
    if (rawResponses.length === 0) return null;

    // Run outlier detection on all sessions
    const sessionsWithOutlierStatus = rawResponses.map(session => {
      const outlierStatus = detectOutliers(session);
      return {
        ...session,
        isOutlier: outlierStatus.isOutlier,
        outlierReasons: outlierStatus.reasons
      };
    });

    const filteredOutliers = excludeOutliers
      ? sessionsWithOutlierStatus.filter(s => !s.isOutlier)
      : sessionsWithOutlierStatus;

    // Isolate by age range
    const activeSessions = filteredOutliers.filter(session => {
      if (session.age === null || session.age === undefined) return false;
      const ageNum = Number(session.age);
      return ageNum >= minAge && ageNum <= maxAge;
    });

    // 1. Group images into pools 1-7 with detailed statistics from Survey 1
    const stats1: Record<string, { total: number; count: number; average: number; ratings: number[] }> = {};
    activeSessions.forEach(session => {
      if (!session.survey1) return;
      session.survey1.forEach((entry: any) => {
        const img = entry.image;
        const rating = entry.rating;
        if (!stats1[img]) {
          stats1[img] = { total: 0, count: 0, average: 0, ratings: [] };
        }
        stats1[img].total += rating;
        stats1[img].count += 1;
        stats1[img].ratings.push(rating);
      });
    });

    for (const key in stats1) {
      stats1[key].average = stats1[key].total / stats1[key].count;
    }

    const pools: Record<number, Array<{
      image: string;
      average: number;
      count: number;
      mode: number;
      variance: number;
      distribution: Record<number, number>;
      maxDistCount: number;
    }>> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };

    const getMode = (arr: number[]) => {
      if (!arr.length) return 0;
      const counts: Record<number, number> = {};
      let maxCount = 0;
      let mode = arr[0];
      for (const num of arr) {
        counts[num] = (counts[num] || 0) + 1;
        if (counts[num] > maxCount) {
          maxCount = counts[num];
          mode = num;
        }
      }
      return mode;
    };

    for (const img in stats1) {
      const item = stats1[img];
      if (item.count > 0) {
        const rounded = Math.round(item.average);
        const clamped = Math.max(1, Math.min(7, rounded));
        
        // Calculate distribution
        const distribution: Record<number, number> = { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0 };
        item.ratings.forEach((r: number) => {
          if (r >= 1 && r <= 7) {
            distribution[r]++;
          }
        });
        const maxDistCount = Math.max(...Object.values(distribution), 1);

        // Calculate variance for realism ratings
        const mean = item.average;
        const sumSquareDiffs = item.ratings.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0);
        const variance = item.ratings.length > 1 ? sumSquareDiffs / item.ratings.length : 0;

        pools[clamped].push({
          image: img,
          average: item.average,
          count: item.count,
          mode: getMode(item.ratings),
          variance,
          distribution,
          maxDistCount
        });
      }
    }

    // Sort images within each pool by their average realism score
    for (const key in pools) {
      pools[Number(key)].sort((a, b) => a.average - b.average);
    }

    // 2. Process Survey 2 rankings & scores
    const poolScores: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    const poolVotes: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    const overallRobotScores: Record<string, number[]> = {};
    
    const taskRobotScores: Record<string, Record<string, number[]>> = {
      "Which robot would you prefer to serve you food?": {},
      "Which robot would you prefer to take care of a sick loved one?": {},
      "Which robot would you prefer clean your home?": {}
    };

    activeSessions.forEach(session => {
      if (!session.survey2) return;
      session.survey2.forEach((entry: any) => {
        const q = entry.question;
        if (!taskRobotScores[q]) {
          taskRobotScores[q] = {};
        }

        if (entry.ranking && Array.isArray(entry.ranking)) {
          // New ranking format: 5 elements, score is 5, 4, 3, 2, 1
          entry.ranking.forEach((img: string, idx: number) => {
            const score = 5 - idx;
            
            // Accumulate pool score based on robot's Survey 1 rating
            if (stats1[img] && stats1[img].count > 0) {
              const roundedRating = Math.max(1, Math.min(7, Math.round(stats1[img].average)));
              poolScores[roundedRating] += score;
              poolVotes[roundedRating] += 1;
            }

            // Overall robot scores
            if (!overallRobotScores[img]) overallRobotScores[img] = [];
            overallRobotScores[img].push(score);

            // Task-specific scores
            if (!taskRobotScores[q][img]) taskRobotScores[q][img] = [];
            taskRobotScores[q][img].push(score);
          });
        }
      });
    });

    // Helper stats calculation
    const getMeanNum = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    
    const calculateDetailedStats = (scores: number[]) => {
      if (!scores || scores.length === 0) return { mean: 0, median: 0, mode: 0, variance: 0, count: 0 };
      const count = scores.length;
      const mean = scores.reduce((a, b) => a + b, 0) / count;
      
      const sorted = [...scores].sort((a, b) => a - b);
      const mid = Math.floor(count / 2);
      const median = count % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      
      const counts: Record<number, number> = {};
      let maxCount = 0;
      let mode = sorted[0];
      for (const num of sorted) {
        counts[num] = (counts[num] || 0) + 1;
        if (counts[num] > maxCount) {
          maxCount = counts[num];
          mode = num;
        }
      }
      
      const sumSquareDiffs = scores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
      const variance = sumSquareDiffs / count;

      return { mean, median, mode, variance, count };
    };

    // Determine which pool was chosen the most (by accumulated score)
    let bestPool = 0;
    let bestPoolScore = -1;
    for (let i = 1; i <= 7; i++) {
      if (poolScores[i] > bestPoolScore) {
        bestPoolScore = poolScores[i];
        bestPool = i;
      }
    }

    // Determine the best overall robot (by average score)
    let bestRobot = "";
    let bestRobotAvg = 0;
    for (const img in overallRobotScores) {
      const avg = getMeanNum(overallRobotScores[img]);
      if (avg > bestRobotAvg) {
        bestRobotAvg = avg;
        bestRobot = img;
      }
    }

    // Determine top 5 robots for each task
    const topRobotsByTask: Record<string, Array<{
      image: string;
      realismAvg: number;
      mean: number;
      median: number;
      mode: number;
      variance: number;
      count: number;
    }>> = {};

    for (const task in taskRobotScores) {
      const robots = taskRobotScores[task];
      const robotList = [];
      for (const img in robots) {
        const scores = robots[img];
        const stats = calculateDetailedStats(scores);
        const realismAvg = stats1[img] ? stats1[img].average : 0;
        robotList.push({
          image: img,
          realismAvg,
          ...stats
        });
      }
      // Sort descending by mean score
      robotList.sort((a, b) => b.mean - a.mean);
      topRobotsByTask[task] = robotList;
    }

    // We also pass qStats for the task answers distribution
    const questionsData: Record<string, number[]> = {};
    activeSessions.forEach(session => {
      if (!session.survey2) return;
      session.survey2.forEach((entry: any) => {
        const q = entry.question;
        let imagesList: string[] = [];
        if (entry.ranking) {
          imagesList = entry.ranking;
        }
        if (!questionsData[q]) questionsData[q] = [];
        imagesList.forEach(img => {
          if (stats1[img] && stats1[img].count > 0) {
            const roundedRating = Math.max(1, Math.min(7, Math.round(stats1[img].average)));
            questionsData[q].push(roundedRating);
          }
        });
      });
    });
    
    const getMedian = (arr: number[]) => {
      if (!arr.length) return 0;
      const s = [...arr].sort((a,b)=>a-b);
      const mid = Math.floor(s.length / 2);
      return s.length % 2 !== 0 ? s[mid] : ((s[mid - 1] + s[mid]) / 2).toFixed(2);
    };
    const getModeOverall = (arr: number[]) => {
      if (!arr.length) return 0;
      const counts: Record<number, number> = {};
      let maxCount = 0;
      let mode = arr[0];
      for (const num of arr) {
        counts[num] = (counts[num] || 0) + 1;
        if (counts[num] > maxCount) {
          maxCount = counts[num];
          mode = num;
        }
      }
      return mode;
    };

    const qStats = Object.keys(questionsData).map(q => ({
      question: q,
      answersCount: questionsData[q].length,
      mean: getMeanNum(questionsData[q]).toFixed(2),
      median: getMedian(questionsData[q]),
      mode: getModeOverall(questionsData[q])
    }));

    // Group outlier stats for UI display
    const outlierCounts = {
      total: sessionsWithOutlierStatus.length,
      valid: sessionsWithOutlierStatus.filter(s => !s.isOutlier).length,
      outliers: sessionsWithOutlierStatus.filter(s => s.isOutlier).length,
      byReason: {
        incomplete: sessionsWithOutlierStatus.filter(s => s.outlierReasons.some((r: string) => r.includes("Incomplete"))).length,
        age: sessionsWithOutlierStatus.filter(s => s.outlierReasons.some((r: string) => r.includes("age") || r.includes("Age") || r.includes("age"))).length,
        straightlining: sessionsWithOutlierStatus.filter(s => s.outlierReasons.some((r: string) => r.includes("Straight-lining"))).length,
        speed: sessionsWithOutlierStatus.filter(s => s.outlierReasons.some((r: string) => r.includes("Speed"))).length,
      }
    };

    return {
      pools,
      qStats,
      poolScores,
      poolVotes,
      bestPool,
      bestPoolScore,
      bestRobot,
      bestRobotAvg,
      topRobotsByTask,
      outlierCounts,
      activeCohortSize: activeSessions.length
    };
  }, [rawResponses, excludeOutliers, minAge, maxAge]);

  const handleDownload = async () => {
    try {
      const res = await fetch('/api/responses');
      if (!res.ok) throw new Error('Failed to fetch responses');
      const jsonData = await res.json();
      
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'survey_responses.json';
      document.body.appendChild(a);
      a.click();
      
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading JSON:', error);
      alert('Failed to download JSON data.');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading Analytics...</div>;
  
  if (rawResponses.length === 0) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <h2>No Data Available</h2>
        <p style={{ color: '#71717a', margin: '1rem 0' }}>
          No responses have been recorded in the survey responses file yet.
        </p>
        <Link href="/survey1">
          <button style={{ marginTop: '1rem' }}>Take Survey 1</button>
        </Link>
      </div>
    );
  }

  if (!data) return <div>Error loading analytics data. Please try again later.</div>;


  return (
    <div className="card" style={{ textAlign: 'left', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>Analytics Dashboard</h2>
        <button 
          onClick={handleDownload}
          style={{ 
            background: 'var(--primary)',
            color: 'white',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download JSON Data
        </button>
      </div>

      {/* Data Filters & Quality Control Panel */}
      <div style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2.5rem' }}>
        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)' }}>
          <span style={{ fontSize: '1.2rem' }}>⚙️</span> Analytics Filter Panel
        </h4>
        <p style={{ margin: '0.25rem 0 1.25rem 0', fontSize: '0.85rem', color: '#71717a' }}>
          Refine the data pool by isolating user demographics (age ranges) and excluding outlier submissions.
        </p>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Left Side: Demographic Filters */}
          <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--card)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--foreground)' }}>👥 Demographic Isolation</div>
            
            {/* Age Preset Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#71717a' }}>Age Group Presets:</label>
              <select
                value={agePreset}
                onChange={handlePresetChange}
                style={{
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  outline: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                <option value="all">All Ages (1 - 120)</option>
                <option value="17-24">17 to 24</option>
                <option value="25-34">25 to 34</option>
                <option value="35-44">35 to 44</option>
                <option value="45-54">45 to 54</option>
                <option value="55-64">55 to 64</option>
                <option value="65+">65 or older</option>
                <option value="custom">Custom Range (Slider)</option>
              </select>
            </div>

            {/* Slider Range Display */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)', marginTop: '0.5rem' }}>
              <span>Isolating Ages:</span>
              <span>{minAge} - {maxAge} years old</span>
            </div>

            {/* Double Thumb Age Slider */}
            <div style={{ padding: '0 0.5rem' }}>
              <div className="age-slider-container">
                <div 
                  className="slider-track" 
                  style={{ 
                    left: `${((minAge - 1) / 119) * 100}%`, 
                    right: `${100 - ((maxAge - 1) / 119) * 100}%` 
                  }}
                ></div>
                <input
                  type="range"
                  min="1"
                  max="120"
                  value={minAge}
                  onChange={(e) => {
                    const value = Math.min(Number(e.target.value), maxAge - 1);
                    setMinAge(value);
                    setAgePreset("custom");
                  }}
                  className="thumb thumb-left"
                  style={{ zIndex: minAge > 60 ? 5 : 4 }}
                />
                <input
                  type="range"
                  min="1"
                  max="120"
                  value={maxAge}
                  onChange={(e) => {
                    const value = Math.max(Number(e.target.value), minAge + 1);
                    setMaxAge(value);
                    setAgePreset("custom");
                  }}
                  className="thumb thumb-right"
                  style={{ zIndex: minAge > 60 ? 4 : 5 }}
                />
              </div>
            </div>
          </div>

          {/* Right Side: Data Quality and Outliers */}
          <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--card)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--foreground)' }}>🛡️ Data Quality & Outliers</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--foreground)' }}>
                <input 
                  type="checkbox" 
                  checked={excludeOutliers} 
                  onChange={(e) => setExcludeOutliers(e.target.checked)} 
                  style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
                />
                Exclude Outliers
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', textAlign: 'center', fontSize: '0.75rem' }}>
              <div style={{ flex: 1, background: 'var(--background)', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <div style={{ color: '#71717a', fontWeight: 'bold' }}>Total Pool</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--foreground)' }}>{data.outlierCounts.total}</div>
              </div>
              <div style={{ flex: 1, background: 'var(--background)', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <div style={{ color: '#22c55e', fontWeight: 'bold' }}>Valid (Clean)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#22c55e' }}>{data.outlierCounts.valid}</div>
              </div>
              <div style={{ flex: 1, background: 'var(--background)', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <div style={{ color: '#ef4444', fontWeight: 'bold' }}>Outliers</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ef4444' }}>{data.outlierCounts.outliers}</div>
              </div>
              <div style={{ flex: 1.2, background: 'rgba(59, 130, 246, 0.08)', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Active Cohort</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary)' }}>{data.activeCohortSize}</div>
              </div>
            </div>

            {/* Outlier breakdown list */}
            <div style={{ fontSize: '0.8rem', color: '#71717a', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: 'var(--foreground)' }}>Detected Outliers:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem 0.5rem' }}>
                <div>❌ Incomplete: <strong>{data.outlierCounts.byReason.incomplete}</strong></div>
                <div>👶 Implausible Age: <strong>{data.outlierCounts.byReason.age}</strong></div>
                <div>📏 Straight-lining: <strong>{data.outlierCounts.byReason.straightlining}</strong></div>
                <div>⚡ Speed-running: <strong>{data.outlierCounts.byReason.speed}</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Insights */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        <div style={{ flex: 1, minWidth: '280px', background: 'var(--background)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#71717a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Most Selected Realism Level</span>
          {data.bestPool > 0 ? (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)' }}>Pool {data.bestPool}</div>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#71717a' }}>
                Accumulated <strong>{data.bestPoolScore}</strong> preference points.
              </p>
            </div>
          ) : (
            <div style={{ marginTop: '0.5rem', color: '#a1a1aa', fontSize: '0.9rem' }}>No preference data available yet.</div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: '280px', background: 'var(--background)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {data.bestRobot ? (
            <>
              <Image 
                src={`/images/${data.bestRobot}`} 
                alt="Winner robot" 
                width={80}
                height={80}
                style={{ borderRadius: '8px', objectFit: 'cover', border: '2px solid var(--primary)' }}
              />
              <div>
                <span style={{ fontSize: '0.85rem', color: '#71717a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Best Rated Robot Overall</span>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--foreground)', marginTop: '0.25rem' }}>{data.bestRobot}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '600' }}>
                  Average Ranking Score: {data.bestRobotAvg.toFixed(2)} / 5.0
                </div>
              </div>
            </>
          ) : (
            <div>
              <span style={{ fontSize: '0.85rem', color: '#71717a', fontWeight: 'bold', textTransform: 'uppercase' }}>Best Rated Robot Overall</span>
              <div style={{ marginTop: '0.5rem', color: '#a1a1aa', fontSize: '0.9rem' }}>No ranking data available yet.</div>
            </div>
          )}
        </div>
      </div>

      {/* Section 1: Realism Spectrum & Image Pools (Survey 1) */}
      <h3>Realism Spectrum & Image Pools</h3>
      <p style={{ fontSize: '0.9rem', color: '#71717a', marginBottom: '1.5rem' }}>
        Robots categorized into pools 1-7 based on their average realism rating (Survey 1). Hover over any thumbnail to view response statistics and rating distributions.
      </p>
      
      <div className="spectrum-row">
        {[1, 2, 3, 4, 5, 6, 7].map(num => {
          const poolItems = data?.pools?.[num] || [];
          return (
            <div key={num} className={`spectrum-column col-${num}`}>
              <div className="col-header">Pool {num}</div>
              <div className="col-subheader">{poolItems.length} {poolItems.length === 1 ? 'Robot' : 'Robots'}</div>
              
              <div className="thumbnail-stack">
                {poolItems.length === 0 ? (
                  <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Empty</span>
                ) : (
                  poolItems.map((item: any, idx: number) => (
                    <div key={idx} className="thumbnail-wrapper">
                      <Image
                        src={`/images/${item.image}`}
                        alt={item.image}
                        className="robot-thumbnail"
                        width={42}
                        height={42}
                      />
                      
                      <div className="robot-tooltip">
                        <div className="tooltip-title">{item.image}</div>
                        <Image
                          src={`/images/${item.image}`}
                          alt={item.image}
                          width={200}
                          height={200}
                          style={{ width: '100%', height: 'auto', aspectRatio: '1', objectFit: 'contain', borderRadius: '8px', marginBottom: '0.75rem', backgroundColor: 'var(--background)' }}
                        />
                        <div className="tooltip-stat-row">
                          <span>Average (Mean):</span>
                          <span className="tooltip-stat-val">{item.average.toFixed(2)}</span>
                        </div>
                        <div className="tooltip-stat-row">
                          <span>Total Votes:</span>
                          <span className="tooltip-stat-val">{item.count}</span>
                        </div>
                        <div className="tooltip-stat-row">
                          <span>Mode Rating:</span>
                          <span className="tooltip-stat-val">{item.mode}</span>
                        </div>
                        <div className="tooltip-stat-row">
                          <span>Variance:</span>
                          <span className="tooltip-stat-val" style={{ color: '#f59e0b' }}>{(item.variance ?? 0).toFixed(3)}</span>
                        </div>
                        
                        <div className="tooltip-divider" />
                        
                        <div className="tooltip-chart-title">Rating Distribution</div>
                        <div className="tooltip-chart">
                          {[1, 2, 3, 4, 5, 6, 7].map(r => {
                            const count = item.distribution[r] || 0;
                            const heightPct = ((count / item.maxDistCount) * 100).toFixed(0);
                            return (
                              <div
                                key={r}
                                className="tooltip-chart-bar"
                                style={{ height: `${Math.max(4, Number(heightPct))}%` }}
                                title={`Rating ${r}: ${count} votes`}
                              />
                            );
                          })}
                        </div>
                        <div className="tooltip-chart-labels">
                          <span>1</span>
                          <span>2</span>
                          <span>3</span>
                          <span>4</span>
                          <span>5</span>
                          <span>6</span>
                          <span>7</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Section 2: Robot Rankings by Task (Survey 2) */}
      <h3 style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem', marginTop: '2rem' }}>
        Robot Rankings by Task
      </h3>
      <p style={{ fontSize: '0.9rem', color: '#71717a', marginBottom: '1.5rem' }}>
        All robots ranked in order of preference for each task (highest score on the left, lowest on the right). Scroll horizontally to view all rankings. Hover over any robot to view detailed statistics (mean, median, mode, and individual score variance).
      </p>

      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--foreground)' }}>
          <input 
            type="checkbox" 
            checked={ignoreFewerThanThreeVotes} 
            onChange={(e) => setIgnoreFewerThanThreeVotes(e.target.checked)} 
            style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }}
          />
          Ignore robots with fewer than 3 votes/rankings in this task
        </label>
      </div>

      <div className="task-rankings-container">
        {QUESTIONS.map((task) => {
          let topRobots = data?.topRobotsByTask?.[task] || [];
          if (ignoreFewerThanThreeVotes) {
            topRobots = topRobots.filter((robot: any) => robot.count >= 3);
          }
          return (
            <div key={task} className="task-card">
              <div className="task-title">"{task}"</div>
              
              <div className="ranking-row">
                {topRobots.length === 0 ? (
                  <div style={{ color: '#71717a', fontSize: '0.9rem', padding: '1rem 0' }}>
                    No ranking responses submitted for this task yet.
                  </div>
                ) : (
                  topRobots.map((robot: any, idx: number) => {
                    const poolNum = Math.max(1, Math.min(7, Math.round(robot.realismAvg)));
                    const poolColor = robot.realismAvg > 0 ? POOL_COLORS[poolNum] : 'var(--border)';
                    
                    return (
                      <div 
                        key={robot.image} 
                        className="rank-item" 
                        style={{ borderTop: `4px solid ${poolColor}` }}
                      >
                        <div className="rank-badge">{idx + 1}</div>
                        <Image 
                          src={`/images/${robot.image}`} 
                          alt={`Robot Rank ${idx + 1}`} 
                          className="rank-thumbnail"
                          width={80}
                          height={80}
                        />
                        <div className="rank-score">Score: {robot.mean.toFixed(2)}</div>
                        
                        {/* Hover stats panel */}
                        <div className="rank-tooltip">
                          <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {robot.image}
                          </div>
                          <div className="tooltip-stat-row">
                            <span>Mean:</span>
                            <span className="tooltip-stat-val">{robot.mean.toFixed(2)}</span>
                          </div>
                          <div className="tooltip-stat-row">
                            <span>Median:</span>
                            <span className="tooltip-stat-val">{Number(robot.median).toFixed(1)}</span>
                          </div>
                          <div className="tooltip-stat-row">
                            <span>Mode:</span>
                            <span className="tooltip-stat-val">{robot.mode}</span>
                          </div>
                          <div className="tooltip-stat-row">
                            <span>Variance:</span>
                            <span className="tooltip-stat-val" style={{ color: '#f59e0b' }}>
                              {robot.variance.toFixed(3)}
                            </span>
                          </div>
                          <div className="tooltip-stat-row">
                            <span>Rankings Cast:</span>
                            <span className="tooltip-stat-val">{robot.count}</span>
                          </div>
                          <div className="tooltip-stat-row" style={{ color: poolColor, fontWeight: 'bold' }}>
                            <span>Realism Rating:</span>
                            <span>{robot.realismAvg > 0 ? robot.realismAvg.toFixed(2) : 'N/A'} (Pool {poolNum})</span>
                          </div>
                          <div className="tooltip-stat-row" style={{ marginTop: '0.25rem', borderTop: '1px solid #27272a', paddingTop: '0.25rem' }}>
                            <span>Rankings:</span>
                            <span style={{ fontWeight: 'bold' }}>{robot.count}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
