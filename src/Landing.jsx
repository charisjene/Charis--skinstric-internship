import React, { useState } from 'react'
import Footer from './Footer'

const Landing = () => {
  const [hoveredSection, setHoveredSection] = useState(null);




  return (
    <div className="main__content">
        <div className={`center__container ${hoveredSection === 'left' ? 'slide-right' :
            hoveredSection === 'right' ? 'slide-left' : ''}`}>
        <div className="main__heading">
          <h1>Sophisticated<br />
          <span>skincare</span>
          </h1>
        </div>
      </div>

       <div className={`left__section ${hoveredSection === 'right' ? 'fade-out' : ''}`}>
        <div className="left__section__container">
          <div className={`left__triangle ${hoveredSection === 'left' ? 'ripple' : ''}`}>
              <span className="ripple-1"></span>
              <span className="ripple-2"></span></div>
          <button className="left__btn"
          onMouseEnter={() => setHoveredSection('left')}
            onMouseLeave={() => setHoveredSection(null)}
            >
            <div className="left-diamond">
            <span className="btn-arrow left-arrow">◀</span>
            </div>
            DISCOVER A.I.            
          </button>
        </div>       
      </div>

       <div className={`right__section ${hoveredSection === 'left' ? 'fade-out' : ''}`}>
        <div className="right__section__container">
          <div className={`right__triangle ${hoveredSection === 'right' ? 'ripple' : ''}`}>
              <span className="ripple-1"></span>
              <span className="ripple-2"></span>
              </div>
          <button className="right__btn"
            onMouseEnter={() => setHoveredSection('right')}
            onMouseLeave={() => setHoveredSection(null)}>
            TAKE TEST
            <div className="right-diamond">
            <span className="btn-arrow right-arrow">▶</span>
            </div>
          </button>
        </div>       
      </div>


<Footer />

    </div>
  )
}

export default Landing
