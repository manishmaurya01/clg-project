import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/firebaseConfig';
import { createUserWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { GoogleAuthProvider } from 'firebase/auth';

const Register = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isAdditionalInfoOpen, setIsAdditionalInfoOpen] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState({
    accountType: '',
    phone: '',
    address: '',
    services: [],
  });
  const [activeAccountType, setActiveAccountType] = useState('');
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  const handleInitialChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAdditionalChange = (e) => {
    setAdditionalInfo({ ...additionalInfo, [e.target.name]: e.target.value });
  };

  const handleAccountTypeChange = (e) => {
    const selectedAccountType = e.target.value;
    setActiveAccountType(selectedAccountType);
    setAdditionalInfo({ ...additionalInfo, accountType: selectedAccountType });
  };

  const handleServicesChange = (e) => {
    const value = e.target.value;
    setAdditionalInfo((prevData) => {
      const services = prevData.services.includes(value)
        ? prevData.services.filter((service) => service !== value)
        : [...prevData.services, value];
      return { ...prevData, services };
    });
  };

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      setUserId(user.uid);

      // Store basic user data in Firestore
      await setDoc(doc(db, 'registeredUsers', user.uid), {
        email: formData.email,
        registrationDate: new Date(),
      });

      // Open additional info popup
      setIsAdditionalInfoOpen(true);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleGoogleSignup = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      setUserId(user.uid);

      // Store basic user data in Firestore
      await setDoc(doc(db, 'registeredUsers', user.uid), {
        email: user.email,
        name: user.displayName || '',
        phone: user.phoneNumber || '',
        registrationDate: new Date(),
      });

      // Open additional info popup
      setIsAdditionalInfoOpen(true);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleAdditionalSubmit = async () => {
    if (!additionalInfo.accountType) {
      alert('Please select an account type.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User is not logged in");

      // Update user data in Firestore
      await updateDoc(doc(db, 'registeredUsers', user.uid), {
        ...additionalInfo,
        userId: user.uid,
      });

      alert('Registration Completed!');
      setIsAdditionalInfoOpen(false);
      navigate('/home');
    } catch (error) {
      alert(error.message);
    }
  };

  // Log out the user if the popup is closed or the page is refreshed
  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      if (isAdditionalInfoOpen) {
        e.preventDefault();
        e.returnValue = '';
        await signOut(auth);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isAdditionalInfoOpen]);

  return (
    <div className="main_con">
      <div className="auth-container">
        <h2>Register</h2>

        <form onSubmit={handleInitialSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInitialChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInitialChange}
            required
          />
          <button type="submit" className="normal_btn">Register</button>
        </form>

        <button onClick={handleGoogleSignup} className="spe_btn">Sign up with Google</button>

        <p>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>

      {isAdditionalInfoOpen && (
        <div className="additional-info-popup">
          <div className="popup-content">
            <h2>Complete Your Registration</h2>

            <div className="account-type">
              <label
                className={activeAccountType === 'user' ? 'active' : ''}
                onClick={() => handleAccountTypeChange({ target: { value: 'user' } })}
              >
                User
              </label>
              <label
                className={activeAccountType === 'business' ? 'active' : ''}
                onClick={() => handleAccountTypeChange({ target: { value: 'business' } })}
              >
                Business
              </label>
            </div>

            {additionalInfo.accountType === 'business' && (
              <div className="services-selection">
                <label htmlFor="services">Select Services:</label>
                <select id="services" name="services" value={additionalInfo.services} onChange={handleServicesChange}>
                  <option value="" disabled>Select a service</option>
                  <option value="flight">Flight</option>
                  <option value="train">Train</option>
                  <option value="bus">Bus</option>
                </select>
              </div>
            )}

            <input
              type="text"
              name="phone"
              placeholder="Phone (Optional)"
              value={additionalInfo.phone}
              onChange={handleAdditionalChange}
            />
            <input
              type="text"
              name="address"
              placeholder="Address (Optional)"
              value={additionalInfo.address}
              onChange={handleAdditionalChange}
            />
            <button onClick={handleAdditionalSubmit} className="normal_btn">Complete Registration</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
