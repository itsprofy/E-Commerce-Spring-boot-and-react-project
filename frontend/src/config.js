// Configuration for different environments
const config = {
    // Firebase configuration will be handled in firebase.js
    
    // Stripe public key
    STRIPE_PUBLIC_KEY: process.env.REACT_APP_STRIPE_PUBLIC_KEY || 'pk_test_yourStripePublicKey',
    
    // Other configuration settings
    APP_NAME: 'E-Commerce Store',
    PAGINATION_PAGE_SIZE: 10,
    DEFAULT_CURRENCY: 'USD',
    
    // API URLs - will be replaced with Firebase functions or Firestore
    // Keeping for backwards compatibility during migration
    API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8081/api',
    
    // Feature flags
    ENABLE_COMMENTS: true,
    ENABLE_QUESTIONS: true,
    ENABLE_PAYMENTS: true,
    USE_FIREBASE: true  // Flag to switch between REST API and Firebase
};

export default config; 