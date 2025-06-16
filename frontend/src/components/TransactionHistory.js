import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Form, Button, Spinner, Badge, Alert } from 'react-bootstrap';
import { FaSearch, FaSort, FaDownload, FaShoppingBag, FaCreditCard } from 'react-icons/fa';
import axios from 'axios';
import { format } from 'date-fns';
import OrderDetailsModal from './OrderDetailsModal';
import { useFirebase } from '../contexts/FirebaseContext';

function TransactionHistory() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [sortField, setSortField] = useState('processedAt');
    const [sortDirection, setSortDirection] = useState('DESC');
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [error, setError] = useState('');
    const { user } = useFirebase();

    useEffect(() => {
        if (user) {
            fetchTransactions();
        } else {
            setLoading(false);
        }
    }, [currentPage, sortField, sortDirection, user]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            setError('');
            
            // In a real app, we would fetch from Firebase or backend
            // This is a placeholder for demonstration
            
            // Mock empty transactions for now
            setTransactions([]);
            setTotalPages(0);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            setError('Failed to load transaction history. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (field) => {
        if (field === sortField) {
            setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
        } else {
            setSortField(field);
            setSortDirection('DESC');
        }
    };

    const handleDateRangeChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFilter = () => {
        setCurrentPage(0);
        fetchTransactions();
    };

    const handleExport = () => {
        // Placeholder for CSV export functionality
        console.log('Export functionality to be implemented');
    };

    const getStatusBadge = (status) => {
        const variants = {
            'COMPLETED': 'success',
            'PENDING': 'warning',
            'FAILED': 'danger'
        };
        return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
    };

    const handleViewOrder = (orderId) => {
        setSelectedOrder(orderId);
        setShowOrderModal(true);
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

    if (!user) {
        return (
            <Container className="py-5">
                <Alert variant="warning">
                    Please log in to view your transaction history.
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="py-5">
            <Card className="border-0 shadow-sm">
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2 className="mb-0">Transaction History</h2>
                        <Button variant="outline-primary" onClick={handleExport} disabled={transactions.length === 0}>
                            <FaDownload className="me-2" />
                            Export CSV
                        </Button>
                    </div>

                    {error && (
                        <Alert variant="danger" className="mb-4">
                            {error}
                        </Alert>
                    )}

                    {/* Filters */}
                    <Row className="mb-4">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Start Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="startDate"
                                    value={dateRange.startDate}
                                    onChange={handleDateRangeChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>End Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="endDate"
                                    value={dateRange.endDate}
                                    onChange={handleDateRangeChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4} className="d-flex align-items-end">
                            <Button variant="primary" onClick={handleFilter} className="w-100">
                                <FaSearch className="me-2" />
                                Filter
                            </Button>
                        </Col>
                    </Row>

                    {transactions.length === 0 ? (
                        <div className="text-center py-5">
                            <FaShoppingBag size={50} className="text-muted mb-3" />
                            <h4 className="text-muted">No transactions found</h4>
                            <p className="text-muted">
                                You haven't made any purchases yet. Start shopping to see your transaction history here.
                            </p>
                            <Button variant="primary" onClick={() => window.location.href = '/products'}>
                                Browse Products
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Transactions Table */}
                            <Table responsive>
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
                                            Transaction ID <FaSort />
                                        </th>
                                        <th onClick={() => handleSort('processedAt')} style={{ cursor: 'pointer' }}>
                                            Date <FaSort />
                                        </th>
                                        <th onClick={() => handleSort('amount')} style={{ cursor: 'pointer' }}>
                                            Amount <FaSort />
                                        </th>
                                        <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                                            Status <FaSort />
                                        </th>
                                        <th>Payment Method</th>
                                        <th>Order Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map(transaction => (
                                        <tr key={transaction.id}>
                                            <td>{transaction.transactionReference}</td>
                                            <td>{format(new Date(transaction.processedAt), 'MMM dd, yyyy HH:mm')}</td>
                                            <td>${transaction.amount.toFixed(2)}</td>
                                            <td>{getStatusBadge(transaction.status)}</td>
                                            <td>
                                                {transaction.paymentMethod}
                                                {transaction.maskedCardNumber && (
                                                    <small className="text-muted d-block">
                                                        {transaction.maskedCardNumber}
                                                    </small>
                                                )}
                                            </td>
                                            <td>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    onClick={() => handleViewOrder(transaction.orderId)}
                                                >
                                                    View Order
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>

                            {/* Pagination */}
                            <div className="d-flex justify-content-center mt-4">
                                <Button
                                    variant="outline-primary"
                                    className="me-2"
                                    disabled={currentPage === 0}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline-primary"
                                    disabled={currentPage === totalPages - 1}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </>
                    )}
                </Card.Body>
            </Card>

            {/* Order Details Modal */}
            <OrderDetailsModal
                show={showOrderModal}
                onHide={() => setShowOrderModal(false)}
                orderId={selectedOrder}
                userId={user?.uid}
            />
        </Container>
    );
}

export default TransactionHistory; 