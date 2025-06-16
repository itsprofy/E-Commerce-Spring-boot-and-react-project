/**
 * Configuration file for Firebase Functions
 * This helps manage environment variables for different environments
 */

// For local development, use dotenv to load environment variables
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Export configuration
module.exports = {
  cors: {
    // Add allowed origins for production
    allowedOrigins: [
      'https://your-project.web.app',
      'https://your-project.firebaseapp.com'
    ]
  }
}; 