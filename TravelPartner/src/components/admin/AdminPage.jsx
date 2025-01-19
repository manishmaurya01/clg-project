import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../../firebase/firebaseConfig';
import { doc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const AdminPage = () => {
  const [userType, setUserType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const auth = getAuth();
  const navigate = useNavigate();

  const dummyFlights = [
    {
      flightNumber: 'AI-202',
      airline: 'Air India',
      departureAirport: 'Indira Gandhi International Airport',
      departureCode: 'DEL',
      arrivalAirport: 'Chhatrapati Shivaji Maharaj International Airport',
      arrivalCode: 'BOM',
      departureDateTime: '2025-01-15T08:00:00',
      arrivalDateTime: '2025-01-15T10:30:00',
      isDirect: true,
      stopoverDetails: null,
      duration: '2h 30m',
      ticketPrice: 5500,
      classType: 'Economy',
      refundable: true,
      baggageAllowance: '15kg check-in, 7kg cabin',
      additionalCharges: 'Meal charges apply',
      availableSeats: 'Window, Aisle',
      inFlightAmenities: 'Wi-Fi, Meals',
      mealPreferences: 'Veg/Non-Veg',
      covidGuidelines: 'Vaccination certificate required',
      checkInTime: '2 hours before departure',
      boardingGateInfo: 'Gate 5, Terminal 3',
      paymentOptions: 'UPI, Card, Netbanking',
      cancellationPolicy: '10% deduction on cancellation',
      offers: '10% off with code FLYHIGH',
      flightStatusUpdates: true,
      reminders: true
    },
    {
      flightNumber: '6E-505',
      airline: 'IndiGo',
      departureAirport: 'Kempegowda International Airport',
      departureCode: 'BLR',
      arrivalAirport: 'Chennai International Airport',
      arrivalCode: 'MAA',
      departureDateTime: '2025-01-16T14:00:00',
      arrivalDateTime: '2025-01-16T15:30:00',
      isDirect: true,
      stopoverDetails: null,
      duration: '1h 30m',
      ticketPrice: 3200,
      classType: 'Economy',
      refundable: false,
      baggageAllowance: '15kg check-in, 7kg cabin',
      additionalCharges: 'Extra baggage fees',
      availableSeats: 'Aisle',
      inFlightAmenities: 'Snacks available for purchase',
      mealPreferences: 'Veg',
      covidGuidelines: 'Mask mandatory',
      checkInTime: '1.5 hours before departure',
      boardingGateInfo: 'Gate 2, Terminal 1',
      paymentOptions: 'Wallet, Card',
      cancellationPolicy: 'Non-refundable',
      offers: 'Flat ₹200 cashback on Paytm',
      flightStatusUpdates: true,
      reminders: true
    },
    {
      flightNumber: 'AI-303',
      airline: 'Air India',
      departureAirport: 'Netaji Subhas Chandra Bose International Airport',
      departureCode: 'CCU',
      arrivalAirport: 'Chhatrapati Shivaji Maharaj International Airport',
      arrivalCode: 'BOM',
      departureDateTime: '2025-02-01T12:00:00',
      arrivalDateTime: '2025-02-01T14:30:00',
      isDirect: true,
      stopoverDetails: null,
      duration: '2h 30m',
      ticketPrice: 4800,
      classType: 'Business',
      refundable: true,
      baggageAllowance: '30kg check-in, 7kg cabin',
      additionalCharges: 'Priority boarding available',
      availableSeats: 'Window',
      inFlightAmenities: 'Wi-Fi, Meals, Entertainment',
      mealPreferences: 'Non-Veg',
      covidGuidelines: 'Vaccination certificate required',
      checkInTime: '2 hours before departure',
      boardingGateInfo: 'Gate 4, Terminal 2',
      paymentOptions: 'UPI, Card, Netbanking',
      cancellationPolicy: 'Refundable',
      offers: '15% off with code AIRINDIA',
      flightStatusUpdates: true,
      reminders: true
    },
    {
      flightNumber: 'UK-209',
      airline: 'Vistara',
      departureAirport: 'Chennai International Airport',
      departureCode: 'MAA',
      arrivalAirport: 'Indira Gandhi International Airport',
      arrivalCode: 'DEL',
      departureDateTime: '2025-02-05T16:30:00',
      arrivalDateTime: '2025-02-05T19:00:00',
      isDirect: false,
      stopoverDetails: '1 stop in Bengaluru (BLR)',
      duration: '4h 30m',
      ticketPrice: 5500,
      classType: 'Economy',
      refundable: true,
      baggageAllowance: '20kg check-in, 7kg cabin',
      additionalCharges: 'Extra baggage fees',
      availableSeats: 'Window, Aisle',
      inFlightAmenities: 'Wi-Fi, Snacks, Entertainment',
      mealPreferences: 'Veg/Non-Veg',
      covidGuidelines: 'Mask mandatory',
      checkInTime: '2 hours before departure',
      boardingGateInfo: 'Gate 3, Terminal 1',
      paymentOptions: 'Wallet, Card, Netbanking',
      cancellationPolicy: 'Refundable with 15% deduction',
      offers: '5% off with code VISTARA',
      flightStatusUpdates: true,
      reminders: true
    },
    {
      flightNumber: '9W-408',
      airline: 'Jet Airways',
      departureAirport: 'Chhatrapati Shivaji Maharaj International Airport',
      departureCode: 'BOM',
      arrivalAirport: 'Rajiv Gandhi International Airport',
      arrivalCode: 'HYD',
      departureDateTime: '2025-02-10T09:00:00',
      arrivalDateTime: '2025-02-10T10:30:00',
      isDirect: true,
      stopoverDetails: null,
      duration: '1h 30m',
      ticketPrice: 3500,
      classType: 'Economy',
      refundable: true,
      baggageAllowance: '15kg check-in, 7kg cabin',
      additionalCharges: 'Meal charges apply',
      availableSeats: 'Window, Aisle',
      inFlightAmenities: 'Snacks, Entertainment',
      mealPreferences: 'Veg/Non-Veg',
      covidGuidelines: 'Vaccination certificate required',
      checkInTime: '1 hour before departure',
      boardingGateInfo: 'Gate 6, Terminal 1',
      paymentOptions: 'UPI, Card',
      cancellationPolicy: '10% deduction on cancellation',
      offers: 'Free meal for first 50 passengers',
      flightStatusUpdates: true,
      reminders: true
    },
    {
      flightNumber: 'AI-404',
      airline: 'Air India',
      departureAirport: 'Kempegowda International Airport',
      departureCode: 'BLR',
      arrivalAirport: 'Netaji Subhas Chandra Bose International Airport',
      arrivalCode: 'CCU',
      departureDateTime: '2025-02-12T06:00:00',
      arrivalDateTime: '2025-02-12T08:30:00',
      isDirect: false,
      stopoverDetails: '1 stop in Chennai (MAA)',
      duration: '4h 30m',
      ticketPrice: 4700,
      classType: 'Business',
      refundable: true,
      baggageAllowance: '30kg check-in, 7kg cabin',
      additionalCharges: 'Priority boarding, extra baggage fees',
      availableSeats: 'Window',
      inFlightAmenities: 'Wi-Fi, Meals, Entertainment',
      mealPreferences: 'Veg/Non-Veg',
      covidGuidelines: 'Vaccination certificate required',
      checkInTime: '2 hours before departure',
      boardingGateInfo: 'Gate 1, Terminal 2',
      paymentOptions: 'UPI, Card, Netbanking',
      cancellationPolicy: 'Refundable with 10% deduction',
      offers: '5% off with code AIRINDIA',
      flightStatusUpdates: true,
      reminders: true
    },
    {
      flightNumber: 'SG-151',
      airline: 'SpiceJet',
      departureAirport: 'Chennai International Airport',
      departureCode: 'MAA',
      arrivalAirport: 'Rajiv Gandhi International Airport',
      arrivalCode: 'HYD',
      departureDateTime: '2025-03-01T07:00:00',
      arrivalDateTime: '2025-03-01T08:30:00',
      isDirect: true,
      stopoverDetails: null,
      duration: '1h 30m',
      ticketPrice: 3200,
      classType: 'Economy',
      refundable: false,
      baggageAllowance: '15kg check-in, 7kg cabin',
      additionalCharges: 'Meal charges apply',
      availableSeats: 'Aisle',
      inFlightAmenities: 'Snacks available for purchase',
      mealPreferences: 'Veg',
      covidGuidelines: 'Mask mandatory',
      checkInTime: '1 hour before departure',
      boardingGateInfo: 'Gate 3, Terminal 1',
      paymentOptions: 'Wallet, Card',
      cancellationPolicy: 'Non-refundable',
      offers: 'Flat ₹150 cashback on Paytm',
      flightStatusUpdates: true,
      reminders: true
    },
    {
      flightNumber: 'AI-507',
      airline: 'Air India',
      departureAirport: 'Netaji Subhas Chandra Bose International Airport',
      departureCode: 'CCU',
      arrivalAirport: 'Rajiv Gandhi International Airport',
      arrivalCode: 'HYD',
      departureDateTime: '2025-03-10T12:00:00',
      arrivalDateTime: '2025-03-10T13:30:00',
      isDirect: true,
      stopoverDetails: null,
      duration: '1h 30m',
      ticketPrice: 3900,
      classType: 'Economy',
      refundable: true,
      baggageAllowance: '15kg check-in, 7kg cabin',
      additionalCharges: 'Extra baggage fees',
      availableSeats: 'Window',
      inFlightAmenities: 'Snacks, Wi-Fi',
      mealPreferences: 'Veg/Non-Veg',
      covidGuidelines: 'Vaccination certificate required',
      checkInTime: '1.5 hours before departure',
      boardingGateInfo: 'Gate 4, Terminal 2',
      paymentOptions: 'UPI, Card, Netbanking',
      cancellationPolicy: 'Refundable with 15% deduction',
      offers: '10% off with code AIRINDIA',
      flightStatusUpdates: true,
      reminders: true
    },
    {
      flightNumber: 'SG-254',
      airline: 'SpiceJet',
      departureAirport: 'Kempegowda International Airport',
      departureCode: 'BLR',
      arrivalAirport: 'Chennai International Airport',
      arrivalCode: 'MAA',
      departureDateTime: '2025-03-15T11:30:00',
      arrivalDateTime: '2025-03-15T13:00:00',
      isDirect: true,
      stopoverDetails: null,
      duration: '1h 30m',
      ticketPrice: 2900,
      classType: 'Economy',
      refundable: false,
      baggageAllowance: '15kg check-in, 7kg cabin',
      additionalCharges: 'Meal charges apply',
      availableSeats: 'Aisle',
      inFlightAmenities: 'Snacks available for purchase',
      mealPreferences: 'Non-Veg',
      covidGuidelines: 'Mask mandatory',
      checkInTime: '1 hour before departure',
      boardingGateInfo: 'Gate 2, Terminal 1',
      paymentOptions: 'Card, Netbanking',
      cancellationPolicy: 'Non-refundable',
      offers: 'Flat ₹100 cashback on Paytm',
      flightStatusUpdates: true,
      reminders: true
    }
  ];
  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'registeredUsers', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.accountType === 'business') {
            setUserType('business');
          } else {
            navigate('/not-authorized');
          }
        }
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  const uploadFlights = async () => {
    setUploading(true);
    try {
      const flightsCollection = collection(db, 'flights');
      for (const flight of dummyFlights) {
        const q = query(flightsCollection, where('flightNumber', '==', flight.flightNumber));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          await addDoc(flightsCollection, flight);
        }
      }
      alert('Flights uploaded successfully!');
    } catch (error) {
      console.error('Error uploading flights:', error);
      alert('Error uploading flights.');
    } finally {
      setUploading(false);
    }
  };

  if (userType !== 'business') {
    return <p>You do not have access to this page.</p>;
  }

  return (
    <div>
      <h1>Welcome to the Admin Page</h1>
      <button onClick={uploadFlights} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload Flight Data'}
      </button>
    </div>
  );
};

export default AdminPage;
