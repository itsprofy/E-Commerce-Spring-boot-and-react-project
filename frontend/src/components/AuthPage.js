import React, { useState } from 'react';
import { Container, Form, Button, Alert, Tab, Nav, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { registerUser, loginUser, getUserData } from '../services/authService';

function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const switchMode = (newMode) => {
    setError('');
    setEmail('');
    setPassword('');
    setDisplayName('');
    setMode(newMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      let user;
      if (mode === 'login') {
        user = await loginUser(email, password);
      } else {
        user = await registerUser(email, password, displayName);
      }

      // Fetch user data to check role
      const userData = await getUserData(user.uid);
      // No matter the role, redirect to home. Admins can access the panel via navbar button.
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication error');
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Tab.Container activeKey={mode} onSelect={switchMode}>
            <Nav variant="tabs" className="mb-3 justify-content-center">
              <Nav.Item>
                <Nav.Link eventKey="login">Login</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="register">Register</Nav.Link>
              </Nav.Item>
            </Nav>
            <Tab.Content>
              <Tab.Pane eventKey={mode}>
                {error && (
                  <Alert variant="danger">{error}</Alert>
                )}
                <Form onSubmit={handleSubmit}>
                  {mode === 'register' && (
                    <Form.Group className="mb-3">
                      <Form.Label>Display Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                      />
                    </Form.Group>
                  )}
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Button variant="primary" type="submit" className="w-100">
                    {mode === 'login' ? 'Login' : 'Register'}
                  </Button>
                </Form>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Col>
      </Row>
    </Container>
  );
}

export default AuthPage; 