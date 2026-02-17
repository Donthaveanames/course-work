import Menu from './Menu'
import { BrowserRouter as Router } from 'react-router-dom';
import React, { useEffect } from 'react';
import axios from 'axios';


export default function App() {
    useEffect(() => {
        axios.get('http://localhost:8000/')
            .then(response => {
                console.log('Server connected:', response.data);
            })
            .catch(error => {
                console.error('Server connection failed:', error);
            });
    }, []);

    return (
        <Router>
            <Menu />
        </Router>
    );
}
