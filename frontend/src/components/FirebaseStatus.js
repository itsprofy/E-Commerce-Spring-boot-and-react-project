import React, { useState, useEffect } from 'react';
import { Alert, Card, Badge, Button } from 'react-bootstrap';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

function FirebaseStatus() {
    const [firebaseStatus, setFirebaseStatus] = useState({
        app: false,
        auth: false,
        db: false,
        storage: false,
        functions: false,
        analytics: false
    });
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkFirebaseServices();
    }, []);

    const checkFirebaseServices = async () => {
        setLoading(true);
        setErrors([]);
        
        try {
            // Import Firebase services
            const { app, auth, db, storage, functions, analytics } = await import('../firebase');
            
            const status = {
                app: !!app,
                auth: !!auth,
                db: !!db,
                storage: !!storage,
                functions: !!functions,
                analytics: !!analytics
            };
            
            setFirebaseStatus(status);
            
            // Test basic connectivity
            const testResults = [];
            
            // Test Firestore connection
            try {
                const { collection, getDocs } = await import('firebase/firestore');
                await getDocs(collection(db, 'test'));
                testResults.push('✅ Firestore connection successful');
            } catch (error) {
                testResults.push(`❌ Firestore error: ${error.message}`);
                setErrors(prev => [...prev, `Firestore: ${error.message}`]);
            }
            
            // Test Auth
            try {
                console.log('Auth current user:', auth.currentUser);
                testResults.push('✅ Firebase Auth accessible');
            } catch (error) {
                testResults.push(`❌ Auth error: ${error.message}`);
                setErrors(prev => [...prev, `Auth: ${error.message}`]);
            }
            
            console.log('Firebase Service Tests:', testResults);
            
        } catch (error) {
            console.error('Firebase initialization error:', error);
            setErrors([`Initialization error: ${error.message}`]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (service, isWorking) => {
        return (
            <Badge 
                bg={isWorking ? 'success' : 'danger'} 
                className="me-2 mb-1"
                style={{ fontSize: '0.8em' }}
            >
                {isWorking ? <FaCheckCircle className="me-1" /> : <FaExclamationTriangle className="me-1" />}
                {service}
            </Badge>
        );
    };

    if (loading) {
        return (
            <Alert variant="info" className="d-flex align-items-center">
                <FaInfoCircle className="me-2" />
                <div>Checking Firebase services...</div>
            </Alert>
        );
    }

    const allServicesWorking = Object.values(firebaseStatus).every(status => status === true);

    return (
        <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Firebase Status</h5>
                <Button variant="outline-primary" size="sm" onClick={checkFirebaseServices}>
                    Refresh
                </Button>
            </Card.Header>
            <Card.Body>
                {allServicesWorking ? (
                    <Alert variant="success" className="d-flex align-items-center">
                        <FaCheckCircle className="me-2" />
                        <div>All Firebase services are working properly!</div>
                    </Alert>
                ) : (
                    <Alert variant="warning" className="d-flex align-items-center">
                        <FaExclamationTriangle className="me-2" />
                        <div>Some Firebase services need attention</div>
                    </Alert>
                )}

                <div className="mb-3">
                    <strong>Service Status:</strong>
                    <div className="mt-2">
                        {getStatusBadge('App', firebaseStatus.app)}
                        {getStatusBadge('Auth', firebaseStatus.auth)}
                        {getStatusBadge('Firestore', firebaseStatus.db)}
                        {getStatusBadge('Storage', firebaseStatus.storage)}
                        {getStatusBadge('Functions', firebaseStatus.functions)}
                        {getStatusBadge('Analytics', firebaseStatus.analytics)}
                    </div>
                </div>

                {errors.length > 0 && (
                    <div>
                        <strong>Errors:</strong>
                        <ul className="mb-0 mt-2">
                            {errors.map((error, index) => (
                                <li key={index} className="text-danger">
                                    {error}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="mt-3">
                    <small className="text-muted">
                        Project: e-commerce-final1 | 
                        Environment: {process.env.NODE_ENV || 'development'}
                    </small>
                </div>
            </Card.Body>
        </Card>
    );
}

export default FirebaseStatus; 