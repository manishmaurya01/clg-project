import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../../firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import './FlightBooking.css';

function FlightBooking() {
  const { flightId } = useParams();
  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    classType: 'Economy', // Default class type
    mealPreference: '',
    getOffers: false,
  });
  const [selectedClassPrice, setSelectedClassPrice] = useState(0);
  const [selectedSeats, setSelectedSeats] = useState([]);

  useEffect(() => {
    const fetchFlight = async () => {
      try {
        const flightDoc = doc(db, 'flights', flightId);
        const flightData = await getDoc(flightDoc);
        if (flightData.exists()) {
          setFlight({ id: flightId, ...flightData.data() });
        } else {
          console.error('Flight not found');
        }
      } catch (error) {
        console.error('Error fetching flight details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlight();
  }, [flightId]);

  useEffect(() => {
    if (flight) {
      const selectedClassInfo = flight.classTypes.find(
        (type) => type.classType === 'Economy'
      );
      setSelectedClassPrice(selectedClassInfo ? selectedClassInfo.ticketPrice : 0);
    }
  }, [flight]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleClassTypeChange = (e) => {
    const selectedClass = e.target.value;
    setFormData({ ...formData, classType: selectedClass });

    const selectedClassInfo = flight.classTypes.find(
      (type) => type.classType === selectedClass
    );
    setSelectedClassPrice(selectedClassInfo ? selectedClassInfo.ticketPrice : 0);
  };

  const handleSeatSelection = (seat) => {
    setSelectedSeats((prevSelectedSeats) => {
      if (prevSelectedSeats.includes(seat)) {
        return prevSelectedSeats.filter((selectedSeat) => selectedSeat !== seat);
      } else {
        return [...prevSelectedSeats, seat];
      }
    });
  };

  const handleProceed = () => {
    if (selectedSeats.length === 0) {
      alert('Please select your seats.');
    } else {
      alert('Booking Confirmed! Your seats: ' + selectedSeats.join(', '));
    }
  };

  if (loading) {
    return <p className="loading-message">Loading booking details...</p>;
  }

  if (!flight) {
    return <p className="error-message">Flight not found.</p>;
  }

  return (
    <div className="flight-booking-container">
      <div className="booking-header">
        <h1 className="main-title">Book Your Flight</h1>
        <p className="flight-number">Flight Number: <span>{flight.flightNumber}</span></p>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="booking-form">
        <div className="flight-summary">
          <div className="flight-details">
            <h2 className="flight-airline">{flight.airline}</h2>
            <p><strong>From:</strong> {flight.from} ({flight.departureCode})</p>
            <p><strong>Airport:</strong> {flight.departureAirport}</p>
            <p><strong>To:</strong> {flight.to} ({flight.arrivalCode})</p>
            <p><strong>Airport:</strong> {flight.arrivalAirport}</p>
            <p><strong>Duration:</strong> {flight.duration}</p>
          </div>
          <div className="price-section">
            <h3>₹{selectedClassPrice}</h3>
            <p className="additional-charges">{flight.additionalCharges}</p>
            <button
              type="button"
              className="book-now-btn"
              onClick={handleProceed}
            >
              Proceed to Book
            </button>
          </div>
        </div>

        {/* Seat Map (Displayed by default) */}
        <div className="seat-selection-section">
          <h3>Select Your Seats</h3>
          <div className="seat-map">
            {flight.classTypes.find((type) => type.classType === formData.classType)
              .seats.map((seat) => (
                <div
                  key={seat.seatNumber}
                  className={`seat ${seat.status === 'reserved' ? 'reserved' : ''} ${
                    selectedSeats.includes(seat.seatNumber) ? 'selected' : ''
                  }`}
                  onClick={() =>
                    seat.status !== 'reserved' && handleSeatSelection(seat.seatNumber)
                  }
                >
                  {seat.seatNumber}
                </div>
              ))}
          </div>
        </div>

        <div className="options-section">
          <h3>Select Your Preferences</h3>

          {/* Class Type Dropdown */}
          <div className="option">
            
            <select
              name="classType"
              value={formData.classType}
              onChange={handleClassTypeChange}
            >
              <option value="Economy">Economy</option>
              {flight.classTypes &&
                flight.classTypes.map((classOption, index) => (
                  <option key={index} value={classOption.classType}>
                    {classOption.classType}
                  </option>
                ))}
            </select>
          </div>

          {/* Meal Preference Dropdown */}
          <div className="option">
           
            <select
              name="mealPreference"
              value={formData.mealPreference}
              onChange={handleChange}
            >
              <option value="Veg">Vegetarian</option>
              <option value="Non-Veg">Non-Vegetarian</option>
            </select>
          </div>

        </div>
      </form>
    </div>
  );
}

export default FlightBooking;
