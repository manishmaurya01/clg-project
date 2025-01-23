import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Import useNavigate
import { db } from '../../../firebase/firebaseConfig';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../AuthContext'; // Import the AuthContext to get user details
import './FlightBooking.css';

function FlightBooking() {
  const { flightId } = useParams();
  const { user } = useAuth(); // Get logged-in user from AuthContext
  const navigate = useNavigate(); // Initialize useNavigate
  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingState, setLoadingState] = useState({ fetching: false, payment: false }); // Loader state
  const [formData, setFormData] = useState({
    classType: 'Economy',
    mealPreference: '',
    getOffers: false,
  });
  const [selectedClassPrice, setSelectedClassPrice] = useState(0);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
    registrationDate: '',
  });
  const [bookingTime, setBookingTime] = useState(null); // To store and display booking time

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

  // Fetch user data from Firestore if logged in
  useEffect(() => {
    if (user) {
      setUserData((prevData) => ({
        ...prevData,
        email: user.email,  // Get email from Firebase Authentication
      }));

      // Fetch user name and other details from the registeredUsers collection
      const fetchUserDetails = async () => {
        try {
          const userDoc = doc(db, 'registeredUsers', user.uid); // Fetch details from the registeredUsers collection
          const userDetails = await getDoc(userDoc);
          if (userDetails.exists()) {
            setUserData((prevData) => ({
              ...prevData,
              name: userDetails.data().name || '',
              address: userDetails.data().address || '',
              phone: userDetails.data().phone || '',
              registrationDate: userDetails.data().registrationDate || '',
            }));
          }
        } catch (error) {
          console.error('Error fetching user details:', error);
        }
      };

      fetchUserDetails();
    }
  }, [user]);

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

  const handleProceed = async () => {
    if (selectedSeats.length === 0) {
      alert('Please select your seats.');
      return;
    }
  
    setLoadingState((prev) => ({ ...prev, payment: true })); // Start loader

    // Check if any selected seat is already reserved
    const reservedSeats = selectedSeats.filter((seat) =>
      flight.classTypes
        .find((type) => type.classType === formData.classType)
        .seats.some((s) => s.seatNumber === seat && s.status === 'reserved')
    );
  
    if (reservedSeats.length > 0) {
      alert('One or more selected seats are already reserved.');
      return;
    }
    setLoadingState((prev) => ({ ...prev, payment: false })); // Stop loader on failure

    // Razorpay payment options
    const options = {
      key: 'rzp_test_MddIsnrYTZiXDn', // Replace with your Razorpay API key
      amount: selectedClassPrice * selectedSeats.length * 100, // Convert to paise (₹1 = 100 paise)
      currency: 'INR',
      name: 'Flight Booking',
      description: `Booking seats: ${selectedSeats.join(', ')}`,
      
      handler: async function (response) {

        // Payment successful, proceed with booking
        try {
          setLoadingState((prev) => ({ ...prev, payment: true })); // Start loader
          const updatedSeats = flight.classTypes.map((classType) => {
            if (classType.classType === formData.classType) {
              classType.seats = classType.seats.map((seat) => {
                if (selectedSeats.includes(seat.seatNumber)) {
                  return { ...seat, status: 'reserved', bookedBy: userData.name, email: userData.email };
                }
                return seat;
              });
            }
            return classType;
          });
  
          // Update flight data with the new seat reservations
          const flightRef = doc(db, 'flights', flightId);
          await updateDoc(flightRef, {
            classTypes: updatedSeats,
          });

          // Create a new booking document in the 'flightBookings' collection
          const flightBookingData = {
            flightDetails: {
              flightNumber: flight.flightNumber,
              airline: flight.airline,
              from: flight.from,
              to: flight.to,
              departureCode: flight.departureCode,
              arrivalCode: flight.arrivalCode,
              arrivalDateTime: flight.arrivalDateTime,
              departureDateTime: flight.departureDateTime,
              duration: flight.duration,
              classType: formData.classType,
              selectedSeats: selectedSeats,
              mealPreference: formData.mealPreference,
              price: selectedClassPrice,
              baggageAllowance: flight.classTypes.find((type) => type.classType === formData.classType).baggageAllowance,
            },
            userDetails: {
              accountType: 'user',
              name: userData.name,
              email: userData.email,
              address: userData.address,
              phone: userData.phone,
              registrationDate: userData.registrationDate,
            },
            bookingTime: serverTimestamp(), // Add the current server timestamp for booking time
          };
  
          setLoadingState((prev) => ({ ...prev, payment: false })); // Stop loader on failure
          // Add the booking to the Firestore 'flightBookings' collection
          await addDoc(collection(db, 'flightBookings'), flightBookingData);

          alert('Payment Successful! Booking Confirmed! Your seats: ' + selectedSeats.join(', '));
  
          // Navigate to /profile page after booking confirmation
          navigate('/profile');
        } catch (error) {
          console.error('Error updating booking:', error);
        } finally {
          setLoadingState((prev) => ({ ...prev, payment: false })); // Stop loader
        }
      },
      prefill: {
        name: userData.name,
        email: userData.email,
        contact: userData.phone,
      },
      theme: {
        color: '#F37254',
      },
    };
  
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      setLoadingState((prev) => ({ ...prev, payment: false })); // Stop loader on failure
      alert('Payment Failed. Please try again.');
      console.error(response.error);
    });
  
    rzp.open();
    
  };

  if (loading) {
    return <p className="loading-message">Loading booking details...</p>;
  }

  if (!flight) {
    return <p className="error-message">Flight not found.</p>;
  }

  return (
    <div className="flight-booking-container">
       {loadingState.fetching || loadingState.payment ? (
         <div className="loader-overlay">
         <div className="loader">
           <div className="spinner"></div>
           <p>Processing... Please wait.</p>
         </div>
       </div>
      ) : null}

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
            <p><strong>Is Direct:</strong> {flight.isDirect ? 'Non Stop' : 'Stopover'}</p>
          </div>
          <div className="price-section">
            <h3>₹{selectedClassPrice}</h3>  
            <p className="additional-charges">{flight.classTypes.find(type => type.classType === formData.classType).baggageAllowance}</p>
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
              {flight.classTypes.map((classOption, index) => (
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

        {/* Display the booking time after confirmation */}
        {bookingTime && (
          <div className="booking-time-section">
            <p>Booking Time: {bookingTime}</p>
          </div>
        )}
      </form>
    </div>
  );
}

export default FlightBooking;
