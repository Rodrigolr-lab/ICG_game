import React from 'react'
import { NavLink } from 'react-router-dom'

const Navbar = () => {
    return (
        <header className='header'>
            <NavLink to='/' className='w-20 h-10 rounded-lg bg-white items-center justify-center flex font-bold shadow-md'>
                <p className='blue-gradient_text'> home </p>
            </NavLink>

            {/* <nav className='flex text-lg gap-7 font-medium'>
                <NavLink to='/about' className='text-black-500'> about </NavLink>
                <NavLink to='/projects' className='text-black-500'> projects </NavLink>
                <NavLink to='/contact' className='text-black-500'> contact </NavLink>
            </nav> */}
        </header>
    )
}

export default Navbar
