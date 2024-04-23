import React from 'react'
import { useNavigate } from "react-router-dom";
import videoBG from '../assets/snakeGame.mp4';

const Memu = () => {
    const navigate = useNavigate()

    const gotToNewPage = () => {
        navigate("/play");
    }

    return (
        <div className='relative flex flex-col items-center justify-center h-screen'>
            <video src={videoBG} autoPlay loop muted className='absolute w-full h-full object-cover' />

            <div className='relative z-10 flex flex-col items-center'>
                <h1 className='text-4xl mb-4'>Snake IO 3D</h1>
                <button onClick={() => gotToNewPage()} className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2'>
                    Start New Game
                </button>
                <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2'>
                    Load Game
                </button>
                <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2'>
                    Settings
                </button>
            </div>
        </div>
    )
}

export default Memu
