import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Search from './pages/Search.jsx'
import CalculatorPage from './pages/CalculatorPage.jsx'
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<Search />} />
      <Route path="/calc/:id" element={<CalculatorPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
