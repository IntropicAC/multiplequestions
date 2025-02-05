// components/MultipleChoiceQuestion.jsx
import React, { useState, useEffect, useRef } from 'react';
// Import the reward sound from the local file path.
import rewardSoundFile from './sounds/successed-295058.mp3';
import { questionCategories, shuffleArray } from './questions';

const MultipleChoiceQuestion = () => {
  // Get category keys from the questionCategories object.
  const categoryKeys = Object.keys(questionCategories);
  const [selectedCategory, setSelectedCategory] = useState(categoryKeys[0] || "");
  
  // State for whether the current round is a retest of wrong questions.
  const [isRetest, setIsRetest] = useState(false);

  // State for the current round's questions, responses, and current question index.
  const [questionOrder, setQuestionOrder] = useState([]);
  const [responses, setResponses] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Create a ref for the reward sound.
  const rewardSoundRef = useRef(new Audio(rewardSoundFile));

  // Helper function to load questions for a given category (new round).
  const loadQuestionsForCategory = (category) => {
    const questions = questionCategories[category] || [];
    const shuffled = shuffleArray(questions);
    setQuestionOrder(shuffled);
    setResponses(shuffled.map(() => ({ selectedAnswers: [], submitted: false })));
    setCurrentIndex(0);
    setIsRetest(false);
  };

  // Helper function to load a new round from a given array of questions.
  const loadNewRound = (questions, retest = false) => {
    const shuffled = shuffleArray(questions);
    setQuestionOrder(shuffled);
    setResponses(shuffled.map(() => ({ selectedAnswers: [], submitted: false })));
    setCurrentIndex(0);
    setIsRetest(retest);
  };

  // Helper function to check if a given response is correct.
  const isResponseCorrect = (response, question) => {
    if (!response.submitted) return false;
    const sortedSelected = [...response.selectedAnswers].sort();
    const sortedCorrect = [...question.correctAnswers].sort();
    if (sortedSelected.length !== sortedCorrect.length) return false;
    return sortedSelected.every((val, index) => val === sortedCorrect[index]);
  };

  // Load questions when the component mounts and whenever the selected category changes.
  useEffect(() => {
    if (selectedCategory) {
      loadQuestionsForCategory(selectedCategory);
    }
  }, [selectedCategory]);

  // Current question and its response state.
  const currentQuestion = questionOrder[currentIndex];
  const currentResponse = responses[currentIndex] || { selectedAnswers: [], submitted: false };

  // Function to check if the current response is correct.
  const isCurrentResponseCorrect = () => {
    return isResponseCorrect(currentResponse, currentQuestion);
  };

  // Play reward sound when the answer is submitted and is correct.
  useEffect(() => {
    if (currentResponse.submitted && isCurrentResponseCorrect()) {
      rewardSoundRef.current.currentTime = 0;
      rewardSoundRef.current.play();
    }
  }, [currentResponse.submitted]);

  // Handle option selection.
  const handleOptionClick = (option) => {
    if (currentResponse.submitted) return; // Prevent changes if already submitted

    let updatedAnswers;
    if (currentQuestion.allowMultiple) {
      // Toggle selection for multiple-answer questions.
      if (currentResponse.selectedAnswers.includes(option)) {
        updatedAnswers = currentResponse.selectedAnswers.filter((a) => a !== option);
      } else {
        updatedAnswers = [...currentResponse.selectedAnswers, option];
      }
    } else {
      // For single-answer questions, only one option is allowed.
      updatedAnswers = [option];
    }
    updateResponse(currentIndex, { selectedAnswers: updatedAnswers });
  };

  // Update the responses state for a given question index.
  const updateResponse = (index, newValues) => {
    const newResponses = [...responses];
    newResponses[index] = { ...newResponses[index], ...newValues };
    setResponses(newResponses);
  };

  // Handle answer submission.
  const handleSubmit = () => {
    if (currentResponse.selectedAnswers.length === 0) return;
    updateResponse(currentIndex, { submitted: true });
  };

  // Determine the content for each option.
  const getOptionContent = (option) => {
    let label = "";
    if (currentResponse.submitted) {
      if (currentQuestion.correctAnswers.includes(option)) {
        label = " (correct)";
      } else if (currentResponse.selectedAnswers.includes(option)) {
        label = " (incorrect)";
      }
    }
    return option + label;
  };

  // getButtonStyle that highlights selected options with a white border.
  const getButtonStyle = (option) => {
    let backgroundColor = '#415A77'; // Default muted blue for options
    let borderColor = '#2E3B4E'; // Default border color

    if (currentResponse.submitted) {
      if (currentQuestion.correctAnswers.includes(option)) {
        backgroundColor = '#388e3c'; // Green for correct answers
      } else if (currentResponse.selectedAnswers.includes(option)) {
        backgroundColor = '#d32f2f'; // Red for incorrect answers
      }
    } else if (currentResponse.selectedAnswers.includes(option)) {
      backgroundColor = '#556677'; // Slightly lighter blue for selected options
      borderColor = '#ffffff'; // White border when selected
    }

    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      padding: '15px',
      cursor: currentResponse.submitted ? 'default' : 'pointer',
      backgroundColor,
      border: `2px solid ${borderColor}`,
      borderRadius: '8px',
      textAlign: 'center',
      fontSize: '1.25rem',
      color: '#fff', // White text
      transition: 'background-color 0.3s, border 0.3s'
    };
  };

  // Navigation handlers.
  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    // If we're not on the last question, simply go to the next one.
    if (currentIndex < questionOrder.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // We have reached the end of the current round.
      // Filter out the questions that were answered incorrectly.
      const wrongQuestions = questionOrder.filter((question, i) => {
        return !isResponseCorrect(responses[i], question);
      });

      if (wrongQuestions.length > 0) {
        alert("Some questions were answered incorrectly. Repeating them now.");
        loadNewRound(wrongQuestions, true);
      } else {
        alert("All questions answered correctly! Starting a new round.");
        loadQuestionsForCategory(selectedCategory);
      }
    }
  };

  if (!currentQuestion)
    return <p style={{ color: '#fff' }}>Loading question...</p>;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0D1B2A', // Dark blue background for the page
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '1.25rem',
        color: '#fff'
      }}
    >
      {/* Inline CSS for responsive styling */}
      <style>{`
        @media (max-width: 480px) {
          .card {
            width: 90% !important;
            margin: 20px auto !important;
            padding: 15px !important;
          }
          .option-grid {
            grid-template-columns: 1fr !important;
          }
          .progress-text, .question-header, .question-text {
            font-size: 1rem !important;
          }
          select {
            font-size: 1rem !important;
            padding: 6px 10px !important;
          }
          button {
            font-size: 1rem !important;
            padding: 8px 16px !important;
          }
        }
      `}</style>

      {/* Category Selector */}
      <div style={{ maxWidth: '600px', margin: '20px auto', textAlign: 'center' }}>
        <label htmlFor="category-select" style={{ marginRight: '10px' }}>
          Select Test:
        </label>
        <select
          id="category-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '8px 12px',
            fontSize: '1.25rem',
            borderRadius: '8px',
            border: '1px solid #2E3B4E',
            backgroundColor: '#1B263B',
            color: '#fff'
          }}
        >
          {categoryKeys.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </div>

      <div
        className="card"
        style={{
          maxWidth: '600px',
          margin: '40px auto',
          padding: '20px',
          backgroundColor: '#1B263B', // Dark blue-gray card background
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Question Progress */}
        <p className="progress-text" style={{ textAlign: 'center', marginBottom: '10px', color: '#E0E1DD' }}>
          Question {currentIndex + 1} of {questionOrder.length} {isRetest && "(Retest)"}
        </p>
        <h2 className="question-header"
          style={{
            fontSize: '1.75rem',
            textAlign: 'center',
            marginBottom: '20px',
            color: '#E0E1DD'
          }}
        >
          Exam Practice Question
        </h2>
        <p className="question-text" style={{ textAlign: 'center', marginBottom: '30px', color: '#E0E1DD' }}>
          {currentQuestion.question}
        </p>

        {/* Display options in a 2x2 grid */}
        <div
          className="option-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '30px'
          }}
        >
          {currentQuestion.options.map((option) => (
            <button
              key={option}
              onClick={() => handleOptionClick(option)}
              style={getButtonStyle(option)}
            >
              {getOptionContent(option)}
            </button>
          ))}
        </div>

        {/* Navigation and action buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            style={{
              padding: '10px 20px',
              fontSize: '1.25rem',
              backgroundColor: '#0F4C75',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s'
            }}
          >
            Previous
          </button>

          {!currentResponse.submitted && (
            <button
              onClick={handleSubmit}
              style={{
                padding: '10px 20px',
                fontSize: '1.25rem',
                backgroundColor: '#3282B8',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
            >
              Submit Answer
            </button>
          )}

          <button
            onClick={handleNext}
            style={{
              padding: '10px 20px',
              fontSize: '1.25rem',
              backgroundColor: '#0F4C75',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.3s'
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultipleChoiceQuestion;
