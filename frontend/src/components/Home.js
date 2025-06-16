import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Badge, Alert, Carousel } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaStar, FaTruck, FaShieldAlt, FaUndo, FaCheckCircle } from 'react-icons/fa';
import { useFirebase } from '../contexts/FirebaseContext';
import * as adminService from '../services/firebaseAdminService';
import FirebaseStatus from './FirebaseStatus';
import FirebaseTest from './FirebaseTest';

function Home() {
    // Firebase context
    const { isInitialized } = useFirebase();
    
    // State for featured products
    const [featuredProducts, setFeaturedProducts] = useState([]);
    // State for carousel images
    const [carouselImages, setCarouselImages] = useState([]);
    // Loading state for data fetching
    const [loading, setLoading] = useState(true);
    // Success message state
    const [success, setSuccess] = useState('');
    // State to control success alert visibility
    const [showSuccess, setShowSuccess] = useState(false);
    // Cart state with localStorage persistence
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // Fetch featured products and carousel images on component mount
    useEffect(() => {
        if (!isInitialized) return;

        const fetchFeaturedProducts = async () => {
            try {
                console.log('🏠 Fetching featured products from Firebase...');
                const result = await adminService.getProducts();
                if (result.error) {
                    console.error('Error fetching featured products:', result.error);
                } else {
                    // Filter for featured products
                    const featured = result.products.filter(product => product.featured);
                    setFeaturedProducts(featured);
                    console.log('✅ Featured products loaded:', featured.length);
                }
            } catch (error) {
                console.error('Error fetching featured products:', error);
            }
        };

        const fetchCarouselImages = async () => {
            try {
                console.log('🎠 Fetching carousel images from Firebase...');
                const result = await adminService.getCarouselImages();
                if (result.error) {
                    console.error('Error fetching carousel images:', result.error);
                } else {
                    // Filter for active images and sort by display order
                    const activeImages = result.images
                        .filter(image => image.active)
                        .sort((a, b) => a.displayOrder - b.displayOrder);
                    setCarouselImages(activeImages);
                    console.log('✅ Carousel images loaded:', activeImages.length);
                }
            } catch (error) {
                console.error('Error fetching carousel images:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFeaturedProducts();
        fetchCarouselImages();
    }, [isInitialized]);

    // Persist cart to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product) => {
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

    if (!isInitialized || loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <div className="text-center">
                    <Spinner animation="border" role="status" className="mb-3">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                    <div>
                        {!isInitialized ? 'Initializing Firebase...' : 'Loading content...'}
                    </div>
                </div>
            </Container>
        );
    }

    return (
        <div className="bg-light min-vh-100">
            {/* Debug: Show Firebase status in development */}
            {process.env.NODE_ENV === 'development' && <FirebaseStatus />}
            
            {/* Debug: Detailed Firebase connection test */}
            {process.env.NODE_ENV === 'development' && <FirebaseTest />}
            
            {/* Carousel Section */}
            <div className="mb-5">
                <div className="carousel-container bg-primary bg-gradient p-3 rounded shadow-lg">
                    <Carousel id="carouselExampleAutoplaying" data-bs-ride="carousel">
                        {carouselImages.length > 0 ? (
                            carouselImages.map((image, index) => (
                                <Carousel.Item key={image.id} className={index === 0 ? 'active' : ''}>
                                    <img
                                        src={image.imageUrl}
                                        className="d-block w-100 rounded"
                                        alt={image.title || `Slide ${index + 1}`}
                                        style={{ height: '400px', objectFit: 'cover' }}
                                        onError={(e) => {
                                            e.target.src = 'https://picsum.photos/1200/400';
                                        }}
                                    />
                                    {(image.title || image.subtitle) && (
                                        <Carousel.Caption className="bg-dark bg-opacity-50 p-3 rounded">
                                            {image.title && <h3>{image.title}</h3>}
                                            {image.subtitle && <p>{image.subtitle}</p>}
                                            <Button 
                                                variant="light" 
                                                as={Link} 
                                                to="/products"
                                                className="mt-2 fw-bold shadow-sm"
                                            >
                                                Shop Now
                                            </Button>
                                        </Carousel.Caption>
                                    )}
                                </Carousel.Item>
                            ))
                        ) : (
                            <Carousel.Item>
                                <img
                                    src="https://picsum.photos/1200/400"
                                    className="d-block w-100 rounded"
                                    alt="Default slide"
                                    style={{ height: '400px', objectFit: 'cover' }}
                                />
                                <Carousel.Caption className="bg-dark bg-opacity-50 p-3 rounded">
                                    <h3>Welcome to Our Store</h3>
                                    <p>Discover amazing products at great prices</p>
                                    <Button 
                                        variant="light" 
                                        as={Link} 
                                        to="/products"
                                        className="mt-2 fw-bold shadow-sm"
                                    >
                                        Shop Now
                                    </Button>
                                </Carousel.Caption>
                            </Carousel.Item>
                        )}
                    </Carousel>
                </div>
            </div>

            {showSuccess && (
                <Alert variant="success" dismissible onClose={() => setShowSuccess(false)} className="sticky-alert d-flex align-items-center">
                    <FaCheckCircle className="me-2" />
                    <div>{success}</div>
                </Alert>
            )}

            {/* Features Section */}
            <Container className="py-5">
                <Row className="g-4 mb-5">
                    <Col md={4}>
                        <Card className="h-100 border-0 shadow-sm text-center p-4">
                            <Card.Body>
                                <FaTruck className="text-primary mb-3" size={40} />
                                <Card.Title>Free Shipping</Card.Title>
                                <Card.Text>On orders over $50</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="h-100 border-0 shadow-sm text-center p-4">
                            <Card.Body>
                                <FaShieldAlt className="text-primary mb-3" size={40} />
                                <Card.Title>Secure Payment</Card.Title>
                                <Card.Text>100% secure payment</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="h-100 border-0 shadow-sm text-center p-4">
                            <Card.Body>
                                <FaUndo className="text-primary mb-3" size={40} />
                                <Card.Title>Easy Returns</Card.Title>
                                <Card.Text>30 days return policy</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Featured Products Section */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="mb-0">Featured Products</h2>
                    <Button 
                        variant="outline-primary" 
                        as={Link} 
                        to="/products"
                        className="rounded-pill"
                    >
                        View All Products
                    </Button>
                </div>
                {featuredProducts.length > 0 ? (
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {featuredProducts.map(product => (
                            <Col key={product.id}>
                                <Card className="h-100 border-0 shadow-sm hover-shadow">
                                    <div className="position-relative">
                                        <Card.Img 
                                            variant="top" 
                                            src={product.mainImageUrl || 'https://picsum.photos/300/250'} 
                                            alt={product.name}
                                            style={{ height: '250px', objectFit: 'cover' }}
                                            onError={(e) => {
                                                e.target.src = 'https://picsum.photos/300/250';
                                            }}
                                        />
                                        {product.featured && (
                                            <Badge 
                                                bg="warning" 
                                                className="position-absolute top-0 end-0 m-2"
                                            >
                                                <FaStar className="me-1" />
                                                Featured
                                            </Badge>
                                        )}
                                    </div>
                                    <Card.Body className="d-flex flex-column">
                                        <Card.Title className="mb-2">{product.name}</Card.Title>
                                        <Card.Text className="text-muted mb-3">
                                            {product.description}
                                        </Card.Text>
                                        <div className="mt-auto">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h4 className="mb-0 text-primary">${product.price?.toFixed(2) || '0.00'}</h4>
                                                <Badge bg={product.stockQuantity > 0 ? "success" : "danger"}>
                                                    {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
                                                </Badge>
                                            </div>
                                            <div className="d-grid gap-2">
                                                <Button 
                                                    variant="primary" 
                                                    className="rounded-pill"
                                                    onClick={() => addToCart(product)}
                                                    disabled={product.stockQuantity === 0}
                                                >
                                                    <FaShoppingCart className="me-2" />
                                                    Add to Cart
                                                </Button>
                                                <Button 
                                                    variant="outline-primary" 
                                                    className="rounded-pill"
                                                    as={Link} 
                                                    to={`/products/${product.id}`}
                                                >
                                                    View Details
                                                </Button>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <div className="text-center py-5">
                        <h4 className="text-muted">No featured products available</h4>
                        <p>Check back later for new featured items!</p>
                    </div>
                )}
            </Container>
        </div>
    );
}

export default Home; 