import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const BusinessContext = createContext();

export const useBusiness = () => {
    const context = useContext(BusinessContext);
    if (!context) {
        throw new Error('useBusiness must be used within a BusinessProvider');
    }
    return context;
};

export const BusinessProvider = ({ children }) => {
    const [businesses, setBusinesses] = useState([]);
    const [collaboratingBusinesses, setCollaboratingBusinesses] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

    const fetchBusinesses = useCallback(async () => {
        const token = sessionStorage.getItem('token');
        if (!token) return;

        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/businesses`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                const data = response.data;
                const collabList = data.collaboratingBusinesses || data.collaborating_businesses || [];
                setBusinesses(data.businesses || []);
                setCollaboratingBusinesses(Array.isArray(collabList) ? collabList : []);
                setError(null);
            }
        } catch (err) {
            console.error('Error fetching businesses in context:', err);
            setError(err.response?.data?.error || 'Failed to load businesses');
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);

    // Update selected business and persist it if needed
    const selectBusiness = (business) => {
        setSelectedBusiness(business);
        if (business) {
            sessionStorage.setItem('lastSelectedBusinessId', business._id);
        } else {
            sessionStorage.removeItem('lastSelectedBusinessId');
        }
    };

    // Try to restore selection from session storage or URL if possible
    useEffect(() => {
        if (businesses.length > 0 && !selectedBusiness) {
            const lastId = sessionStorage.getItem('lastSelectedBusinessId');
            if (lastId) {
                const all = [...businesses, ...collaboratingBusinesses];
                const last = all.find(b => b._id === lastId);
                if (last) {
                    setSelectedBusiness(last);
                }
            }
        }
    }, [businesses, collaboratingBusinesses, selectedBusiness]);

    return (
        <BusinessContext.Provider value={{
            businesses,
            collaboratingBusinesses,
            selectedBusiness,
            loading,
            error,
            fetchBusinesses,
            selectBusiness,
            setSelectedBusiness // Export setter directly for flexibility
        }}>
            {children}
        </BusinessContext.Provider>
    );
};
