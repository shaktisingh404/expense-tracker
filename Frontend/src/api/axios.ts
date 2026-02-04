// src/api/axios.js
import axios from 'axios';

// 1. Point to your Django Backend
const api = axios.create({
    baseURL: 'http://localhost:8000/api', // Adjust if your Django port is different
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;