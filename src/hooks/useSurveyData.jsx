import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const useSurveyData = (questionsData) => {
  const [categories, setCategories] = useState([]);
  const [answers, setAnswers] = useState({});

  // Initialize survey data
  useEffect(() => {
    const setupQuestions = () => {
      try {
        setCategories(questionsData);

        const initialAnswers = {};
        questionsData.forEach((category) => {
          category.questions.forEach((question) => {
            initialAnswers[question.id] = {
              description: "",
              selectedOption: question.type === "options" ? "" : null,
            };
          });
        });
        setAnswers(initialAnswers);
      } catch (error) {
        console.error("Error setting up questions:", error);
      }
    };

    setupQuestions();
  }, [questionsData]);

  // Helper function to convert formatted text to HTML
  const convertFormattedTextToHTML = (text) => {
    if (!text) return "";
    
    // First, handle any escaped newlines
    let converted = text.replace(/\\n/g, '\n');

    // Split the text into lines
    const lines = converted.split('\n');
    let formattedContent = '';
    let inOrderedList = false;
    let inUnorderedList = false;
    let previousNumberedValue = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) continue;

      const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);

      if (numberedMatch) {
        const currentNumber = parseInt(numberedMatch[1], 10);

        if (!inOrderedList || (currentNumber !== previousNumberedValue + 1 && currentNumber !== 1)) {
          if (inOrderedList) {
            formattedContent += '</ol>';
          }

          formattedContent += '<ol>';
          inOrderedList = true;
          inUnorderedList = false;
        }

        formattedContent += `<li>${numberedMatch[2]}</li>`;
        previousNumberedValue = currentNumber;
      } else if (/^[●\*\-•]\s/.test(line)) {
        if (inOrderedList) {
          formattedContent += '</ol>';
          inOrderedList = false;
        }

        if (!inUnorderedList) {
          formattedContent += '<ul>';
          inUnorderedList = true;
        }

        const bulletContent = line.replace(/^[●\*\-•]\s/, '');
        formattedContent += `<li>${bulletContent}</li>`;
      } else {
        if (inOrderedList) {
          formattedContent += '</ol>';
          inOrderedList = false;
        }

        if (inUnorderedList) {
          formattedContent += '</ul>';
          inUnorderedList = false;
        }

        formattedContent += `<p>${line}</p>`;
      }
    }

    if (inOrderedList) {
      formattedContent += '</ol>';
    }

    if (inUnorderedList) {
      formattedContent += '</ul>';
    }

    return formattedContent;
  };

  // Check if a question is completed
  const isQuestionCompleted = useCallback((questionId) => {
    const answer = answers[questionId];
    if (!answer) return false;

    return (
      (answer.description &&
        answer.description.replace(/<(.|\n)*?>/g, "").trim() !== "") ||
      (answer.selectedOption && answer.selectedOption !== "")
    );
  }, [answers]);

  // Check if a category is completed
  const isCategoryCompleted = useCallback((category) => {
    return category.questions.every((question) => isQuestionCompleted(question.id));
  }, [isQuestionCompleted]);

  // UPDATED: Calculate progress based ONLY on 14 frontend questions
  const getProgressPercentage = useCallback(() => {
    // Define your 14 frontend question IDs (from your questions.json)
    const frontendQuestionIds = [
      "1a", "1b", "1c",
      "2a", "2b", 
      "3a", "3b", "3c",
      "4a", "4b", "4c",
      "5a", "5b", "5c"
    ];

    // Count how many of these 14 questions are completed
    const completedQuestions = frontendQuestionIds.filter(questionId => {
      const answer = answers[questionId];
      if (!answer) { 
        return false;
      }
      
      // Check if question has meaningful content
      const cleanDescription = answer.description ? 
        answer.description.replace(/<(.|\n)*?>/g, "").trim() : "";
      
      const hasValidDescription = cleanDescription && cleanDescription.length > 10;
      const hasValidOption = answer.selectedOption && answer.selectedOption !== "";
      
      const isCompleted = hasValidDescription || hasValidOption;     
      
      return isCompleted;
    }); 
    
    return Math.round((completedQuestions.length / 14) * 100);
  }, [answers]);

  // UPDATED: Check if all 14 frontend questions are answered
  const allQuestionsAnswered = useCallback(() => {
    // Same 14 frontend question IDs
    const frontendQuestionIds = [
      "1a", "1b", "1c",
      "2a", "2b", 
      "3a", "3b", "3c",
      "4a", "4b", "4c",
      "5a", "5b", "5c"
    ];

    // Check if ALL 14 questions are completed
    return frontendQuestionIds.every(questionId => {
      const answer = answers[questionId];
      if (!answer) return false;
      
      const cleanDescription = answer.description ? 
        answer.description.replace(/<(.|\n)*?>/g, "").trim() : "";
      
      const hasValidDescription = cleanDescription && cleanDescription.length > 10;
      const hasValidOption = answer.selectedOption && answer.selectedOption !== "";
      
      return hasValidDescription || hasValidOption;
    });
  }, [answers]);

  // Handle option change
  const handleOptionChange = useCallback((questionId, option) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        selectedOption: option,
      },
    }));
  }, []);

  // Handle description change
  const handleDescriptionChange = useCallback((questionId, newDescription) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        description: newDescription,
      },
    }));
  }, []);

  // Fetch saved answers from API - Updated to handle encrypted data from server
  const fetchSavedAnswers = useCallback(async () => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/survey/answers`, {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.answers) {
        // UPDATED: Only load answers for the 14 frontend questions
        const frontendQuestionIds = [
          "1a", "1b", "1c",
          "2a", "2b", 
          "3a", "3b", "3c",
          "4a", "4b", "4c",
          "5a", "5b", "5c"
        ];

        const savedAnswers = {};

        Object.entries(response.data.answers).forEach(([questionId, answer]) => {
          // Only load answers for questions that exist in our frontend questions.json
          if (frontendQuestionIds.includes(questionId)) {
            savedAnswers[questionId] = {
              description: answer.description || "",
              selectedOption: answer.selectedOption || ""
            };
          }
        });
        
        setAnswers(prevAnswers => ({
          ...prevAnswers,
          ...savedAnswers
        }));
 
      }
    } catch (error) {
      console.error("Error fetching saved answers:", error);
      throw error;
    }
  }, []);

  // UPDATED: Save all answers - only save questions with actual content
  const saveAllAnswers = useCallback(async (showToaster = false) => {
    try {
      // Define the 14 frontend questions
      const frontendQuestionIds = [
        "1a", "1b", "1c",
        "2a", "2b", 
        "3a", "3b", "3c",
        "4a", "4b", "4c",
        "5a", "5b", "5c"
      ];

      // Only save frontend questions that have content
      const answersToSave = frontendQuestionIds
        .filter(questionId => {
          const answer = answers[questionId];
          if (!answer) return false;
          
          // Only save if there's actual content
          const hasDescription = answer.description && 
            answer.description.replace(/<(.|\n)*?>/g, "").trim() !== "";
          const hasSelectedOption = answer.selectedOption && 
            answer.selectedOption !== "";
          
          return hasDescription || hasSelectedOption;
        })
        .map(questionId => {
          const answer = answers[questionId];
          let categoryId = "";
          
          for (const category of categories) {
            const foundQuestion = category.questions.find(q => q.id === questionId);
            if (foundQuestion) {
              categoryId = category.id;
              break;
            }
          }

          return {
            question_id: questionId,
            category_id: categoryId,
            selectedOption: answer.selectedOption || "",
            description: answer.description || ""
          };
        });

      if (answersToSave.length === 0) {
        return { message: "No answers to save" };
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/survey/answers`,
        { answers: answersToSave },
        {
          headers: {
            'Authorization': sessionStorage.getItem('token'),
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error saving all answers:", error);
      throw error;
    }
  }, [answers, categories]);

  return {
    categories,
    answers,
    setAnswers,
    isQuestionCompleted,
    isCategoryCompleted,
    getProgressPercentage,
    allQuestionsAnswered,
    handleOptionChange,
    handleDescriptionChange,
    fetchSavedAnswers,
    saveAllAnswers
  };
};

export default useSurveyData;