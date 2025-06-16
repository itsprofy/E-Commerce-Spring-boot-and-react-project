import React, { useState } from 'react';
import { Container, Button, Alert, Spinner } from 'react-bootstrap';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { useFirebase } from '../contexts/FirebaseContext';

function InitAdmin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useFirebase();
  const navigate = useNavigate();
  const functions = getFunctions();

  const handleInitAdmin = async () => {
    if (!user) {
      setError('You must be logged in first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const initializeAdmin = httpsCallable(functions, 'initializeAdmin');
      const result = await initializeAdmin();
      
      setSuccess(result.data.message);
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          Please log in with your account (profy401@gmail.com) first.
        </Alert>
        <Button variant="primary" onClick={() => navigate('/auth')}>
          Go to Login
        </Button>
      </Container>
    );
  }

  if (user.email !== 'profy401@gmail.com') {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          This page is only accessible to the designated admin email.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6">Initialize Admin Account</h2>
        <p className="mb-4">
          This will initialize the first admin account for the e-commerce system.
          This can only be done once, and only for the designated admin email (profy401@gmail.com).
        </p>
        
        <Button
          onClick={handleInitAdmin}
          disabled={loading}
          className="w-100 mb-3"
          variant="warning"
        >
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Initializing...
            </>
          ) : (
            'Initialize Admin'
          )}
        </Button>

        {error && (
          <Alert variant="danger" className="mt-3">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mt-3">
            {success}
          </Alert>
        )}
      </div>
    </Container>
  );
}

export default InitAdmin; 