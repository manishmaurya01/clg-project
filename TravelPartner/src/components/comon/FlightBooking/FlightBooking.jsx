import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase/firebaseConfig';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../AuthContext';
import './FlightBooking.css';

function FlightBooking() {
  const { flightId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loadingState, setLoadingState] = useState({ fetching: false, payment: false });
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
  const [bookingTime, setBookingTime] = useState(null);
  const [step, setStep] = useState(1); // Step management (1 = details, 2 = seat selection, 3 = payment)

// Function to handle the next step
const handleNextStep = () => {
  if (step < 3) {
    setStep(step + 1);
  }
};

// Function to handle the previous step
const handlePreviousStep = () => {
  if (step > 1) {
    setStep(step - 1);
  }
};

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
    if (user) {
      setUserData((prevData) => ({
        ...prevData,
        email: user.email,
      }));

      const fetchUserDetails = async () => {
        try {
          const userDoc = doc(db, 'registeredUsers', user.uid);
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
    return <div className="loader">Loading flight details...</div>;
  }
  return (
    <div className="flight-booking-container">
  {loading ? (
    <div className="loading-container">
      <p>Loading flight details...</p>
    </div>
  ) : (
    <div>
      {step === 1 && (
        <div className="step-container">
          <h2 className="step-title">Flight Details</h2>
          <div className="flight-details">
            <p><strong>Flight Number:</strong> {flight.flightNumber}</p>
            <p><strong>Airline:</strong> {flight.airline}</p>
            <p><strong>From:</strong> {flight.from} ({flight.departureCode})</p>
            <p><strong>To:</strong> {flight.to} ({flight.arrivalCode})</p>
            <p><strong>Departure:</strong> {flight.departureDateTime}</p>
            <p><strong>Arrival:</strong> {flight.arrivalDateTime}</p>
            <p><strong>Duration:</strong> {flight.duration}</p>
          </div>
          <h3 className="preferences-title">Select Your Preferences</h3>
          <form className="preferences-form">
            <label>
              Class Type:
              <select
                name="classType"
                value={formData.classType}
                onChange={handleClassTypeChange}
                className="dropdown"
              >
                {flight.classTypes.map((classType) => (
                  <option key={classType.classType} value={classType.classType}>
                    {classType.classType}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Meal Preference:
              <input
                type="text"
                name="mealPreference"
                value={formData.mealPreference}
                onChange={handleChange}
                placeholder="e.g., Vegetarian"
                className="input-field"
              />
            </label>
            <label className="checkbox-label">
              Get Offers:
              <input
                type="checkbox"
                name="getOffers"
                checked={formData.getOffers}
                onChange={handleChange}
              />
            </label>
          </form>
          <button className="next-btn" onClick={handleNextStep}>
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="step-container">
          <h2 className="step-title">Select Your Seats</h2>
          <div className="seat-selection">
            {flight.classTypes
              .find((type) => type.classType === formData.classType)
              .seats.map((seat) => (
                <button
                  key={seat.seatNumber}
                  className={`seat-btn ${
                    seat.status === 'reserved' ? 'reserved' : ''
                  } ${selectedSeats.includes(seat.seatNumber) ? 'selected' : ''}`}
                  onClick={() => handleSeatSelection(seat.seatNumber)}
                  disabled={seat.status === 'reserved'}
                >
                  {seat.seatNumber}
                </button>
              ))}
          </div>
          <div className="seat-selection-summary">
            <p>Selected Seats: {selectedSeats.join(', ') || 'None'}</p>
            <p>Total Price: ₹{selectedSeats.length * selectedClassPrice}</p>
          </div>
          <div className="navigation-buttons">
            <button className="prev-btn" onClick={handlePreviousStep}>
              Previous
            </button>
            <button className="next-btn" onClick={handleNextStep}>
              Next
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="step-container">
          <h2 className="step-title">Payment</h2>
          <p>
            You're booking for the following seats:{' '}
            {selectedSeats.join(', ')} in {formData.classType} class.
          </p>
          <p>Total Amount: ₹{selectedSeats.length * selectedClassPrice}</p>
          <div className="payment-container">
            <button
              className="pay-btn"
              onClick={handleProceed}
              disabled={loadingState.payment}
            >
              {loadingState.payment ? 'Processing...' : 'Proceed to Pay'}
            </button>
          </div>
          <div className="navigation-buttons">
            <button className="prev-btn" onClick={handlePreviousStep}>
              Previous
            </button>
          </div>
        </div>
      )}
    </div>
  )}
</div>

  );
}

export default FlightBooking;
