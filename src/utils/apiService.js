import axios from 'axios';
import { getAuthData } from './auth';

class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_BACKEND_URL;
    this.authData = getAuthData();
    this.isOnline = navigator.onLine;
    this.pendingSaves = [];
    
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  handleOnline() {
    this.isOnline = true;
    console.log('Connection restored. Processing pending saves...');
    this.processPendingSaves();
  }

  handleOffline() {
    this.isOnline = false;
    console.log('Connection lost. Saves will be queued.');
  }

  getHeaders() {
    const authData = getAuthData();
    return {
      'Authorization': `Bearer ${authData.token}`,
      'Content-Type': 'application/json'
    };
  }

  async saveAnswers(businessData) {
    // Create the save request data
    const saveData = this.prepareSaveData(businessData);
    
    if (!this.isOnline) {
      // Queue the save for when connection is restored
      this.queueSave(saveData);
      throw new Error('No internet connection. Save queued for when connection is restored.');
    }

    try {
      const response = await this.performSave(saveData);
      console.log('Save successful:', response.data);
      return response;
    } catch (error) {
      console.error('Save failed:', error);
      
      // If it's a network error, queue the save
      if (this.isNetworkError(error)) {
        this.queueSave(saveData);
        throw new Error('Network error. Save queued for retry.');
      }
      
      throw error;
    }
  }

  prepareSaveData(businessData) {
    const answersArray = [];
    
    businessData.categories.forEach(category => {
      category.questions.forEach(question => {
        answersArray.push({
          question_id: question.id,
          answer: question.answer || '',
          selected_option: '',
          selected_options: [],
          rating: null
        });
      });
    });

    return {
      version: this.authData.latestVersion || '1.0',
      answers: answersArray,
      timestamp: new Date().toISOString(),
      businessId: businessData.id || businessData.name
    };
  }

  async performSave(saveData) {
    return axios.post(`${this.baseURL}/api/survey/submit`, saveData, {
      headers: this.getHeaders(),
      timeout: 10000 // 10 second timeout
    });
  }

  queueSave(saveData) {
    // Remove any existing save for the same business to avoid duplicates
    this.pendingSaves = this.pendingSaves.filter(
      save => save.businessId !== saveData.businessId
    );
    
    // Add the new save to the queue
    this.pendingSaves.push(saveData);
    console.log('Save queued. Pending saves:', this.pendingSaves.length);
  }

  async processPendingSaves() {
    if (this.pendingSaves.length === 0) return;

    console.log(`Processing ${this.pendingSaves.length} pending saves...`);
    
    const saves = [...this.pendingSaves];
    this.pendingSaves = [];

    for (const saveData of saves) {
      try {
        await this.performSave(saveData);
        console.log('Pending save processed successfully for business:', saveData.businessId);
      } catch (error) {
        console.error('Failed to process pending save:', error);
        // Re-queue if it fails again
        this.queueSave(saveData);
      }
    }
  }

  isNetworkError(error) {
    return (
      !error.response || // No response received
      error.code === 'NETWORK_ERROR' ||
      error.code === 'ECONNABORTED' ||
      (error.response && error.response.status >= 500) // Server errors
    );
  }

  // Method to manually retry pending saves
  async retryPendingSaves() {
    if (!this.isOnline) {
      throw new Error('No internet connection');
    }
    
    await this.processPendingSaves();
  }

  // Method to get pending saves count
  getPendingSavesCount() {
    return this.pendingSaves.length;
  }

  // Method to clear all pending saves (use with caution)
  clearPendingSaves() {
    this.pendingSaves = [];
  }
}

export const apiService = new ApiService();