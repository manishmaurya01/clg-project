import React, { useState } from 'react';
import { db } from '../../firebase/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import './AdminPage.css';

const AddFlightPage = () => {
  const [flightData, setFlightData] = useState({
    flightId: '',
    flightNumber: '',
    airlineName: '',
    flightType: 'Direct',
    sourceAirport: '',
    destinationAirport: '',
    sourceCity: '',
    destinationCity: '',
    departureTime: '',
    arrivalTime: '',
    flightDuration: '',
    price: '',
    currency: 'USD',
    baggageFees: '',
    seatAvailability: '',
    totalSeats: '',
    aircraftType: '',
    inFlightEntertainment: false,
    mealOptions: '',
    wifiAvailability: false,
    luggageAllowance: '',
    currentStatus: 'On Time',
    gateNumber: '',
    contactInfo: '',
    bookingPolicies: '',
    baggagePolicies: '',
    healthAndSafety: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFlightData({
      ...flightData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Add flight data to Firebase
      await addDoc(collection(db, 'flights'), flightData);
      alert('Flight added successfully!');
      setFlightData({
        flightId: '',
        flightNumber: '',
        airlineName: '',
        flightType: 'Direct',
        sourceAirport: '',
        destinationAirport: '',
        sourceCity: '',
        destinationCity: '',
        departureTime: '',
        arrivalTime: '',
        flightDuration: '',
        price: '',
        currency: 'USD',
        baggageFees: '',
        seatAvailability: '',
        totalSeats: '',
        aircraftType: '',
        inFlightEntertainment: false,
        mealOptions: '',
        wifiAvailability: false,
        luggageAllowance: '',
        currentStatus: 'On Time',
        gateNumber: '',
        contactInfo: '',
        bookingPolicies: '',
        baggagePolicies: '',
        healthAndSafety: '',
      });
    } catch (error) {
      console.error('Error adding flight:', error);
    }
  };

  return (
    <div className="add-flight-container">
      <h1>Add New Flight</h1>
      <form onSubmit={handleSubmit} className="add-flight-form">
        <div className="form-group">
          <label>Flight ID</label>
          <input
            type="text"
            name="flightId"
            value={flightData.flightId}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Flight Number</label>
          <input
            type="text"
            name="flightNumber"
            value={flightData.flightNumber}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Airline Name</label>
          <input
            type="text"
            name="airlineName"
            value={flightData.airlineName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Flight Type</label>
          <select
            name="flightType"
            value={flightData.flightType}
            onChange={handleChange}
          >
            <option value="Direct">Direct</option>
            <option value="Layover">Layover</option>
          </select>
        </div>

        <div className="form-group">
          <label>Departure Airport</label>
          <input
            type="text"
            name="sourceAirport"
            value={flightData.sourceAirport}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Arrival Airport</label>
          <input
            type="text"
            name="destinationAirport"
            value={flightData.destinationAirport}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Source City</label>
          <input
            type="text"
            name="sourceCity"
            value={flightData.sourceCity}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Destination City</label>
          <input
            type="text"
            name="destinationCity"
            value={flightData.destinationCity}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Departure Time</label>
          <input
            type="datetime-local"
            name="departureTime"
            value={flightData.departureTime}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Arrival Time</label>
          <input
            type="datetime-local"
            name="arrivalTime"
            value={flightData.arrivalTime}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Flight Duration (in hours)</label>
          <input
            type="number"
            name="flightDuration"
            value={flightData.flightDuration}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Price</label>
          <input
            type="number"
            name="price"
            value={flightData.price}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Currency</label>
          <select
            name="currency"
            value={flightData.currency}
            onChange={handleChange}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="INR">INR</option>
          </select>
        </div>

        <div className="form-group">
          <label>Baggage Fees</label>
          <input
            type="text"
            name="baggageFees"
            value={flightData.baggageFees}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Seat Availability</label>
          <input
            type="number"
            name="seatAvailability"
            value={flightData.seatAvailability}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Total Seats</label>
          <input
            type="number"
            name="totalSeats"
            value={flightData.totalSeats}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Aircraft Type</label>
          <input
            type="text"
            name="aircraftType"
            value={flightData.aircraftType}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>In-flight Entertainment</label>
          <input
            type="checkbox"
            name="inFlightEntertainment"
            checked={flightData.inFlightEntertainment}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Meal Options</label>
          <input
            type="text"
            name="mealOptions"
            value={flightData.mealOptions}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Wi-Fi Availability</label>
          <input
            type="checkbox"
            name="wifiAvailability"
            checked={flightData.wifiAvailability}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Luggage Allowance</label>
          <input
            type="text"
            name="luggageAllowance"
            value={flightData.luggageAllowance}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Current Flight Status</label>
          <select
            name="currentStatus"
            value={flightData.currentStatus}
            onChange={handleChange}
          >
            <option value="On Time">On Time</option>
            <option value="Delayed">Delayed</option>
            <option value="Canceled">Canceled</option>
          </select>
        </div>

        <div className="form-group">
          <label>Gate Number</label>
          <input
            type="text"
            name="gateNumber"
            value={flightData.gateNumber}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Contact Information</label>
          <textarea
            name="contactInfo"
            value={flightData.contactInfo}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Booking Policies</label>
          <textarea
            name="bookingPolicies"
            value={flightData.bookingPolicies}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Baggage Policies</label>
          <textarea
            name="baggagePolicies"
            value={flightData.baggagePolicies}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Health & Safety Information</label>
          <textarea
            name="healthAndSafety"
            value={flightData.healthAndSafety}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn-submit">
          Add Flight
        </button>
      </form>
    </div>
  );
};

export default AddFlightPage;
