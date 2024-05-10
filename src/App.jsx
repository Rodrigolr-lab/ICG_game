import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Game from './components/Game'
import Memu from './components/Memu'


const App = () => {
    return (
        <main className='bg-slate-300/20'>
            <Router>
                {/* <Navbar /> */}
                <Routes>
                    <Route path="/" element={<Memu />} />
                    <Route path="/play" element={<Game />} />
                    <Route path="/projects" element={'projects'} />
                    <Route path="/contact" element={'contact'} />
                </Routes>
            </Router>
        </main>
    )
}

export default App
