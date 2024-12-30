import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import '../navbar/Navbar.css';
import { FaPlane, FaTrain, FaBus, FaTaxi, FaUserCircle } from 'react-icons/fa';

const Navbar = ({ isLoggedIn, handleLogout }) => {
  const [selectedOption, setSelectedOption] = useState(
    sessionStorage.getItem('selectedOption') || 'flight'
  );
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null); // Ref for the profile menu

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    sessionStorage.setItem('selectedOption', option);
  };

  const toggleProfileMenu = () => {
    setProfileMenuOpen(!isProfileMenuOpen);
  };

  const closeProfileMenu = (e) => {
    if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
      setProfileMenuOpen(false);
    }
  };

  useEffect(() => {
    // Add event listener to close profile menu if clicked outside
    document.addEventListener('mousedown', closeProfileMenu);

    return () => {
      // Clean up the event listener when the component unmounts
      document.removeEventListener('mousedown', closeProfileMenu);
    };
  }, []);

  const options = [
    { id: 'flight', label: 'Flights', icon: <FaPlane /> },
    { id: 'train', label: 'Trains', icon: <FaTrain /> },
    { id: 'bus', label: 'Buses', icon: <FaBus /> },
    { id: 'cab', label: 'Cabs', icon: <FaTaxi /> },
  ];

  return (
    <nav className="navbar">
      {/* Logo Section */}
      <div className="navbar-logo">
        <span className="logo-text">Travel Partner</span>
      </div>

      {/* Navigation Icons */}
      <div className="nav-icons">
        {options.map((option) => (
          <div
            key={option.id}
            className={`nav-icon-wrapper ${
              selectedOption === option.id ? 'selected' : ''
            }`}
            onClick={() => handleOptionClick(option.id)}
          >
            <div className="nav-icon">{option.icon}</div>
            <span className="icon-label">{option.label}</span>
          </div>
        ))}
      </div>

      {/* Profile Section */}
      <div className="profile-section">
        <FaUserCircle
          className="profile-icon"
          title="Profile"
          onClick={toggleProfileMenu}
        />
        {isProfileMenuOpen && (
          <div ref={profileMenuRef} className="profile-menu">
            {!isLoggedIn ? (
              <>
                <Link to="/login" className="profile-menu-item">
                  Login
                </Link>
                <Link to="/register" className="profile-menu-item">
                  Signup
                </Link>
              </>
            ) : (
              <>
                <Link to="/profile" className="profile-menu-item">
                  View Profile
                </Link>
                <Link to="/profile/bookings" className="profile-menu-item">
                  My Bookings
                </Link>
                <button
                  className="profile-menu-item logout-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
