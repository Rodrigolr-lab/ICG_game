import React from 'react'

const Memu = () => {
    return (
        <div className='flex flex-col items-center justify-center h-screen'>
            <video autoPlay loop muted className='absolute w-full h-full object-cover -z-30'>
                <source src='snakeGame.mp4' type='video/mp4' />
            </video>
            <h1 className='text-4xl mb-4'>Snake IO 3D</h1>
            <button onClick={'/play'} className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2'>
                Start New Game
            </button>
            <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2'>
                Load Game
            </button>
            <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2'>
                Settings
            </button>
        </div>
    )
}

export default Memu
