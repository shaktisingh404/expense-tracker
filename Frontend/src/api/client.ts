// src/api/client.ts
import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:8000/api', // Match your Django port
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;