import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Alert } from 'react-bootstrap';
import { FaTrash, FaShoppingCart, FaArrowLeft, FaShoppingBag } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function Cart() {
    const [cart, setCart] = useState([]);
    const [total, setTotal] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        // Load cart from localStorage
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart);
                setCart(parsedCart);
            } catch (err) {
                console.error('Error parsing cart data:', err);
                setError('There was an error loading your cart.');
            }
        }
    }, []);

    useEffect(() => {
        // Calculate total whenever cart changes
        const newTotal = cart.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
        setTotal(newTotal);

        // Save cart to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const handleQuantityChange = (id, newQuantity) => {
        if (newQuantity < 1) return;
        
        setCart(prevCart => 
            prevCart.map(item => 
                item.id === id ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const handleRemoveItem = (id) => {
        setCart(prevCart => prevCart.filter(item => item.id !== id));
        setSuccess('Item removed from cart');
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleClearCart = () => {
        setCart([]);
        setSuccess('Cart cleared');
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleCheckout = () => {
        // Placeholder for checkout functionality
        alert('Checkout functionality will be implemented soon!');
    };

    if (cart.length === 0) {
        return (
            <Container className="py-5">
                <div className="text-center py-5">
                    <FaShoppingBag size={50} className="text-muted mb-3" />
                    <h2 className="mb-3">Your cart is empty</h2>
                    <p className="text-muted mb-4">Looks like you haven't added any products to your cart yet.</p>
                    <Link to="/products">
                        <Button variant="primary" size="lg">
                            <FaShoppingCart className="me-2" />
                            Start Shopping
                        </Button>
                    </Link>
                </div>
            </Container>
        );
    }

    return (
        <Container className="py-5">
            <h1 className="mb-4">Shopping Cart</h1>
            
            {error && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                    {error}
                </Alert>
            )}
            
            {success && (
                <Alert variant="success" onClose={() => setSuccess('')} dismissible>
                    {success}
                </Alert>
            )}
            
            <Row>
                <Col lg={8}>
                    <Card className="mb-4 shadow-sm">
                        <Card.Body>
                            <Table responsive>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Price</th>
                                        <th>Quantity</th>
                                        <th>Total</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.map(item => (
                                        <tr key={item.id}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <img 
                                                        src={item.mainImageUrl || 'https://via.placeholder.com/50'} 
                                                        alt={item.name}
                                                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                        className="me-3"
                                                    />
                                                    <div>
                                                        <h6 className="mb-0">{item.name}</h6>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>${item.price?.toFixed(2)}</td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <Button 
                                                        variant="outline-secondary" 
                                                        size="sm"
                                                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                    >
                                                        -
                                                    </Button>
                                                    <Form.Control
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                                        className="mx-2"
                                                        style={{ width: '60px' }}
                                                    />
                                                    <Button 
                                                        variant="outline-secondary" 
                                                        size="sm"
                                                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                    >
                                                        +
                                                    </Button>
                                                </div>
                                            </td>
                                            <td>${(item.price * item.quantity).toFixed(2)}</td>
                                            <td>
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm"
                                                    onClick={() => handleRemoveItem(item.id)}
                                                >
                                                    <FaTrash />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            <div className="d-flex justify-content-between mt-3">
                                <Button 
                                    variant="outline-secondary"
                                    onClick={() => window.history.back()}
                                >
                                    <FaArrowLeft className="me-2" />
                                    Continue Shopping
                                </Button>
                                <Button 
                                    variant="outline-danger"
                                    onClick={handleClearCart}
                                >
                                    Clear Cart
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4}>
                    <Card className="shadow-sm">
                        <Card.Header>
                            <h5 className="mb-0">Order Summary</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-flex justify-content-between mb-3">
                                <span>Subtotal</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-3">
                                <span>Shipping</span>
                                <span>Free</span>
                            </div>
                            <hr />
                            <div className="d-flex justify-content-between mb-3">
                                <strong>Total</strong>
                                <strong>${total.toFixed(2)}</strong>
                            </div>
                            <Button 
                                variant="primary" 
                                size="lg" 
                                className="w-100"
                                onClick={handleCheckout}
                            >
                                Proceed to Checkout
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default Cart; 