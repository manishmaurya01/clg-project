import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  // Fetch user details from Firebase
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const docRef = doc(db, 'registeredUsers', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserDetails(docSnap.data());
        } else {
          alert('No user data found!');
        }
      } catch (error) {
        alert('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe(); // Clean up the listener
    };
  }, [navigate]);

  // Function to handle image upload via Cloudinary
  const handleUpload = () => {
    window.cloudinary.openUploadWidget(
      {
        cloudName: 'dyvfhi7ys', // Replace with your Cloudinary cloud name
        uploadPreset: 'profile-image-upload', // Replace with your upload preset
        sources: ['local', 'url', 'camera'],
        cropping: true,
        multiple: false,
        maxFileSize: 10000000, // Set the max file size in bytes
        defaultSource: 'local',
      },
      async (error, result) => {
        if (error) {
          alert('Upload failed');
          console.error(error);
          return;
        }

        const uploadedImageUrl = result?.[0]?.secure_url;

        if (uploadedImageUrl) {
          setUploading(true);
          try {
            const userRef = doc(db, 'registeredUsers', auth.currentUser.uid);

            await updateDoc(userRef, {
              profilePicture: uploadedImageUrl, // Update the profile picture URL
            });

            // Re-fetch the user details from Firestore
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
              setUserDetails(docSnap.data());
            }

            setUploading(false);
          } catch (error) {
            alert('Error updating profile picture:', error);
            setUploading(false);
          }
        }
      }
    );
  };

  const handleClose = () => {
    navigate('/home'); // Navigate to home page when close icon is clicked
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!userDetails) {
    return <div>No user details available.</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>{userDetails.accountType === 'business' ? 'Business Profile' : 'User Profile'}</h2>
        <div className="close-icon" onClick={handleClose}>
          <span>&times;</span> {/* Simple close icon (X) */}
        </div>
      </div>
      <div className="profile-content">
        <div className="profile-image-container">
          <img
            src={userDetails.profilePicture || '/default-profile.png'} // Fallback to default image if no profile picture
            alt="Profile"
            className="profile-image"
          />
          <div className="edit-icon" onClick={handleUpload}>
            <span>Edit</span> {/* Replace with an edit icon if needed */}
          </div>
        </div>

        <div className="profile-info">
          <div className="profile-item">
            <strong>Name:</strong> {userDetails.name || 'N/A'}
          </div>
          <div className="profile-item">
            <strong>Email:</strong> {userDetails.email || 'N/A'}
          </div>
          <div className="profile-item">
            <strong>Phone:</strong> {userDetails.phone || 'N/A'}
          </div>
          <div className="profile-item">
            <strong>Address:</strong> {userDetails.address || 'N/A'}
          </div>
          <div className="profile-item">
            <strong>Account Type:</strong> {userDetails.accountType || 'N/A'}
          </div>
          {userDetails.accountType === 'business' && (
            <>
              <div className="profile-item">
                <strong>Business Name:</strong> {userDetails.businessName || 'N/A'}
              </div>
              <div className="profile-item">
                <strong>Services Offered:</strong> {userDetails.services.join(', ') || 'N/A'}
              </div>
              <div className="profile-item">
                <strong>Business Hours:</strong> {userDetails.businessHours || 'N/A'}
              </div>
              <div className="profile-item">
                <strong>Location:</strong> {userDetails.location || 'N/A'}
              </div>
              <div className="profile-item">
                <strong>Website:</strong> {userDetails.website || 'N/A'}
              </div>
            </>
          )}
        </div>

        <div className="profile-actions">
          <button className="edit-profile-btn" onClick={() => navigate('/edit-profile')}>
            Edit Profile
          </button>
          <button className="logout-btn" onClick={() => auth.signOut()}>
          Logout
        </button>
        </div>
      </div>
      
      {uploading && <div>Uploading...</div>}
    </div>
  );
};

export default Profile;
