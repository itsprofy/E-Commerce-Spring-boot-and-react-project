import React from 'react';
import { Navigate } from 'react-router-dom';
import { useFirebase } from '../contexts/FirebaseContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, userProfile, loading } = useFirebase();

  // Show loading state while auth state is being determined
  if (loading) {
    return <div>Loading...</div>;
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/auth" />;
  }

  // If a specific role is required, check if user has that role
  if (requiredRole) {
    const hasRole = userProfile?.roles?.includes(requiredRole);
    if (!hasRole) {
      return <Navigate to="/" />;
    }
  }

  return children;
};

export default ProtectedRoute; 