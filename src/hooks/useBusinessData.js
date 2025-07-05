// hooks/useBusinessData.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuthData } from '../utils/auth';
import { transformBusinessData, getErrorMessage } from '../utils/analysisHelpers';

export const useBusinessData = (businessName) => {
  const [businessData, setBusinessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const { userId, latestVersion, token } = getAuthData();

  // Function to fetch business data with translation
  const fetchBusinessData = async (language = 'en') => {
    try {
      setIsTranslating(true);
      
      // Use the translated API endpoint
      const response = await axios.post(`${API_BASE_URL}/api/get-user-response-translated`, {
        user_id: userId,
        version: latestVersion || '1.0',
        language: language
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = response.data;
      const transformedData = transformBusinessData(data, businessName);
      
      setBusinessData(transformedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching business data:', err);
      setError(getErrorMessage(err));
    } finally {
      setIsTranslating(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const initializeFetch = async () => {
      setLoading(true);
      const currentLanguage = window.currentAppLanguage || 'en';
      await fetchBusinessData(currentLanguage);
      setLoading(false);
    };

    initializeFetch();
  }, [businessName, userId, latestVersion, token, API_BASE_URL]);

  // Handle language changes
  useEffect(() => {
    const handleLanguageChange = async (event) => {
      const { language } = event.detail;
      await fetchBusinessData(language);
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, []);

  return { 
    businessData, 
    setBusinessData, 
    loading: loading || isTranslating, 
    error 
  };
};