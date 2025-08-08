import React from 'react'
import { Link } from 'react-router-dom'

const Nav = () => {
  return (
    <div className="nav__container">
        <div className="row__left">
            <Link className='nav__link' to="/">SKINSTRIC</Link>
            <div className="location__container">
            <p className="p__location">INTRO</p> 
            </div>    
        </div>
  
        <button className="simple__btn">ENTER CODE</button>
  
    </div>
  )
}

export default Nav
