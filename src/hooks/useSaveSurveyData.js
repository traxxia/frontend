import { useState, useEffect } from 'react';
import axios from 'axios';

const useSaveSurveyData = () => {
  const [surveyData, setSurveyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  // Get authentication token
  const getAuthToken = () => sessionStorage.getItem('token');
  
  // Get user ID
  const getUserId = () => sessionStorage.getItem('userId');

  // Fetch user's survey data
  const fetchSurveyData = async (version = null) => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      const userId = getUserId();

      if (!token || !userId) {
        throw new Error('Authentication required');
      }

      // Get the latest version if not specified
      let targetVersion = version;
      if (!targetVersion) {
        targetVersion = sessionStorage.getItem('latestVersion') || 'latest';
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/get-user-response`,
        {
          user_id: userId,
          version: targetVersion
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = response.data;

      // Format survey data for saving
      const formattedSurveyData = {
        version: data.survey.version,
        questions: data.categories.flatMap(category => 
          category.questions.map(question => ({
            id: question.question_id,
            question: question.question_text,
            type: question.question_type,
            category_id: category.category_id,
            category_name: category.category_name,
            options: question.options,
            nested: question.nested
          }))
        ),
        answers: data.categories.flatMap(category =>
          category.questions
            .filter(question => question.answered)
            .map(question => ({
              question_id: question.question_id,
              answer: question.user_answer?.answer,
              selected_option: question.user_answer?.selected_option,
              selected_options: question.user_answer?.selected_options,
              rating: question.user_answer?.rating
            }))
        ),
        completion_percentage: Math.round(
          (data.survey.total_answered / data.survey.total_questions) * 100
        ),
        submitted_at: data.survey.submitted_at,
        user: data.user,
        status: data.survey.status
      };

      setSurveyData(formattedSurveyData);
      return formattedSurveyData;

    } catch (err) {
      console.error('Error fetching survey data:', err);
      setError(err.response?.data?.message || err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch survey data on mount
  useEffect(() => {
    fetchSurveyData();
  }, []);

  return {
    surveyData,
    loading,
    error,
    fetchSurveyData,
    refetch: fetchSurveyData
  };
};

export default useSaveSurveyData;