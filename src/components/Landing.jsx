// Landing.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";

const Landing = () => {
  const [hoveredSection, setHoveredSection] = useState(null);

  return (
    <div className="main__content">
      <div
        className={`center__container ${
          hoveredSection === "left"
            ? "slide-right"
            : hoveredSection === "right"
            ? "slide-left"
            : ""
        }`}
      >
        <div
          className={`main__heading ${
            hoveredSection === "left"
              ? "align-right"
              : hoveredSection === "right"
              ? "align-left"
              : ""
          }`}
        >
          <h1>
            Sophisticated
            <br />
            skincare
          </h1>

          {/* Small-screen body + CTA */}
          <p className="center__body">
            Skinstric developed an A.I. that creates a
            <br />
            highly-personalized routine tailored to
            <br />
            what your skin needs.
          </p>

          <Link to="/intro" className="center__cta">
            <span className="responsive__link">ENTER EXPERIENCE</span>
            <span className="diamond-shape" aria-hidden="true">
              <span className="diamond-arrow">▶</span>
            </span>
          </Link>
        </div>
      </div>

      {/* Left Section */}
      <div
        className={`left__section ${
          hoveredSection === "right" ? "fade-out" : ""
        }`}
      >
        <div className="left__section__container">
          <div
            className={`left__triangle ${
              hoveredSection === "left" ? "ripple" : ""
            }`}
          >
            <span className="ripple-1"></span>
            <span className="ripple-2"></span>
          </div>
          <button
            className="diamond-btn left__btn"
            onMouseEnter={() => setHoveredSection("left")}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <div className="diamond-shape">
              <span className="diamond-arrow">◀</span>
            </div>
            DISCOVER A.I.
          </button>
        </div>
      </div>

      {/* Right Section */}
      <div
        className={`right__section ${
          hoveredSection === "left" ? "fade-out" : ""
        }`}
      >
        <div className="right__section__container">
          <div
            className={`right__triangle ${
              hoveredSection === "right" ? "ripple" : ""
            }`}
          >
            <span className="ripple-1"></span>
            <span className="ripple-2"></span>
          </div>
          <Link to="/intro">
            <button
              className="diamond-btn right__btn"
              onMouseEnter={() => setHoveredSection("right")}
              onMouseLeave={() => setHoveredSection(null)}
            >
              TAKE TEST
              <div className="diamond-shape">
                <span className="diamond-arrow">▶</span>
              </div>
            </button>
          </Link>
        </div>
      </div>

      <div className="bottom__text">
        <p>
          SKINSTRIC DEVELOPED A.I. THAT CREATES
          <br />
          A HIGHLY PERSONALISED ROUTINE TAILORED TO
          <br />
          WHAT YOUR SKIN NEEDS.
        </p>
      </div>
    </div>
  );
};

export default Landing;