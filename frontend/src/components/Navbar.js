import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Button, Badge, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaHistory, FaUserShield } from 'react-icons/fa';
import { onAuthStateChange, logoutUser, getUserData, makeUserAdmin } from '../services/authService';
import { useFirebase } from '../contexts/FirebaseContext';

function NavigationBar() {
    const [cartItems, setCartItems] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [makingAdmin, setMakingAdmin] = useState(false);
    const { user, userProfile, loading } = useFirebase();
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    const data = await getUserData(user.uid);
                    setIsAdmin(data && data.role === 'admin');
                } catch (err) {
                    console.error('Error fetching user data', err);
                    setIsAdmin(false);
                }
            } else {
                setIsAdmin(false);
            }
        });
        return unsubscribe;
    }, []);

    const handleAuthClick = () => {
        navigate('/auth');
    };

    const handleLogout = async () => {
        await logoutUser();
        navigate('/');
    };

    const handleAdminClick = () => {
        navigate('/admin');
    };

    const handleMakeAdmin = async () => {
        try {
            setMakingAdmin(true);
            const result = await makeUserAdmin('profy401@gmail.com');
            if (result.success) {
                alert('Successfully made you an admin! Please sign out and sign back in for the changes to take effect.');
            } else {
                alert('Error: ' + (result.error || 'Failed to make user admin'));
            }
        } catch (error) {
            console.error('Error making admin:', error);
            alert('Error: ' + error.message);
        } finally {
            setMakingAdmin(false);
        }
    };

    const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    const renderAuthButton = () => {
        if (user) {
            const name = user.displayName || user.email;
            return (
                <>
                    <Button variant="outline-light" className="ms-2" onClick={handleLogout}>
                        Welcome {name} (Logout)
                    </Button>
                    {userProfile?.roles?.includes('ADMIN') && (
                        <Button variant="outline-warning" className="ms-2" onClick={() => navigate('/admin')}>
                            Admin
                        </Button>
                    )}
                </>
            );
        }
        return (
            <Button variant="outline-light" className="ms-2" onClick={() => navigate('/auth')}>
                <FaUser className="me-2" />
                Login / Register
            </Button>
        );
    };

    return (
        <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
            <Container>
                <Navbar.Brand as={Link} to="/">E-Commerce Store</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/">Home</Nav.Link>
                        <Nav.Link as={Link} to="/products">Products</Nav.Link>
                        <Nav.Link as={Link} to="/search">Search</Nav.Link>
                    </Nav>
                    <Nav>
                        {currentUser && (
                            <Nav.Link as={Link} to="/transactions" className="me-2">
                                <FaHistory className="me-2" />
                                Transaction History
                            </Nav.Link>
                        )}
                        <Nav.Link as={Link} to="/cart" className="me-2">
                            <FaShoppingCart className="me-2" />
                            Cart
                            {cartItemCount > 0 && (
                                <Badge bg="primary" pill className="ms-1">
                                    {cartItemCount}
                                </Badge>
                            )}
                        </Nav.Link>
                        {renderAuthButton()}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default NavigationBar; 