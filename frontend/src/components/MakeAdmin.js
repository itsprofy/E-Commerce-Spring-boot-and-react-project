import React, { useState } from 'react';
import { Container, Button, Alert, Spinner } from 'react-bootstrap';
import { makeUserAdmin } from '../services/authService';

function MakeAdmin() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleMakeAdmin = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const result = await makeUserAdmin('profy401@gmail.com');
      if (result.success) {
        setMessage('Successfully made you an admin! Please sign out and sign back in for the changes to take effect.');
      } else {
        setError(result.error || 'Failed to make user admin');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Make Yourself Admin</h2>
        
        <Button
          onClick={handleMakeAdmin}
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              Making admin...
            </>
          ) : (
            'Make Me Admin'
          )}
        </Button>

        {message && (
          <Alert variant="success" className="mt-4">
            {message}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" className="mt-4">
            Error: {error}
          </Alert>
        )}
      </div>
    </Container>
  );
}

export default MakeAdmin; 