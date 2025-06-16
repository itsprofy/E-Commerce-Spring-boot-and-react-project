import React, { useState, useEffect } from 'react';
import { Modal, Table, Badge, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { format } from 'date-fns';

function OrderDetailsModal({ show, onHide, orderId, userId }) {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (show && orderId) {
            fetchOrderDetails();
        }
    }, [show, orderId]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:8081/api/orders/${orderId}`, {
                params: { userId }
            });
            setOrder(response.data);
        } catch (error) {
            console.error('Error fetching order details:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            'PENDING': 'warning',
            'PAID': 'success',
            'SHIPPED': 'info',
            'DELIVERED': 'primary',
            'CANCELLED': 'danger'
        };
        return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
    };

    if (!show) return null;

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Order Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                    </div>
                ) : order ? (
                    <>
                        <div className="mb-4">
                            <h5>Order Information</h5>
                            <Table>
                                <tbody>
                                    <tr>
                                        <td><strong>Order ID:</strong></td>
                                        <td>{order.id}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Date:</strong></td>
                                        <td>{format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Status:</strong></td>
                                        <td>{getStatusBadge(order.status)}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Total Amount:</strong></td>
                                        <td>${order.total.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </Table>
                        </div>

                        <div className="mb-4">
                            <h5>Shipping Information</h5>
                            <Table>
                                <tbody>
                                    <tr>
                                        <td><strong>Name:</strong></td>
                                        <td>{order.shippingName}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Address:</strong></td>
                                        <td>{order.shippingAddress}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>City:</strong></td>
                                        <td>{order.shippingCity}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>State:</strong></td>
                                        <td>{order.shippingState}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>ZIP Code:</strong></td>
                                        <td>{order.shippingZip}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Country:</strong></td>
                                        <td>{order.shippingCountry}</td>
                                    </tr>
                                </tbody>
                            </Table>
                        </div>

                        <div>
                            <h5>Order Items</h5>
                            <Table responsive>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Price</th>
                                        <th>Quantity</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.orderItems.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.product.name}</td>
                                            <td>${item.price.toFixed(2)}</td>
                                            <td>{item.quantity}</td>
                                            <td>${(item.price * item.quantity).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-muted">Order details not found</p>
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
}

export default OrderDetailsModal; 