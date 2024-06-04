import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Route, BrowserRouter as Router, RouterProvider, Routes, createBrowserRouter } from 'react-router-dom'
import Navbar from './components/Navbar'
import Game from './components/Game'
import Memu from './components/Memu'

const router = createBrowserRouter([
    {
        path: "/ICG_game/",
        element: <Memu />,
        children: [
            {
                path: "/ICG_game/",
                element: <Memu />,
            },
            {
                path: "/ICG_game/play",
                element: <Game />,
            },
        ]
    }
])

ReactDOM.createRoot(document.getElementById('root')).render(<App />);


