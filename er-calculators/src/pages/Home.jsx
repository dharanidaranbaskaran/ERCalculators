import { useNavigate } from 'react-router-dom'
export default function Home() {
  const go = useNavigate()
  return (
    <main className="home">
      <h1>Welcome to ER</h1>
      <p>Quick bedside calculators for the Emergency Department</p>
      <button className="big" onClick={() => go('/search')}>🔍 Search Calculators</button>
    </main>
  )
}
