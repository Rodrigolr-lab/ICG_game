import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Route, BrowserRouter as Router, RouterProvider, Routes, createBrowserRouter } from 'react-router-dom'
import Navbar from './components/Navbar'
import Game from './components/Game'
import Memu from './components/Memu'


ReactDOM.createRoot(document.getElementById('root')).render(<App />);


