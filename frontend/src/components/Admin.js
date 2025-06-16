import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { FaEdit, FaTrash, FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaUserPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import * as adminService from '../services/firebaseAdminService';
import { makeUserAdmin } from '../services/authService';
import { useFirebase } from '../contexts/FirebaseContext';

function Admin() {
    const { user, userProfile, loading: authLoading } = useFirebase();
    const [loading, setLoading] = useState(true);
    // State for products list
    const [products, setProducts] = useState([]);
    // State for controlling product modal visibility
    const [showModal, setShowModal] = useState(false);
    // State for tracking which product is being edited
    const [editingProduct, setEditingProduct] = useState(null);
    // State for product form data
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        mainImageUrl: '',
        stockQuantity: '',
        categoryId: '',
        featured: false
    });
    // State for error messages
    const [error, setError] = useState('');
    // State for success messages
    const [success, setSuccess] = useState('');
    // State for info messages
    const [info, setInfo] = useState('');
    // State for warning messages
    const [warning, setWarning] = useState('');
    // State for controlling alert visibility
    const [showAlerts, setShowAlerts] = useState({
        error: true,
        success: true,
        warning: true,
        info: true
    });
    // State for categories list
    const [categories, setCategories] = useState([]);
    // State for controlling category modal visibility
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    // State for category form data
    const [categoryFormData, setCategoryFormData] = useState({
        name: '',
        description: ''
    });
    // State for carousel images list
    const [carouselImages, setCarouselImages] = useState([]);
    // State for controlling carousel modal visibility
    const [showCarouselModal, setShowCarouselModal] = useState(false);
    // State for carousel form data
    const [carouselFormData, setCarouselFormData] = useState({
        imageUrl: '',
        title: '',
        subtitle: '',
        displayOrder: 0,
        active: true
    });
    // Navigation hook for routing
    const navigate = useNavigate();
    
    // State for delete confirmation modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    // State for tracking which product is being deleted
    const [productToDelete, setProductToDelete] = useState(null);
    // State for tracking type of item being deleted
    const [deleteType, setDeleteType] = useState('');
    const [makingAdmin, setMakingAdmin] = useState(false);
    const [testingAuth, setTestingAuth] = useState(false);
    const [authTestResult, setAuthTestResult] = useState(null);

    useEffect(() => {
        const initializeAdmin = async () => {
            if (!authLoading && user && userProfile?.roles?.includes('ADMIN')) {
                try {
                    setLoading(true);
                    // Force token refresh before fetching data
                    await user.getIdToken(true);
                    await Promise.all([
                        fetchProducts(),
                        fetchCategories(),
                        fetchCarouselImages()
                    ]);
                    setInfo('Welcome to the Firebase Admin Panel! You can manage your products here.');
                    setWarning('');
                } catch (error) {
                    console.error('Error initializing admin:', error);
                    setError('Error initializing admin panel: ' + error.message);
                } finally {
                    setLoading(false);
                }
            }
        };

        initializeAdmin();
    }, [authLoading, user, userProfile]);

    const fetchProducts = async () => {
        try {
            console.log('Fetching products from Firebase...');
            const result = await adminService.getProducts();
            
            if (result.error) {
                console.error('Error fetching products:', result.error);
                setError('Error fetching products: ' + result.error);
                setShowAlerts(prev => ({ ...prev, error: true }));
                setProducts([]);
                return;
            }
            
            console.log('Fetched products:', result.products);
            setProducts(result.products);
        } catch (error) {
            console.error('Error fetching products:', error);
            setError('Error fetching products: ' + error.message);
            setShowAlerts(prev => ({ ...prev, error: true }));
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            console.log('🚀 Starting fetchCategories function...');
            console.log('📞 Calling adminService.getCategories()...');
            const result = await adminService.getCategories();
            console.log('📋 Raw result from adminService.getCategories():', result);
            
            if (result.error) {
                console.error('❌ Error in result:', result.error);
                setError('Error fetching categories: ' + result.error);
                setShowAlerts(prev => ({ ...prev, error: true }));
                setCategories([]);
                return;
            }
            
            console.log('✅ Categories fetched successfully:', result.categories);
            console.log('📊 Number of categories:', result.categories.length);
            console.log('🔍 Individual categories:', result.categories.map(cat => ({ id: cat.id, name: cat.name, description: cat.description })));
            
            setCategories(result.categories);
            console.log('🎯 Categories state should now be updated with:', result.categories);
        } catch (error) {
            console.error('💥 Exception in fetchCategories:', error);
            setError('Error fetching categories: ' + error.message);
            setShowAlerts(prev => ({ ...prev, error: true }));
            setCategories([]);
        }
    };

    const fetchCarouselImages = async () => {
        try {
            console.log('Fetching carousel images from Firebase...');
            const result = await adminService.getCarouselImages();
            
            if (result.error) {
                console.error('Error fetching carousel images:', result.error);
                setError('Error fetching carousel images: ' + result.error);
                setShowAlerts(prev => ({ ...prev, error: true }));
                setCarouselImages([]);
                return;
            }
            
            console.log('Fetched carousel images:', result.images);
            setCarouselImages(result.images);
        } catch (error) {
            console.error('Error fetching carousel images:', error);
            setError('Error fetching carousel images: ' + error.message);
            setShowAlerts(prev => ({ ...prev, error: true }));
            setCarouselImages([]);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setShowAlerts(prev => ({ ...prev, success: false, error: false }));
        
        try {
            // Validate form data
            if (!formData.name || formData.name.trim() === '') {
                setError('Product name is required');
                setShowAlerts(prev => ({ ...prev, error: true }));
                setLoading(false);
                return;
            }
            
            if (!formData.description || formData.description.trim() === '') {
                setError('Product description is required');
                setShowAlerts(prev => ({ ...prev, error: true }));
                setLoading(false);
                return;
            }
            
            if (formData.price === '' || isNaN(Number(formData.price))) {
                setError('Valid product price is required');
                setShowAlerts(prev => ({ ...prev, error: true }));
                setLoading(false);
                return;
            }
            
            if (!formData.mainImageUrl || formData.mainImageUrl.trim() === '') {
                setError('Product image URL is required');
                setShowAlerts(prev => ({ ...prev, error: true }));
                setLoading(false);
                return;
            }
            
            if (!formData.categoryId || formData.categoryId.trim() === '') {
                setError('Please select a category');
                setShowAlerts(prev => ({ ...prev, error: true }));
                setLoading(false);
                return;
            }
            
            // Create plain object with the form data
            const plainData = {
                name: String(formData.name || '').trim(),
                description: String(formData.description || '').trim(),
                price: Number(formData.price),
                stockQuantity: Number(formData.stockQuantity || 0), // Changed from stock to stockQuantity
                categoryId: formData.categoryId || null,
                mainImageUrl: String(formData.mainImageUrl || '').trim(), // Changed from imageUrl to mainImageUrl
                active: true,
                featured: formData.featured === true
            };
            
            console.log('Submitting product data:', plainData);
            
            let result;
            if (formData.id) {
                // Update existing product
                result = await adminService.updateProduct(formData.id, plainData);
                if (result.success) {
                    setSuccess('Product updated successfully');
                } else {
                    setError('Error updating product: ' + result.error);
                }
            } else {
                // Add new product - try HTTP method first
                result = await adminService.createProductHttp(plainData);
                
                // If HTTP method fails, fall back to original method
                if (!result.success) {
                    console.log('HTTP product creation failed, trying original method');
                    result = await adminService.createProduct(plainData);
                }
                
                if (result.success) {
                    setSuccess('Product added successfully');
                } else {
                    setError('Error saving product: ' + result.error);
                }
            }
            
            if (result.success) {
                setShowAlerts(prev => ({ ...prev, success: true }));
                setShowModal(false);
                fetchProducts();
                resetForm();
            } else {
                setShowAlerts(prev => ({ ...prev, error: true }));
            }
        } catch (error) {
            console.error('Error saving product:', error);
            setError('Error saving product: ' + error.message);
            setShowAlerts(prev => ({ ...prev, error: true }));
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product) => {
        console.log('Editing product:', product);
        
        setFormData({
            id: product.id,
            name: product.name || '',
            description: product.description || '',
            price: product.price || 0,
            mainImageUrl: product.mainImageUrl || '',
            stockQuantity: product.stockQuantity || 0,
            featured: product.featured === true,
            categoryId: product.categoryId || '',
        });
        
        console.log('Form data set for editing:', {
            id: product.id,
            name: product.name,
            featured: product.featured === true,
            imageUrl: product.mainImageUrl
        });
        
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        setProductToDelete(id);
        setDeleteType('product');
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        setLoading(true);
        try {
            let result;
            if (deleteType === 'product' && productToDelete) {
                result = await adminService.deleteProduct(productToDelete);
                if (result.success) {
                    setSuccess('Product deleted successfully');
                    fetchProducts();
                } else {
                    setError('Error deleting product: ' + result.error);
                }
            } else if (deleteType === 'category' && productToDelete) {
                result = await adminService.deleteCategory(productToDelete);
                if (result.success) {
                    setSuccess('Category deleted successfully');
                    fetchCategories();
                } else {
                    setError('Error deleting category: ' + result.error);
                }
            } else if (deleteType === 'carousel' && productToDelete) {
                result = await adminService.deleteCarouselImage(productToDelete);
                if (result.success) {
                    setSuccess('Carousel image deleted successfully');
                    fetchCarouselImages();
                } else {
                    setError('Error deleting carousel image: ' + result.error);
                }
            }
            
            if (result && result.success) {
                setShowAlerts(prev => ({ ...prev, success: true }));
            } else {
                setShowAlerts(prev => ({ ...prev, error: true }));
            }
        } catch (error) {
            console.error(`Error deleting ${deleteType}:`, error);
            setError(`Error deleting ${deleteType}: ` + error.message);
            setShowAlerts(prev => ({ ...prev, error: true }));
        } finally {
            setLoading(false);
            setShowDeleteModal(false);
            setProductToDelete(null);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            mainImageUrl: '',
            stockQuantity: '',
            categoryId: '',
            featured: false
        });
        setEditingProduct(null);
    };

    const dismissAlert = (type) => {
        setShowAlerts(prev => ({
            ...prev,
            [type]: false
        }));
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setShowAlerts(prev => ({ ...prev, success: false, error: false }));
        
        try {
            // Only validate required fields
            if (!categoryFormData.name || categoryFormData.name.trim() === '') {
                setError('Category name is required');
                setShowAlerts(prev => ({ ...prev, error: true }));
                setLoading(false);
                return;
            }
            
            if (!categoryFormData.description || categoryFormData.description.trim() === '') {
                setError('Category description is required');
                setShowAlerts(prev => ({ ...prev, error: true }));
                setLoading(false);
                return;
            }
            
            // Create a plain object with only the required data
            const plainData = {
                name: String(categoryFormData.name || '').trim(),
                description: String(categoryFormData.description || '').trim()
            };
            
            console.log('Submitting category data:', plainData);
            
            let result;
            if (categoryFormData.id) {
                // Update existing category
                result = await adminService.updateCategory(categoryFormData.id, plainData);
                if (result.success) {
                    setSuccess('Category updated successfully');
                } else {
                    setError('Error updating category: ' + result.error);
                }
            } else {
                // Add new category - try HTTP method first
                result = await adminService.createCategoryHttp(plainData);
                
                // If HTTP method fails, fall back to original method
                if (!result.success) {
                    console.log('HTTP category creation failed, trying original method');
                    result = await adminService.createCategory(plainData);
                }
                
                if (result.success) {
                    setSuccess('Category added successfully');
                } else {
                    setError('Error creating category: ' + result.error);
                }
            }
            
            if (result.success) {
                setShowAlerts(prev => ({ ...prev, success: true }));
                setShowCategoryModal(false);
                fetchCategories();
                setCategoryFormData({ name: '', description: '' });
            } else {
                setShowAlerts(prev => ({ ...prev, error: true }));
            }
        } catch (error) {
            console.error('Error saving category:', error);
            setError('Error saving category: ' + error.message);
            setShowAlerts(prev => ({ ...prev, error: true }));
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryDelete = async (id) => {
        setProductToDelete(id);
        setDeleteType('category');
        setShowDeleteModal(true);
    };

    const handleCarouselSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setShowAlerts(prev => ({ ...prev, success: false, error: false }));
        
        try {
            if (!carouselFormData.imageUrl || carouselFormData.imageUrl.trim() === '') {
                setError('Image URL is required');
                setShowAlerts(prev => ({ ...prev, error: true }));
                setLoading(false);
                return;
            }
            
            const imageData = {
                imageUrl: carouselFormData.imageUrl.trim(),
                title: (carouselFormData.title || '').trim(),
                subtitle: (carouselFormData.subtitle || '').trim(),
                displayOrder: Number(carouselFormData.displayOrder) || 0,
                active: carouselFormData.active !== false
            };
            
            let result;
            if (carouselFormData.id) {
                // Update existing carousel image
                result = await adminService.updateCarouselImage(carouselFormData.id, imageData);
                if (result.success) {
                    setSuccess('Carousel image updated successfully');
                } else {
                    setError('Error updating carousel image: ' + result.error);
                }
            } else {
                // Add new carousel image - try HTTP method first
                result = await adminService.createCarouselImageHttp(imageData);
                
                // If HTTP method fails, fall back to original method
                if (!result.success) {
                    console.log('HTTP carousel image creation failed, trying original method');
                    result = await adminService.createCarouselImage(imageData);
                }
                
                if (result.success) {
                    setSuccess('Carousel image added successfully');
                } else {
                    setError('Error creating carousel image: ' + result.error);
                }
            }
            
            if (result.success) {
                setShowAlerts(prev => ({ ...prev, success: true }));
                setShowCarouselModal(false);
                fetchCarouselImages();
                setCarouselFormData({ 
                    imageUrl: '',
                    title: '',
                    subtitle: '',
                    displayOrder: 0,
                    active: true
                });
            } else {
                setShowAlerts(prev => ({ ...prev, error: true }));
            }
        } catch (error) {
            console.error('Error saving carousel image:', error);
            setError('Error saving carousel image: ' + error.message);
            setShowAlerts(prev => ({ ...prev, error: true }));
        } finally {
            setLoading(false);
        }
    };
    
    const handleCarouselDelete = async (id) => {
        setProductToDelete(id);
        setDeleteType('carousel');
        setShowDeleteModal(true);
    };

    const handleMakeAdmin = async () => {
        try {
            setMakingAdmin(true);
            setError('');
            const result = await makeUserAdmin('profy401@gmail.com');
            if (result.success) {
                setSuccess('Successfully made you an admin! Please sign out and sign back in for the changes to take effect.');
            } else {
                setError(result.error || 'Failed to make user admin');
            }
        } catch (error) {
            console.error('Error making admin:', error);
            setError(error.message);
        } finally {
            setMakingAdmin(false);
        }
    };

    // Add test auth function
    const handleTestAuth = async () => {
        try {
            setTestingAuth(true);
            setError('');
            setSuccess('');
            setAuthTestResult(null);
            
            const result = await adminService.testAuth();
            console.log('Auth test result:', result);
            
            if (result.success) {
                setSuccess('Authentication test successful! See console for details.');
                setAuthTestResult(result);
            } else {
                setError('Authentication test failed: ' + result.error);
                setAuthTestResult(result);
            }
            
            setShowAlerts(prev => ({ 
                ...prev, 
                success: result.success, 
                error: !result.success 
            }));
        } catch (error) {
            console.error('Error testing auth:', error);
            setError('Error testing auth: ' + error.message);
            setShowAlerts(prev => ({ ...prev, error: true }));
        } finally {
            setTestingAuth(false);
        }
    };

    // Add HTTP test auth function
    const handleTestAuthHttp = async () => {
        try {
            setTestingAuth(true);
            setError('');
            setSuccess('');
            setAuthTestResult(null);
            
            const result = await adminService.testAuthHttp();
            console.log('Auth HTTP test result:', result);
            
            if (result.success) {
                setSuccess('HTTP Authentication test successful! See console for details.');
                setAuthTestResult(result);
            } else {
                setError('HTTP Authentication test failed: ' + result.error);
                setAuthTestResult(result);
            }
            
            setShowAlerts(prev => ({ 
                ...prev, 
                success: result.success, 
                error: !result.success 
            }));
        } catch (error) {
            console.error('Error testing auth via HTTP:', error);
            setError('Error testing auth via HTTP: ' + error.message);
            setShowAlerts(prev => ({ ...prev, error: true }));
        } finally {
            setTestingAuth(false);
        }
    };

    // Show loading state while checking authentication
    if (authLoading || loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    // Show error if user is not authenticated
    if (!user) {
        return (
            <Container>
                <Alert variant="danger">
                    <FaExclamationTriangle className="me-2" />
                    Please log in to access the admin panel.
                </Alert>
            </Container>
        );
    }

    // Show error if user is not an admin
    if (!userProfile?.roles?.includes('ADMIN')) {
        return (
            <Container>
                <Alert variant="danger">
                    <FaExclamationTriangle className="me-2" />
                    You do not have permission to access this page.
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Admin Dashboard</h1>
                <div>
                    <Button 
                        variant="info" 
                        className="me-2"
                        onClick={handleTestAuth}
                        disabled={testingAuth}
                    >
                        {testingAuth ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
                                Testing Auth...
                            </>
                        ) : (
                            'Test Authentication'
                        )}
                    </Button>
                    <Button 
                        variant="warning" 
                        className="me-2"
                        onClick={handleTestAuthHttp}
                        disabled={testingAuth}
                    >
                        {testingAuth ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
                                Testing HTTP Auth...
                            </>
                        ) : (
                            'Test HTTP Auth'
                        )}
                    </Button>
                    <Button 
                        variant="primary" 
                        className="me-2"
                        onClick={() => {
                            resetForm();
                            setShowModal(true);
                        }}
                    >
                        Add New Product
                    </Button>
                    <Button 
                        variant="outline-danger"
                        onClick={() => {
                            navigate('/');
                        }}
                    >
                        Back to Home
                    </Button>
                </div>
            </div>

            {/* Auth Test Result */}
            {authTestResult && (
                <Alert 
                    variant={authTestResult.success ? "info" : "warning"} 
                    dismissible 
                    onClose={() => setAuthTestResult(null)}
                    className="mb-4"
                >
                    <h5>Authentication Test Results:</h5>
                    <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '200px', overflow: 'auto' }}>
                        {JSON.stringify(authTestResult, null, 2)}
                    </pre>
                </Alert>
            )}

            {/* Alerts Section */}
            {showAlerts.info && info && (
                <Alert variant="primary" dismissible onClose={() => dismissAlert('info')} className="d-flex align-items-center">
                    <FaInfoCircle className="me-2" />
                    <div>{info}</div>
                </Alert>
            )}
            {showAlerts.success && success && (
                <Alert variant="success" dismissible onClose={() => dismissAlert('success')} className="d-flex align-items-center">
                    <FaCheckCircle className="me-2" />
                    <div>{success}</div>
                </Alert>
            )}
            {showAlerts.warning && warning && (
                <Alert variant="warning" dismissible onClose={() => dismissAlert('warning')} className="d-flex align-items-center">
                    <FaExclamationTriangle className="me-2" />
                    <div>{warning}</div>
                </Alert>
            )}
            {showAlerts.error && error && (
                <Alert variant="danger" dismissible onClose={() => dismissAlert('error')} className="d-flex align-items-center">
                    <FaExclamationTriangle className="me-2" />
                    <div>{error}</div>
                </Alert>
            )}

            <div className="mb-4">
                <h2>Categories</h2>
                <Button 
                    variant="success" 
                    onClick={() => setShowCategoryModal(true)}
                    className="mb-3"
                >
                    Add New Category
                </Button>
                <Button 
                    variant="info" 
                    onClick={() => {
                        console.log('🔄 Manual refresh triggered');
                        fetchCategories();
                    }}
                    className="mb-3 ms-2"
                >
                    Refresh Categories
                </Button>
                <Table responsive striped bordered hover className="shadow-sm">
                    <thead className="table-dark">
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map(category => (
                            <tr key={category.id}>
                                <td>{category.name}</td>
                                <td>{category.description}</td>
                                <td>
                                    <Button 
                                        variant="outline-primary" 
                                        size="sm" 
                                        className="me-2"
                                        onClick={() => {
                                            setCategoryFormData({
                                                id: category.id,
                                                name: category.name,
                                                description: category.description
                                            });
                                            setShowCategoryModal(true);
                                        }}
                                    >
                                        <FaEdit />
                                    </Button>
                                    <Button 
                                        variant="outline-danger" 
                                        size="sm"
                                        onClick={() => handleCategoryDelete(category.id)}
                                    >
                                        <FaTrash />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
            
            <div className="mb-4">
                <h2>Carousel Images</h2>
                <Button 
                    variant="success" 
                    onClick={() => {
                        setCarouselFormData({
                            imageUrl: '',
                            title: '',
                            subtitle: '',
                            displayOrder: carouselImages.length + 1,
                            active: true
                        });
                        setShowCarouselModal(true);
                    }}
                    className="mb-3"
                >
                    Add New Carousel Image
                </Button>
                <Table responsive striped bordered hover className="shadow-sm">
                    <thead className="table-dark">
                        <tr>
                            <th>Image</th>
                            <th>Title</th>
                            <th>Subtitle</th>
                            <th>Order</th>
                            <th>Active</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {carouselImages.map(image => (
                            <tr key={image.id}>
                                <td>
                                    <img 
                                        src={image.imageUrl} 
                                        alt={image.title || 'Carousel image'} 
                                        style={{ width: '100px', height: '50px', objectFit: 'cover' }}
                                    />
                                </td>
                                <td>{image.title}</td>
                                <td>{image.subtitle}</td>
                                <td>{image.displayOrder}</td>
                                <td>{image.active ? 'Yes' : 'No'}</td>
                                <td>
                                    <Button 
                                        variant="outline-primary" 
                                        size="sm" 
                                        className="me-2"
                                        onClick={() => {
                                            setCarouselFormData({
                                                id: image.id,
                                                imageUrl: image.imageUrl,
                                                title: image.title,
                                                subtitle: image.subtitle,
                                                displayOrder: image.displayOrder,
                                                active: image.active
                                            });
                                            setShowCarouselModal(true);
                                        }}
                                    >
                                        <FaEdit />
                                    </Button>
                                    <Button 
                                        variant="outline-danger" 
                                        size="sm"
                                        onClick={() => handleCarouselDelete(image.id)}
                                    >
                                        <FaTrash />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            <h2>Products</h2>
            <Table responsive striped bordered hover className="shadow-sm">
                <thead className="table-dark">
                    <tr>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Category</th>
                        <th>Featured</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => (
                        <tr key={product.id}>
                            <td>
                                <img 
                                    src={product.mainImageUrl} 
                                    alt={product.name} 
                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                />
                            </td>
                            <td>{product.name}</td>
                            <td>{product.description}</td>
                            <td>${product.price}</td>
                            <td>{product.stockQuantity}</td>
                            <td>
                                {product.category ? (
                                    <span>{product.category.name}</span>
                                ) : (
                                    <span className="text-danger">None (Category not set)</span>
                                )}
                            </td>
                            <td>{product.featured ? 'Yes' : 'No'}</td>
                            <td>
                                <Button 
                                    variant="outline-primary" 
                                    size="sm" 
                                    className="me-2"
                                    onClick={() => handleEdit(product)}
                                >
                                    <FaEdit />
                                </Button>
                                <Button 
                                    variant="outline-danger" 
                                    size="sm"
                                    onClick={() => handleDelete(product.id)}
                                >
                                    <FaTrash />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editingProduct ? 'Edit Product' : 'Add New Product'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Product Name</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter product name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    name: e.target.value
                                }))}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                placeholder="Enter product description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    description: e.target.value
                                }))}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Price</Form.Label>
                            <Form.Control
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                required
                                step="0.01"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Image URL</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter image URL"
                                value={formData.mainImageUrl}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    mainImageUrl: e.target.value
                                }))}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Stock Quantity</Form.Label>
                            <Form.Control
                                type="number"
                                name="stockQuantity"
                                value={formData.stockQuantity}
                                onChange={handleInputChange}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Category</Form.Label>
                            <Form.Select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={(e) => {
                                    console.log('Category selected:', e.target.value);
                                    setFormData(prev => ({
                                        ...prev,
                                        categoryId: e.target.value
                                    }));
                                }}
                                required
                            >
                                <option value="">Select a category</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                name="featured"
                                label="Featured Product"
                                checked={formData.featured}
                                onChange={handleInputChange}
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={() => setShowModal(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" disabled={loading}>
                                {loading ? 'Saving...' : (editingProduct ? 'Update' : 'Add') + ' Product'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Category Modal */}
            <Modal show={showCategoryModal} onHide={() => {
                setShowCategoryModal(false);
                setCategoryFormData({ name: '', description: '' });
            }}>
                <Modal.Header closeButton>
                    <Modal.Title>{categoryFormData.id ? 'Edit Category' : 'Add New Category'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleCategorySubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Category Name</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter category name"
                                value={categoryFormData.name}
                                onChange={(e) => setCategoryFormData(prev => ({
                                    ...prev,
                                    name: e.target.value
                                }))}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Enter category description"
                                value={categoryFormData.description}
                                onChange={(e) => setCategoryFormData(prev => ({
                                    ...prev,
                                    description: e.target.value
                                }))}
                                required
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={() => {
                                setShowCategoryModal(false);
                                setCategoryFormData({ name: '', description: '' });
                            }}>
                                Cancel
                            </Button>
                            <Button variant="success" type="submit" disabled={loading}>
                                {loading ? 'Saving...' : (categoryFormData.id ? 'Update' : 'Add') + ' Category'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Carousel Modal */}
            <Modal show={showCarouselModal} onHide={() => {
                setShowCarouselModal(false);
                setCarouselFormData({
                    imageUrl: '',
                    title: '',
                    subtitle: '',
                    displayOrder: 0,
                    active: true
                });
            }}>
                <Modal.Header closeButton>
                    <Modal.Title>{carouselFormData.id ? 'Edit Carousel Image' : 'Add New Carousel Image'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleCarouselSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Image URL</Form.Label>
                            <Form.Control
                                type="text"
                                value={carouselFormData.imageUrl}
                                onChange={(e) => setCarouselFormData(prev => ({
                                    ...prev,
                                    imageUrl: e.target.value
                                }))}
                                required
                                placeholder="https://example.com/image.jpg"
                            />
                            <Form.Text className="text-muted">
                                Recommended size: 1200x400 pixels
                            </Form.Text>
                        </Form.Group>
                        
                        {carouselFormData.imageUrl && (
                            <div className="mb-3 text-center">
                                <img 
                                    src={carouselFormData.imageUrl} 
                                    alt="Preview" 
                                    style={{ 
                                        maxWidth: '100%', 
                                        maxHeight: '200px', 
                                        objectFit: 'cover'
                                    }}
                                />
                            </div>
                        )}
                        
                        <Form.Group className="mb-3">
                            <Form.Label>Title</Form.Label>
                            <Form.Control
                                type="text"
                                value={carouselFormData.title}
                                onChange={(e) => setCarouselFormData(prev => ({
                                    ...prev,
                                    title: e.target.value
                                }))}
                                placeholder="Optional title text"
                            />
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                            <Form.Label>Subtitle</Form.Label>
                            <Form.Control
                                type="text"
                                value={carouselFormData.subtitle}
                                onChange={(e) => setCarouselFormData(prev => ({
                                    ...prev,
                                    subtitle: e.target.value
                                }))}
                                placeholder="Optional subtitle text"
                            />
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                            <Form.Label>Display Order</Form.Label>
                            <Form.Control
                                type="number"
                                value={carouselFormData.displayOrder}
                                onChange={(e) => setCarouselFormData(prev => ({
                                    ...prev,
                                    displayOrder: parseInt(e.target.value) || 0
                                }))}
                                min="0"
                            />
                            <Form.Text className="text-muted">
                                Lower numbers appear first
                            </Form.Text>
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Active (visible on homepage)"
                                checked={carouselFormData.active}
                                onChange={(e) => setCarouselFormData(prev => ({
                                    ...prev,
                                    active: e.target.checked
                                }))}
                            />
                        </Form.Group>
                        
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={() => {
                                setShowCarouselModal(false);
                                setCarouselFormData({
                                    imageUrl: '',
                                    title: '',
                                    subtitle: '',
                                    displayOrder: 0,
                                    active: true
                                });
                            }}>
                                Cancel
                            </Button>
                            <Button variant="success" type="submit" disabled={loading}>
                                {loading ? 'Saving...' : (carouselFormData.id ? 'Update' : 'Add') + ' Image'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => {
                setShowDeleteModal(false);
                setProductToDelete(null);
            }} centered>
                <Modal.Header closeButton className="bg-danger text-white">
                    <Modal.Title>
                        <FaExclamationTriangle className="me-2" />
                        Confirm Delete
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="text-center mb-4">
                        <FaTrash size={48} className="text-danger mb-3" />
                        <h4>Are you sure?</h4>
                        <p className="text-muted">
                            You are about to delete this {deleteType}. This action cannot be undone.
                        </p>
                    </div>
                    {deleteType === 'product' && products.find(p => p.id === productToDelete) && (
                        <div className="d-flex align-items-center border p-2 rounded">
                            <img 
                                src={products.find(p => p.id === productToDelete).mainImageUrl} 
                                alt="Product" 
                                style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                className="me-3"
                            />
                            <div>
                                <h5 className="mb-0">{products.find(p => p.id === productToDelete).name}</h5>
                                <p className="text-muted mb-0">Price: ${products.find(p => p.id === productToDelete).price}</p>
                            </div>
                        </div>
                    )}
                    {deleteType === 'category' && categories.find(c => c.id === productToDelete) && (
                        <div className="border p-2 rounded">
                            <h5>{categories.find(c => c.id === productToDelete).name}</h5>
                            <p className="text-muted mb-0">{categories.find(c => c.id === productToDelete).description}</p>
                        </div>
                    )}
                    {deleteType === 'carousel' && carouselImages.find(c => c.id === productToDelete) && (
                        <div className="border p-2 rounded">
                            <img 
                                src={carouselImages.find(c => c.id === productToDelete).imageUrl} 
                                alt="Carousel" 
                                style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                                className="mb-2 rounded"
                            />
                            <h5>{carouselImages.find(c => c.id === productToDelete).title}</h5>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => {
                        setShowDeleteModal(false);
                        setProductToDelete(null);
                    }}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmDelete} disabled={loading}>
                        {loading ? 'Deleting...' : 'Delete Permanently'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default Admin; 