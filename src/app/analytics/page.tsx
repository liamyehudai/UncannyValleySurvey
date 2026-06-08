'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const QUESTIONS = [
  "Which robot would you prefer to serve you food?",
  "Which robot would you prefer to take care of a sick loved one?",
  "Which robot would you prefer clean your home?"
];

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      console.log('Analytics: Fetching data...');
      try {
        const [s1, s2] = await Promise.all([
          fetch('/api/survey1').then(async r => {
            if (!r.ok) throw new Error('Failed to fetch survey1');
            const data = await r.json();
            console.log('Analytics: Survey 1 data:', data);
            return data;
          }),
          fetch('/api/survey2').then(async r => {
            if (!r.ok) throw new Error('Failed to fetch survey2');
            const data = await r.json();
            console.log('Analytics: Survey 2 data:', data);
            return data;
          })
        ]);
        
        const stats1 = s1.stats || {};
        const survey2Data = s2.data || [];
        
        // 1. Group images into pools 1-7 with detailed statistics from Survey 1
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

        for (const entry of survey2Data) {
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
          } else if (entry.chosenImage) {
            // Old format fallback: chosen gets 5 points
            const img = entry.chosenImage;
            const score = 5;

            if (stats1[img] && stats1[img].count > 0) {
              const roundedRating = Math.max(1, Math.min(7, Math.round(stats1[img].average)));
              poolScores[roundedRating] += score;
              poolVotes[roundedRating] += 1;
            }

            if (!overallRobotScores[img]) overallRobotScores[img] = [];
            overallRobotScores[img].push(score);

            if (!taskRobotScores[q][img]) taskRobotScores[q][img] = [];
            taskRobotScores[q][img].push(score);
          }
        }

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
            robotList.push({
              image: img,
              ...stats
            });
          }
          // Sort descending by mean score
          robotList.sort((a, b) => b.mean - a.mean);
          topRobotsByTask[task] = robotList.slice(0, 5);
        }

        // We also pass qStats for the task answers distribution
        const questionsData: Record<string, number[]> = {};
        for (const entry of survey2Data) {
          const q = entry.question;
          let imagesList: string[] = [];
          if (entry.ranking) {
            imagesList = entry.ranking;
          } else if (entry.chosenImage) {
            imagesList = [entry.chosenImage];
          }
          if (!questionsData[q]) questionsData[q] = [];
          imagesList.forEach(img => {
            if (stats1[img] && stats1[img].count > 0) {
              const roundedRating = Math.max(1, Math.min(7, Math.round(stats1[img].average)));
              questionsData[q].push(roundedRating);
            }
          });
        }
        
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

        setData({
          pools,
          qStats,
          poolScores,
          poolVotes,
          bestPool,
          bestPoolScore,
          bestRobot,
          bestRobotAvg,
          topRobotsByTask
        });
        setLoading(false);
      } catch (err) {
        console.error('Analytics: Error loading data', err);
        setLoading(false);
      }
    }
    loadData();
  }, []);

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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={`/images/${data.bestRobot}`} 
                alt="Winner robot" 
                style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '2px solid var(--primary)' }}
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/images/${item.image}`}
                        alt={item.image}
                        className="robot-thumbnail"
                      />
                      
                      <div className="robot-tooltip">
                        <div className="tooltip-title">{item.image}</div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/images/${item.image}`}
                          alt={item.image}
                          style={{ width: '100%', aspectRatio: '1', objectFit: 'contain', borderRadius: '8px', marginBottom: '0.75rem', backgroundColor: 'var(--background)' }}
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

      {/* Section 2: Top 5 Robots per Task (Survey 2) */}
      <h3 style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem', marginTop: '2rem' }}>
        Top 5 Fit Robots by Task
      </h3>
      <p style={{ fontSize: '0.9rem', color: '#71717a', marginBottom: '1.5rem' }}>
        The top 5 robots ranked best for each individual task (1st place on the left, 5th place on the right). Hover over any robot to view detailed statistics (mean, median, mode, and individual score variance).
      </p>

      <div className="task-rankings-container">
        {QUESTIONS.map((task) => {
          const topRobots = data?.topRobotsByTask?.[task] || [];
          return (
            <div key={task} className="task-card">
              <div className="task-title">"{task}"</div>
              
              <div className="ranking-row">
                {topRobots.length === 0 ? (
                  <div style={{ color: '#71717a', fontSize: '0.9rem', padding: '1rem 0' }}>
                    No ranking responses submitted for this task yet.
                  </div>
                ) : (
                  topRobots.map((robot: any, idx: number) => (
                    <div key={robot.image} className="rank-item">
                      <div className="rank-badge">{idx + 1}</div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={`/images/${robot.image}`} 
                        alt={`Robot Rank ${idx + 1}`} 
                        className="rank-thumbnail"
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
                        <div className="tooltip-stat-row" style={{ marginTop: '0.25rem', borderTop: '1px solid #27272a', paddingTop: '0.25rem' }}>
                          <span>Rankings:</span>
                          <span style={{ fontWeight: 'bold' }}>{robot.count}</span>
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
    </div>
  );
}
