import React, { useState, useEffect, useRef } from 'react';
import { FaPlane, FaTrain, FaBus } from 'react-icons/fa';
import { auth } from '../../firebase/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // Firebase v9+ modular imports
import './Home.css'; // Ensure the CSS file is linked correctly
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';
import { db } from '../../firebase/firebaseConfig';
import Navbar from '../comon/navbar/Navbar';
import SearchSection from '../comon/search/Search-Section';

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // For login status
  const [selectedMode, setSelectedMode] = useState('flight'); // State for selected mode of travel
  const [showProfilePopup, setShowProfilePopup] = useState(false); // To control visibility of profile popup
  const [userProfile, setUserProfile] = useState(null); // To store user profile data
  const [isEditing, setIsEditing] = useState(false); // For controlling edit mode
  const [editProfileData, setEditProfileData] = useState({}); // State to hold edited profile data
  const { user } = useAuth();
  const popupRef = useRef(null); // Create a ref for the popup container

  // Check user authentication on page load
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsLoggedIn(true);
        console.log("User is logged in with email: ", user.email); // Log email to console
        // Fetch user profile from the registeredUsers collection in Firestore
        const userDocRef = doc(db, 'registeredUsers', user.uid);  // Reference to the user document
        getDoc(userDocRef).then((docSnap) => {  // Fetch the document using getDoc
          if (docSnap.exists()) {
            setUserProfile(docSnap.data()); // Set profile data if document exists
            setEditProfileData(docSnap.data()); // Initialize edit profile data
          } else {
            console.log('No profile data found');
          }
        }).catch((error) => {
          console.error('Error fetching user profile: ', error);
        });
      } else {
        setIsLoggedIn(false);
        setUserProfile(null); // Clear user profile when logged out
        console.log("No user is logged in.");
      }
    });

    // Cleanup on unmount
    return () => unsubscribe();
  }, []);

  // Logout function
  const handleLogout = () => {
    auth.signOut().then(() => {
      setIsLoggedIn(false);
      console.log('User logged out successfully.');
    }).catch((error) => {
      console.error("Error logging out: ", error);
    });
  };

  // Handle mode selection
  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
  };

  // Toggle profile popup visibility
  const toggleProfilePopup = () => {
    setShowProfilePopup(!showProfilePopup);
  };

  // Handle editing of profile data
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditProfileData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Submit the edited profile data to Firebase
  const handleSaveProfile = () => {
    const userDocRef = doc(db, 'registeredUsers', user.uid);
    updateDoc(userDocRef, editProfileData)
      .then(() => {
        setIsEditing(false); // Exit edit mode
        setUserProfile(editProfileData); // Update user profile state
        console.log('Profile updated successfully');
      })
      .catch((error) => {
        console.error('Error updating profile: ', error);
      });
  };

  // Handle cancel changes
  const handleCancelChanges = () => {
    setEditProfileData(userProfile); // Reset to original profile data
    setIsEditing(false); // Exit edit mode
  };

  // Close popup if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowProfilePopup(false); // Close the popup if clicked outside
      }
    };

    // Add event listener for clicks outside the popup
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup the event listener on component unmount
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="home-container">
<Navbar 
  isLoggedIn={isLoggedIn} 
  handleLogout={handleLogout} 
  toggleProfilePopup={toggleProfilePopup} 
/>      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          {/* Search Container */}
          <SearchSection 
      selectedMode={selectedMode} 
      handleModeSelect={handleModeSelect} 
    />
        </div>
      </section>

      {/* Profile Popup */}
      {showProfilePopup && userProfile && (
        <div className="profile-popup" ref={popupRef}>
          <div className="popup-content">
            <button className="close-popup" onClick={toggleProfilePopup}>X</button>
            <h2>User Profile</h2>
            <div className="profile-details">
              <p><strong>Name:</strong> {isEditing ? <input type="text" name="name" value={editProfileData.name} onChange={handleEditChange} /> : userProfile.name}</p>
              <p><strong>Email:</strong> {userProfile.email}</p>
              <p><strong>Phone:</strong> {isEditing ? <input type="text" name="phone" value={editProfileData.phone} onChange={handleEditChange} /> : userProfile.phone}</p>
              <p><strong>Address:</strong> {isEditing ? <input type="text" name="address" value={editProfileData.address} onChange={handleEditChange} /> : userProfile.address}</p>
              <p><strong>Account Type:</strong> {userProfile.accountType}</p>
              <p><strong>Registration Date:</strong> {userProfile.registrationDate?.toDate().toLocaleString()}</p>
            </div>
            {isEditing ? (
              <>
                <button className="save-btn" onClick={handleSaveProfile}>Save Changes</button>
                <button className="cancel-btn" onClick={handleCancelChanges}>Cancel Changes</button>
              </>
            ) : (
              <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
