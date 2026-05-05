import Link from 'next/link';

export default function Home() {
  return (
    <div className="card">
      <h1>Welcome to the Uncanny Valley Survey</h1>
      <p>Please participate in our two surveys to help us understand human perception of robots.</p>
      
      <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Link href="/survey1">
          <button style={{ width: '100%', padding: '1rem' }}>Take Survey 1: Realism Rating</button>
        </Link>
        <Link href="/survey2">
          <button style={{ width: '100%', padding: '1rem' }}>Take Survey 2: Preferences</button>
        </Link>
      </div>
    </div>
  );
}
