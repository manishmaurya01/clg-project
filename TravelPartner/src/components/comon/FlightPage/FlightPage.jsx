import React, { useEffect, useState } from 'react';
import { db } from '../../../firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import './FlightPage.css';
import { FaPlaneDeparture, FaPlaneArrival, FaClock } from 'react-icons/fa';
import SearchSection from '../search/Search-Section';

function FlightPage() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
const [selectedMode, setSelectedMode] = useState('flight');
  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const flightsCollection = collection(db, 'flights');
        const flightDocs = await getDocs(flightsCollection);
        const flightData = flightDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setFlights(flightData);
      } catch (error) {
        console.error('Error fetching flight data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, []);
  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { date: formattedDate, time: formattedTime };
  };

  if (loading) {
    return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading flight details...</p>;
  }

  return (
    <div className="flight-page-container">
      <section className="search">
   {/* Search Container */}
          <SearchSection
            selectedMode={selectedMode}
            handleModeSelect={handleModeSelect}
          />
</section>
      <h1 className="flight-page-header">Book Your Flight</h1>
      {flights.length > 0 ? (
        flights.map((flight) => {
          const departure = formatDateTime(flight.departureDateTime);
          const arrival = formatDateTime(flight.arrivalDateTime);

          return (
            <div key={flight.id} className="flight-card">
              <div className="company_logo">
                <img src="https://img.freepik.com/premium-vector/airlines-logo-design-vector-template_1070930-13.jpg" alt="Airline Logo" />
              </div>
              <div className="starting">
                <strong>{flight.departureCode}</strong>
                <hr className='line'/>
                <span className="date">{departure.date},{departure.time}</span>
                </div>
              <div className="middle">
                <span>{flight.airline}</span>
                <span>{flight.duration}</span>
                <span>{flight.isDirect ? "Non Stop" : "Stopover"}</span>
              </div>
              <div className="ending">
                <strong>{flight.arrivalCode}</strong>
                <hr className='line'/>
                <span className="date">{arrival.date}, {arrival.time}</span>
              
              </div>
              <div className="price_actions">
                <strong>{flight.ticketPrice}</strong>
                <button className='book_now_btn'>Book Now</button>
              </div>
            </div>
          );
        })
      ) : (
        <p style={{ textAlign: 'center', marginTop: '50px' }}>No flights available.</p>
      )}
    </div>
  );
}

export default FlightPage;
