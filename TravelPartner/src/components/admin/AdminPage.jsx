import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../../firebase/firebaseConfig'; // Your Firebase Firestore config
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom'; // For page redirection

const AdminPage = () => {

  
  const [userType, setUserType] = useState(null);
  const auth = getAuth();
  const navigate = useNavigate(); // For navigation

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get the user's document from 'registeredUsers' collection
        const userDocRef = doc(db, 'registeredUsers', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          if (userData.accountType === 'business') {
            setUserType('business'); // User is a business type
          } else {
            // Redirect if not a business user
            navigate('/not-authorized'); // Redirect to a not-authorized page or home
          }
        }
      } else {
        // No user is signed in, redirect to login page
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  if (userType !== 'business') {
    return <p>You do not have access to this page.</p>;
  }

  return (
    <div>
      <h1>Welcome to the Admin Page</h1>
      {/* Your admin page content */}
    </div>
  );
};

export default AdminPage;
