import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import setupAxiosInterceptors from './utils/axiosConfig.js'
import '@hackernoon/pixel-icon-library/fonts/iconfont.css'

// Initialize axios interceptors
setupAxiosInterceptors();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
