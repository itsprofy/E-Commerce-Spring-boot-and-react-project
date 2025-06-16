import React, { useState, useEffect } from 'react';
import { Alert, Card, Button, Spinner } from 'react-bootstrap';

function FirebaseTest() {
    const [testResults, setTestResults] = useState([]);
    const [testing, setTesting] = useState(false);

    const runTest = async () => {
        setTesting(true);
        setTestResults([]);
        const results = [];

        try {
            // Test 1: Import Firebase modules
            results.push('✅ Step 1: Importing Firebase modules...');
            const { initializeApp } = await import('firebase/app');
            const { getFirestore, connectFirestoreEmulator } = await import('firebase/firestore');
            const { getAuth } = await import('firebase/auth');
            const { getStorage } = await import('firebase/storage');
            const { getFunctions } = await import('firebase/functions');
            results.push('✅ Step 1: Firebase modules imported successfully');

            // Test 2: Firebase configuration
            results.push('✅ Step 2: Checking Firebase configuration...');
            const firebaseConfig = {
                apiKey: "AIzaSyAEL8i_7LA3YWY-c9By3jIko4fClPdQEmY",
                authDomain: "e-commerce-final1.firebaseapp.com",
                projectId: "e-commerce-final1",
                storageBucket: "e-commerce-final1.firebasestorage.app",
                messagingSenderId: "673744857020",
                appId: "1:673744857020:web:d1e815b067fc8de956adb9",
                measurementId: "G-TKZHD2E98E"
            };
            results.push('✅ Step 2: Firebase configuration loaded');

            // Test 3: Initialize Firebase
            results.push('✅ Step 3: Initializing Firebase app...');
            const app = initializeApp(firebaseConfig);
            results.push('✅ Step 3: Firebase app initialized successfully');

            // Test 4: Initialize services
            results.push('✅ Step 4: Initializing Firebase services...');
            
            try {
                const auth = getAuth(app);
                results.push('✅ Step 4a: Auth service initialized');
            } catch (error) {
                results.push(`❌ Step 4a: Auth service failed - ${error.message}`);
            }

            try {
                const db = getFirestore(app);
                results.push('✅ Step 4b: Firestore service initialized');
                
                // Test 5: Test Firestore connection
                results.push('✅ Step 5: Testing Firestore connection...');
                const { collection, getDocs } = await import('firebase/firestore');
                await getDocs(collection(db, 'test'));
                results.push('✅ Step 5: Firestore connection successful');
            } catch (error) {
                results.push(`❌ Step 4b/5: Firestore failed - ${error.message}`);
                console.error('Firestore detailed error:', error);
            }

            try {
                const storage = getStorage(app);
                results.push('✅ Step 4c: Storage service initialized');
            } catch (error) {
                results.push(`❌ Step 4c: Storage service failed - ${error.message}`);
            }

            try {
                const functions = getFunctions(app);
                results.push('✅ Step 4d: Functions service initialized');
            } catch (error) {
                results.push(`❌ Step 4d: Functions service failed - ${error.message}`);
            }

        } catch (error) {
            results.push(`❌ Critical Error: ${error.message}`);
            console.error('Critical Firebase error:', error);
        }

        setTestResults(results);
        setTesting(false);
    };

    useEffect(() => {
        runTest();
    }, []);

    return (
        <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">🔍 Firebase Connection Test</h5>
                <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={runTest}
                    disabled={testing}
                >
                    {testing ? <Spinner size="sm" /> : 'Re-run Test'}
                </Button>
            </Card.Header>
            <Card.Body>
                {testing ? (
                    <div className="text-center">
                        <Spinner animation="border" />
                        <div>Running Firebase tests...</div>
                    </div>
                ) : (
                    <div>
                        <strong>Test Results:</strong>
                        <div className="mt-2" style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
                            {testResults.map((result, index) => (
                                <div 
                                    key={index} 
                                    className={result.includes('❌') ? 'text-danger' : 'text-success'}
                                >
                                    {result}
                                </div>
                            ))}
                        </div>
                        
                        <Alert variant="info" className="mt-3">
                            <strong>Instructions:</strong>
                            <ol className="mb-0 mt-2">
                                <li>Check the test results above for any ❌ errors</li>
                                <li>Open browser console (F12) to see detailed error messages</li>
                                <li>Share both the test results and console errors</li>
                            </ol>
                        </Alert>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}

export default FirebaseTest; 