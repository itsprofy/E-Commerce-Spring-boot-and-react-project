import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge, Tab, Tabs, Modal } from 'react-bootstrap';
import { FaShoppingCart, FaCheckCircle, FaStar, FaArrowLeft, FaInfoCircle } from 'react-icons/fa';
import ProductQA from './ProductQA';
import ProductComments from './ProductComments';
import { useFirebase } from '../contexts/FirebaseContext';
import { getProductById } from '../services/firebaseAdminService';

function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const { user, userProfile } = useFirebase();
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError('');
                
                // Use Firebase service to fetch product
                const result = await getProductById(id);
                
                if (result.error) {
                    console.error('Error fetching product:', result.error);
                    setError('Failed to load product details. Please try again later.');
                    return;
                }
                
                if (!result.product) {
                    setError('Product not found');
                    return;
                }
                
                setProduct(result.product);
            } catch (error) {
                console.error('Error fetching product:', error);
                setError('An unexpected error occurred. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchProduct();
    }, [id]);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = () => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
        setSuccess(`${product.name} added to cart!`);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const handleViewDetails = () => {
        setShowDetailsModal(true);
    };

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-5">
                <Alert variant="danger">
                    {error}
                    <div className="mt-3">
                        <Button variant="outline-primary" onClick={() => navigate('/products')}>
                            <FaArrowLeft className="me-2" />
                            Back to Products
                        </Button>
                    </div>
                </Alert>
            </Container>
        );
    }

    if (!product) {
        return (
            <Container className="py-5">
                <Alert variant="warning">
                    Product not found
                    <div className="mt-3">
                        <Button variant="outline-primary" onClick={() => navigate('/products')}>
                            <FaArrowLeft className="me-2" />
                            Back to Products
                        </Button>
                    </div>
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="py-5">
            {showSuccess && (
                <Alert variant="success" dismissible onClose={() => setShowSuccess(false)} className="d-flex align-items-center mb-4">
                    <FaCheckCircle className="me-2" />
                    <div>{success}</div>
                </Alert>
            )}
            
            <Row>
                <Col md={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Img 
                            variant="top" 
                            src={product.mainImageUrl} 
                            alt={product.name}
                            style={{ height: '400px', objectFit: 'cover' }}
                        />
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="p-4">
                            <h1 className="mb-3">{product.name}</h1>
                            <h3 className="text-primary mb-4">${product.price?.toFixed(2)}</h3>
                            <p className="text-muted mb-4">{product.description}</p>
                            <div className="d-flex align-items-center mb-4">
                                <span className="me-3">Stock:</span>
                                <span className={`badge ${product.stockQuantity > 0 ? 'bg-success' : 'bg-danger'}`}>
                                    {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
                                </span>
                            </div>
                            <div className="d-grid gap-2">
                                <Button 
                                    variant="primary" 
                                    size="lg" 
                                    disabled={product.stockQuantity === 0}
                                    onClick={addToCart}
                                >
                                    <FaShoppingCart className="me-2" />
                                    Add to Cart
                                </Button>
                                
                                <Button 
                                    variant="outline-secondary" 
                                    size="lg"
                                    onClick={handleViewDetails}
                                >
                                    <FaInfoCircle className="me-2" />
                                    View Details
                                </Button>
                                
                                <Button 
                                    variant="outline-secondary" 
                                    onClick={() => navigate('/products')}
                                >
                                    <FaArrowLeft className="me-2" />
                                    Back to Products
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="mt-5">
                <Col>
                    <Tabs defaultActiveKey="reviews" className="mb-4">
                        <Tab eventKey="reviews" title="Reviews">
                            <ProductComments 
                                productId={product.id}
                                currentUser={user}
                                isAdmin={userProfile?.roles?.includes('ADMIN')}
                            />
                        </Tab>
                        <Tab eventKey="qa" title="Questions & Answers">
                            <ProductQA 
                                productId={product.id}
                                currentUser={user}
                                isAdmin={userProfile?.roles?.includes('ADMIN')}
                            />
                        </Tab>
                    </Tabs>
                </Col>
            </Row>

            {/* Product Details Modal */}
            <Modal 
                show={showDetailsModal} 
                onHide={() => setShowDetailsModal(false)}
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Product Specifications</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col md={5}>
                            <img 
                                src={product.mainImageUrl} 
                                alt={product.name}
                                className="img-fluid rounded mb-3"
                            />
                        </Col>
                        <Col md={7}>
                            <h3>{product.name}</h3>
                            <h5 className="text-primary mb-3">${product.price?.toFixed(2)}</h5>
                            
                            <h6 className="mt-4 mb-3">Product Description</h6>
                            <p>{product.description}</p>
                            
                            <h6 className="mt-4 mb-3">Specifications</h6>
                            <table className="table table-striped">
                                <tbody>
                                    <tr>
                                        <td>Category</td>
                                        <td>{product.category?.name || 'Uncategorized'}</td>
                                    </tr>
                                    <tr>
                                        <td>Stock</td>
                                        <td>{product.stockQuantity} units</td>
                                    </tr>
                                    <tr>
                                        <td>Featured</td>
                                        <td>{product.featured ? 'Yes' : 'No'}</td>
                                    </tr>
                                    <tr>
                                        <td>Product ID</td>
                                        <td>{product.id}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                        Close
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={() => {
                            addToCart();
                            setShowDetailsModal(false);
                        }}
                        disabled={product.stockQuantity === 0}
                    >
                        <FaShoppingCart className="me-2" />
                        Add to Cart
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default ProductDetails; 