import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import axios from 'axios';
import AuthProvider from './AuthContext'; // Import the new AuthContext

ReactDOM.render(
  <React.StrictMode>
    <AuthProvider> {/* Wrap the app */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
