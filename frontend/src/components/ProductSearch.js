import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { FaSearch, FaShoppingCart, FaCheckCircle } from 'react-icons/fa';
import debounce from 'lodash/debounce';
import * as adminService from '../services/firebaseAdminService';

function ProductSearch() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const fetchCategories = async () => {
        try {
            console.log('🔍 ProductSearch: Fetching categories from Firebase...');
            const result = await adminService.getCategories();
            
            if (result.error) {
                console.error('❌ Error fetching categories:', result.error);
                setCategories([]);
                return;
            }
            
            console.log('✅ ProductSearch: Fetched categories:', result.categories);
            setCategories(result.categories);
        } catch (error) {
            console.error('❌ Error fetching categories:', error);
            setCategories([]);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            console.log('🔍 ProductSearch: Fetching all products from Firebase...');
            const result = await adminService.getProducts();
            
            if (result.error) {
                console.error('❌ Error fetching products:', result.error);
                setProducts([]);
                return;
            }
            
            console.log('✅ ProductSearch: Fetched products:', result.products);
            setProducts(result.products);
        } catch (error) {
            console.error('❌ Error fetching products:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = useCallback(async (term, category) => {
        setLoading(true);
        try {
            console.log('🔍 ProductSearch: Searching with term:', term, 'category:', category);
            
            // Get all products from Firebase
            const result = await adminService.getProducts();
            
            if (result.error) {
                console.error('❌ Error searching products:', result.error);
                setProducts([]);
                return;
            }
            
            let filteredProducts = result.products;
            
            // Filter by search term
            if (term && term.trim() !== '') {
                const searchTermLower = term.toLowerCase();
                filteredProducts = filteredProducts.filter(product => 
                    product.name.toLowerCase().includes(searchTermLower) ||
                    product.description.toLowerCase().includes(searchTermLower)
                );
            }
            
            // Filter by category
            if (category && category !== '') {
                filteredProducts = filteredProducts.filter(product => 
                    product.categoryId === category
                );
            }
            
            console.log('✅ ProductSearch: Filtered products:', filteredProducts);
            setProducts(filteredProducts);
        } catch (error) {
            console.error('❌ Error searching products:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Create a debounced search function
    const debouncedSearch = useCallback(
        debounce((term, category) => {
            handleSearch(term, category);
        }, 300),
        [handleSearch]
    );

    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, []);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    // Update search when searchTerm or selectedCategory changes
    useEffect(() => {
        debouncedSearch(searchTerm, selectedCategory);
        return () => debouncedSearch.cancel();
    }, [searchTerm, selectedCategory, debouncedSearch]);

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
        <Container className="py-5">
            {showSuccess && (
                <Alert variant="success" dismissible onClose={() => setShowSuccess(false)} className="sticky-alert d-flex align-items-center">
                    <FaCheckCircle className="me-2" />
                    <div>{success}</div>
                </Alert>
            )}
            <Row className="mb-4">
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Search Products</Form.Label>
                        <div className="d-flex">
                            <Form.Control
                                type="text"
                                placeholder="Enter product name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Button 
                                variant="primary" 
                                className="ms-2"
                                onClick={() => handleSearch(searchTerm, selectedCategory)}
                            >
                                <FaSearch />
                            </Button>
                        </div>
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Filter by Category</Form.Label>
                        <Form.Select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>

            {loading ? (
                <div className="text-center">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-5">
                    <h3>No products found</h3>
                    <p>Try changing your search criteria or category filter</p>
                </div>
            ) : (
                <Row>
                    {products.map(product => (
                        <Col key={product.id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                            <Card className="h-100 shadow-sm">
                                <Card.Img 
                                    variant="top"
                                    src={product.mainImageUrl} 
                                    alt={product.name}
                                    style={{ height: '200px', objectFit: 'cover', width: '100%' }}
                                />
                                <Card.Body>
                                    <Card.Title>{product.name}</Card.Title>
                                    <Card.Text>{product.description}</Card.Text>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="h5 mb-0">${product.price}</span>
                                        <Button 
                                            variant="primary"
                                            onClick={() => addToCart(product)}
                                            disabled={product.stockQuantity <= 0}
                                        >
                                            <FaShoppingCart className="me-2" />
                                            Add to Cart
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
}

export default ProductSearch; 