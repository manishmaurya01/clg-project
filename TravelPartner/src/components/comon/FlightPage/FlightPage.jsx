import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../navbar/Navbar';
import SearchSection from '../search/Search-Section';
import { auth } from '../../../firebase/firebaseConfig';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../../AuthContext';
import { db } from '../../../firebase/firebaseConfig';
import './FlightPage.css';

const FlightPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editProfileData, setEditProfileData] = useState({});
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [flights, setFlights] = useState([]); // State for flight data
  const [selectedFlight, setSelectedFlight] = useState(null); // State to store selected flight for details
  const { user } = useAuth();
  const popupRef = useRef(null);

  const getSearchCriteriaFromSession = () => {
    const travelClass = sessionStorage.getItem('travelClass')?.toUpperCase();
    const from = sessionStorage.getItem('from')?.toUpperCase();
    const to = sessionStorage.getItem('to')?.toUpperCase();
    const departure = sessionStorage.getItem('departure');
    const arrival = sessionStorage.getItem('arrival');
  
    return { travelClass, from, to, departure, arrival };
  };
  
  const handleSearch = async () => {
    const { from, to, departure, arrival, travelClass } = getSearchCriteriaFromSession();
  
    // Helper function to convert mm/dd/yy to yyyy-mm-dd format
    const formatDateToYYYYMMDD = (dateStr) => {
      const [month, day, year] = dateStr.split('/');
      return `${2000 + parseInt(year)}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };
  
    try {
      const flightCollectionRef = collection(db, 'flights');
      let flightQuery = query(flightCollectionRef);
  
      // Convert session data to uppercase for query comparison
      if (from) {
        flightQuery = query(flightQuery, where('sourceAirport', '>=', from.toUpperCase()), where('sourceAirport', '<=', from.toUpperCase() + '\uf8ff'));
      }
      if (to) {
        flightQuery = query(flightQuery, where('destinationAirport', '>=', to.toUpperCase()), where('destinationAirport', '<=', to.toUpperCase() + '\uf8ff'));
      }
  
      if (departure) {
        // Convert session date (mm/dd/yy) to yyyy-mm-dd
        const formattedDepartureDate = formatDateToYYYYMMDD(departure);
        
        // Compare the formatted departure date with Firebase departureTime (yyyy-mm-dd)
        flightQuery = query(flightQuery, where('departureTime', '>=', new Date(formattedDepartureDate).getTime()));
      }
  
      if (arrival) {
        // Convert session date (mm/dd/yy) to yyyy-mm-dd
        const formattedArrivalDate = formatDateToYYYYMMDD(arrival);
        
        // Compare the formatted arrival date with Firebase arrivalTime (yyyy-mm-dd)
        flightQuery = query(flightQuery, where('arrivalTime', '>=', new Date(formattedArrivalDate).getTime()));
      }
  
      if (travelClass) {
        flightQuery = query(flightQuery, where('travelClass', '==', travelClass.toUpperCase())); // Ensure travelClass is uppercase
      }
  
      const flightSnapshot = await getDocs(flightQuery);
      const flightList = flightSnapshot.docs.map((doc) => ({
        ...doc.data(),
        flightId: doc.id, // Include the flight ID from Firestore
      }));
  
      setFlights(flightList);
    } catch (error) {
      console.error('Error fetching flights:', error);
    }
  };
  
  

  // Fetch initial flights and apply filters
  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const flightCollectionRef = collection(db, 'flights');
        const flightSnapshot = await getDocs(flightCollectionRef);
        
        // Map through the flight data and ensure these fields are in uppercase
        const flightList = flightSnapshot.docs.map(doc => ({
          ...doc.data(),
          flightId: doc.id,
          sourceCity: doc.data().sourceCity?.toUpperCase(),
          destinationCity: doc.data().destinationCity?.toUpperCase(),
          travelClass: doc.data().travelClass?.toUpperCase(),
        }));
    
        // Now filter the flights based on the sessionStorage criteria
        const { travelClass, from, to, departure } = getSearchCriteriaFromSession();
        let filteredFlights = flightList;
    
        if (from) {
          filteredFlights = filteredFlights.filter(flight =>
            flight.sourceCity.includes(from)
          );
        }
        if (to) {
          filteredFlights = filteredFlights.filter(flight =>
            flight.destinationCity.includes(to)
          );
        }
        if (departure) {
          filteredFlights = filteredFlights.filter(flight =>
            new Date(flight.departureTime).toLocaleDateString() === new Date(departure).toLocaleDateString()
          );
        }
        if (travelClass) {
          filteredFlights = filteredFlights.filter(flight =>
            flight.travelClass === travelClass
          );
        }
    
        setFlights(filteredFlights);
      } catch (error) {
        console.error('Error fetching flights:', error);
      }
    };
    
    

    fetchFlights();
  }, []); // Empty dependency array ensures this runs once when the component mounts

  useEffect(() => {
    // Listen for sessionStorage changes and trigger search if any change occurs
    const interval = setInterval(() => {
      handleSearch();
    }, 1000); // Check every 1 second for changes

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []); // Only run once on mount

  const handleLogout = () => {
    auth.signOut().then(() => {
      setIsLoggedIn(false);
    }).catch((error) => console.error('Error logging out:', error));
  };

  const toggleProfilePopup = () => setShowProfilePopup((prev) => !prev);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditProfileData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    if (user) {
      try {
        const userDocRef = doc(db, 'registeredUsers', user.uid);
        await updateDoc(userDocRef, editProfileData);
        setIsEditing(false);
        setUserProfile(editProfileData);
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    }
  };

  const handleCancelChanges = () => {
    setEditProfileData(userProfile);
    setIsEditing(false);
  };

  const handleFlightDetails = (flight) => {
    setSelectedFlight(flight);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowProfilePopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);  

  return (
    <div className="page-container">
      <Navbar 
        isLoggedIn={isLoggedIn} 
        handleLogout={handleLogout} 
        toggleProfilePopup={toggleProfilePopup} 
      />

      <div className="main-con">
        <SearchSection showSearch={false} newsearch={true} showModeSelection={false} />

        {/* Flight List Section */}
        <div className="flight-list-section">
          <h2>Available Flights</h2>
          <div className="flight-list">
            {flights.length > 0 ? (
              flights.map((flight) => (
                <div key={flight.flightId} className="flight-item">
                  <div className="flight-header">
                    <h3 className="airline-name">{flight.airlineName}</h3>
                    <p className="flight-number">Flight No: {flight.flightNumber}</p>
                  </div>
                  <div className="flight-info">
                    <div className="company-logo">
                      <img src="https://akm-img-a-in.tosshub.com/businesstoday/images/story/202302/ezgif-sixteen_nine_336.jpg?size=1280:720" alt="" />
                    </div>
                    <div className="details">
                      <div className="flight-detail">
                        <span className="value">{new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <hr className="hr" />
                        <span className="value">{flight.sourceAirport}, {flight.sourceCity}</span>
                      </div>
                      <div className="flight-detail">
                        <span className="value">{flight.flightDuration}</span>
                        <hr className="hr" />
                        <span className="value">{flight.flightType}</span>
                      </div>
                      <div className="flight-detail">
                        <span className="value">{new Date(flight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <hr className="hr" />
                        <span className="value">{flight.destinationAirport}, {flight.destinationCity}</span>
                      </div>
                    </div>
                    <div className="last">
                      <div className="flight-detail">
                        <span className="value">₹{flight.price}</span>
                      </div>
                      <button className="see-details-btn" onClick={() => handleFlightDetails(flight)}>See Details</button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No flights available at the moment.</p>
            )}
          </div>
        </div>

        {/* Full-Screen Flight Details Popup */}
        {selectedFlight && (
          <>
            <div className="popup-overlay" onClick={() => setSelectedFlight(null)}></div>
            <div className="flight-details-popup">
              <div className="popup-header">
                <h2>Flight Details</h2>
                <button className="close-popup" onClick={() => setSelectedFlight(null)}>×</button>
              </div>
              <div className="popup-content">
                {/* Flight Info */}
                <div className="flight-info">
                  <div className="flight-code">{selectedFlight.flightNumber}</div>
                  <div className="flight-status">{selectedFlight.currentStatus || 'Scheduled'}</div>
                  <p><strong>Airline:</strong> {selectedFlight.airlineName}</p>
                  <p><strong>Flight Type:</strong> {selectedFlight.flightType}</p>
                  <p><strong>Gate:</strong> {selectedFlight.gateNumber}</p>
                  <p><strong>Aircraft:</strong> {selectedFlight.aircraftType}</p>
                </div>
                {/* Flight Times and Details */}
                <div className="flight-times">
                  <div className="time-block">
                    <i className="fas fa-plane-departure"></i> {/* Icon for Departure */}
                    <p className="time">{new Date(selectedFlight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="location">{selectedFlight.sourceAirport}, {selectedFlight.sourceCity}</p>
                  </div>
                  <div className="flight-duration">
                    Duration: {selectedFlight.flightDuration} hr(s)
                  </div>
                  <div className="time-block">
                    <i className="fas fa-plane-arrival"></i> {/* Icon for Arrival */}
                    <p className="time">{new Date(selectedFlight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="location">{selectedFlight.destinationAirport}, {selectedFlight.destinationCity}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                  <button className="book-btn">Book Now</button>
                  <button className="cancel-btn" onClick={() => setSelectedFlight(null)}>Cancel</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FlightPage;
