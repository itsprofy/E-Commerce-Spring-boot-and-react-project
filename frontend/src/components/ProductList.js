import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Pagination, Spinner, Badge, Form, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaStar, FaSearch, FaFilter, FaCheckCircle } from 'react-icons/fa';
import * as adminService from '../services/firebaseAdminService';

function ProductList() {
    const [products, setProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('name');
    const [filterBy, setFilterBy] = useState('all');
    const [success, setSuccess] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const navigate = useNavigate();
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            console.log('🔍 ProductList: Fetching products from Firebase...');
            const result = await adminService.getProducts();
            
            if (result.error) {
                console.error('❌ Error fetching products:', result.error);
                setProducts([]);
                return;
            }
            
            let fetchedProducts = result.products;
            console.log('✅ ProductList: Fetched products:', fetchedProducts);
            
            // Apply filtering
            if (filterBy === 'featured') {
                fetchedProducts = fetchedProducts.filter(product => product.featured);
            } else if (filterBy === 'inStock') {
                fetchedProducts = fetchedProducts.filter(product => product.stockQuantity > 0);
            }
            
            // Apply sorting
            switch (sortBy) {
                case 'name':
                    fetchedProducts.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case 'price':
                    fetchedProducts.sort((a, b) => a.price - b.price);
                    break;
                case 'newest':
                    fetchedProducts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                    break;
                default:
                    break;
            }
            
            console.log('✅ ProductList: Products after filtering and sorting:', fetchedProducts);
            
            // Simple pagination (client-side)
            const itemsPerPage = 8;
            const startIndex = currentPage * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedProducts = fetchedProducts.slice(startIndex, endIndex);
            
            setProducts(paginatedProducts);
            setTotalPages(Math.ceil(fetchedProducts.length / itemsPerPage));
        } catch (error) {
            console.error('❌ Error fetching products:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, sortBy, filterBy]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

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

    return (
        <div className="bg-light min-vh-100 py-5">
            <Container>
                {showSuccess && (
                    <Alert variant="success" dismissible onClose={() => setShowSuccess(false)} className="sticky-alert d-flex align-items-center">
                        <FaCheckCircle className="me-2" />
                        <div>{success}</div>
                    </Alert>
                )}
                {/* Header Section */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="mb-0">All Products</h1>
                    <Button 
                        variant="outline-primary" 
                        as={Link} 
                        to="/search"
                        className="rounded-pill"
                    >
                        <FaSearch className="me-2" />
                        Search Products
                    </Button>
                </div>

                {/* Filters Section */}
                <Card className="mb-4 shadow-sm">
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Sort By</Form.Label>
                                    <Form.Select 
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="rounded-pill"
                                    >
                                        <option value="name">Name</option>
                                        <option value="price">Price</option>
                                        <option value="newest">Newest</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Filter By</Form.Label>
                                    <Form.Select 
                                        value={filterBy}
                                        onChange={(e) => setFilterBy(e.target.value)}
                                        className="rounded-pill"
                                    >
                                        <option value="all">All Products</option>
                                        <option value="featured">Featured</option>
                                        <option value="inStock">In Stock</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Products Grid */}
                {loading ? (
                    <div className="text-center">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-5">
                        <h3>No products found</h3>
                        <p>Try changing your filter criteria</p>
                    </div>
                ) : (
                    <Row xs={1} md={2} lg={3} xl={4} className="g-4">
                        {products.map(product => (
                            <Col key={product.id}>
                                <Card className="h-100 border-0 shadow-sm hover-shadow">
                                    <div className="position-relative">
                                        <Link to={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
                                            <Card.Img 
                                                variant="top"
                                                src={product.mainImageUrl} 
                                                alt={product.name}
                                                style={{ height: '250px', objectFit: 'cover', width: '100%' }}
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
                                        </Link>
                                    </div>
                                    <Card.Body>
                                        <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <Card.Title>{product.name}</Card.Title>
                                            <Card.Text>{product.description}</Card.Text>
                                        </Link>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="h5 mb-0">${product.price}</span>
                                            <div>
                                                <Button 
                                                    variant="outline-secondary"
                                                    className="me-2 rounded-pill"
                                                    as={Link}
                                                    to={`/products/${product.id}`}
                                                >
                                                    View Details
                                                </Button>
                                                <Button 
                                                    variant="primary"
                                                    onClick={() => addToCart(product)}
                                                    disabled={product.stockQuantity <= 0}
                                                    className="rounded-pill"
                                                >
                                                    <FaShoppingCart className="me-2" />
                                                    Add to Cart
                                                </Button>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-5">
                        <Pagination className="rounded-pill shadow-sm">
                            <Pagination.First 
                                onClick={() => setCurrentPage(0)}
                                disabled={currentPage === 0}
                            />
                            <Pagination.Prev 
                                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                disabled={currentPage === 0}
                            />
                            {[...Array(totalPages)].map((_, index) => (
                                <Pagination.Item
                                    key={index}
                                    active={index === currentPage}
                                    onClick={() => setCurrentPage(index)}
                                >
                                    {index + 1}
                                </Pagination.Item>
                            ))}
                            <Pagination.Next 
                                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                disabled={currentPage === totalPages - 1}
                            />
                            <Pagination.Last 
                                onClick={() => setCurrentPage(totalPages - 1)}
                                disabled={currentPage === totalPages - 1}
                            />
                        </Pagination>
                    </div>
                )}
            </Container>
        </div>
    );
}

export default ProductList; 