import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './components/Home'
import LiveStreaming from './components/LiveStreaming'

function App() {

  return (
    <>
    <BrowserRouter>
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/live-streaming' element={<LiveStreaming />} />
      {/* <Route path='/home' element={<Home />} /> */}
    </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
