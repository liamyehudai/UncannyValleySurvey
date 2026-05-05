'use client';

import { useState, useEffect } from 'react';

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
      
      // Calculate pool sizes based on survey 1 averages
      const poolSizes: Record<number, number> = { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0 };
      for (const img in stats1) {
        if (stats1[img].count > 0) {
          const rounded = Math.round(stats1[img].average);
          const clamped = Math.max(1, Math.min(7, rounded));
          poolSizes[clamped]++;
        }
      }

      // Analyze Survey 2 answers mapped to Survey 1 realism ratings
      const questionsData: Record<string, number[]> = {};
      
      for (const entry of survey2Data) {
        const q = entry.question;
        const chosen = entry.chosenImage;
        if (!questionsData[q]) {
          questionsData[q] = [];
        }
        
        if (stats1[chosen] && stats1[chosen].count > 0) {
          const roundedRating = Math.max(1, Math.min(7, Math.round(stats1[chosen].average)));
          questionsData[q].push(roundedRating);
        }
      }

      const getMean = (arr: number[]) => arr.length ? (arr.reduce((a,b)=>a+b,0) / arr.length).toFixed(2) : 0;
      const getMedian = (arr: number[]) => {
        if (!arr.length) return 0;
        const s = [...arr].sort((a,b)=>a-b);
        const mid = Math.floor(s.length / 2);
        return s.length % 2 !== 0 ? s[mid] : ((s[mid - 1] + s[mid]) / 2).toFixed(2);
      };
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

      const qStats = Object.keys(questionsData).map(q => ({
        question: q,
        answersCount: questionsData[q].length,
        mean: getMean(questionsData[q]),
        median: getMedian(questionsData[q]),
        mode: getMode(questionsData[q])
      }));

      setData({ poolSizes, qStats });
      setLoading(false);
      } catch (err) {
        console.error('Analytics: Error loading data', err);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div>Loading Analytics...</div>;

  return (
    <div className="card" style={{ textAlign: 'left' }}>
      <h2 style={{ textAlign: 'center' }}>Analytics Dashboard</h2>
      
      <h3>Image Pools (by Realism Rating 1-7)</h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--border)' }}>Based on Survey 1 averages, rounded to nearest whole number.</p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {[1, 2, 3, 4, 5, 6, 7].map(num => (
          <div key={num} style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{data.poolSizes[num]}</div>
            <div>Rating {num}</div>
          </div>
        ))}
      </div>

      <h3>Preference Statistics (Survey 2 mapped to Survey 1)</h3>
      {data.qStats.length === 0 ? (
        <p>No preference data yet. Complete Survey 2.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {data.qStats.map((qs: any, idx: number) => (
            <div key={idx} style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 1rem 0' }}>{qs.question}</h4>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div><strong>Responses:</strong> {qs.answersCount}</div>
                <div><strong>Mean:</strong> {qs.mean}</div>
                <div><strong>Median:</strong> {qs.median}</div>
                <div><strong>Mode:</strong> {qs.mode}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
