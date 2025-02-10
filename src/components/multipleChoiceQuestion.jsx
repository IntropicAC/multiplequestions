// components/MultipleChoiceQuestion.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import rewardSoundFile from './sounds/successed-295058.mp3';
import { questionCategories, shuffleArray } from './questions';

const MultipleChoiceQuestion = () => {
  // Category state
  const categoryKeys = Object.keys(questionCategories);
  const [selectedCategory, setSelectedCategory] = useState(categoryKeys[0] || "");
  
  // State for retest and typing round modes
  const [isRetest, setIsRetest] = useState(false);
  const [isTypingRound, setIsTypingRound] = useState(false);
  
  // State for current round’s questions, responses, and index
  const [questionOrder, setQuestionOrder] = useState([]);
  const [responses, setResponses] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reward sound ref
  const rewardSoundRef = useRef(new Audio(rewardSoundFile));

  // ---------------------------
  // Loader Functions
  // ---------------------------
  
  // Load a standard (multiple-choice) round.
  const loadQuestionsForCategory = (category) => {
    const questions = questionCategories[category] || [];
    
    // For each question, shuffle its options.
    const questionsWithShuffledOptions = questions.map(question => ({
      ...question,
      options: shuffleArray(question.options)
    }));
    
    const shuffled = shuffleArray(questionsWithShuffledOptions);
    setQuestionOrder(shuffled);
    setResponses(shuffled.map(() => ({ selectedAnswers: [], submitted: false })));
    setCurrentIndex(0);
    setIsRetest(false);
    setIsTypingRound(false);
  };

  // Load a new multiple-choice round (for retests or wrong answers).
  const loadNewRound = (questions, retest = false) => {
    const shuffled = shuffleArray(questions);
    setQuestionOrder(shuffled);
    setResponses(shuffled.map(() => ({ selectedAnswers: [], submitted: false })));
    setCurrentIndex(0);
    setIsRetest(retest);
    setIsTypingRound(false);
  };

  // Load a typing round – only include questions that are single-answer (allowMultiple false)
  // and whose correct answer is very short.
  const loadTypingRound = (questions, retest = false) => {
    const shuffled = shuffleArray(questions);
    setQuestionOrder(shuffled);
    // For typing round responses, we use fields “typedAnswer”, “submitted”, and “feedback”
    setResponses(shuffled.map(() => ({ typedAnswer: '', submitted: false, feedback: '' })));
    setCurrentIndex(0);
    setIsRetest(retest);
    setIsTypingRound(true);
  };

  // ---------------------------
  // Answer Checking Function
  // ---------------------------
  const isResponseCorrect = (response, question) => {
    if (!response.submitted) return false;
    if (isTypingRound) {
      const typed = response.typedAnswer.trim().toLowerCase();
      return question.correctAnswers.some(correct => typed === correct.trim().toLowerCase());
    } else {
      const sortedSelected = [...response.selectedAnswers].sort();
      const sortedCorrect = [...question.correctAnswers].sort();
      if (sortedSelected.length !== sortedCorrect.length) return false;
      return sortedSelected.every((val, index) => val === sortedCorrect[index]);
    }
  };

  // ---------------------------
  // Load Questions on Mount/Category Change
  // ---------------------------
  useEffect(() => {
    if (selectedCategory) {
      loadQuestionsForCategory(selectedCategory);
    }
  }, [selectedCategory]);

  // Memoize current question and response
  const currentQuestion = useMemo(() => questionOrder[currentIndex], [questionOrder, currentIndex]);
  const currentResponse = useMemo(
    () =>
      responses[currentIndex] ||
      (isTypingRound ? { typedAnswer: '', submitted: false, feedback: '' } : { selectedAnswers: [], submitted: false }),
    [responses, currentIndex, isTypingRound]
  );

  const isCurrentResponseCorrect = useCallback(() => {
    return isResponseCorrect(currentResponse, currentQuestion);
  }, [currentResponse, currentQuestion, isTypingRound]);

  // Play reward sound when a correct answer is submitted.
  useEffect(() => {
    if (currentResponse.submitted && isCurrentResponseCorrect()) {
      rewardSoundRef.current.currentTime = 0;
      rewardSoundRef.current.play().catch((err) => {
        console.error("Sound play error:", err);
      });
    }
  }, [currentResponse.submitted, isCurrentResponseCorrect]);

  // ---------------------------
  // Response Handlers
  // ---------------------------
  
  // For multiple-choice, toggle option selection.
  const handleOptionClick = (option) => {
    if (currentResponse.submitted) return;
    let updatedAnswers;
    if (currentQuestion.allowMultiple) {
      if (currentResponse.selectedAnswers.includes(option)) {
        updatedAnswers = currentResponse.selectedAnswers.filter(a => a !== option);
      } else {
        updatedAnswers = [...currentResponse.selectedAnswers, option];
      }
    } else {
      updatedAnswers = [option];
    }
    updateResponse(currentIndex, { selectedAnswers: updatedAnswers });
  };

  // General helper to update a response.
  const updateResponse = (index, newValues) => {
    const newResponses = [...responses];
    newResponses[index] = { ...newResponses[index], ...newValues };
    setResponses(newResponses);
  };

  // Handle answer submission.
  const handleSubmit = () => {
    if (isTypingRound) {
      const trimmedAnswer = currentResponse.typedAnswer.trim();
      if (!trimmedAnswer) return;
      // Check if the answer is correct.
      const correct = currentQuestion.correctAnswers.some(
        (correctAnswer) => trimmedAnswer.toLowerCase() === correctAnswer.trim().toLowerCase()
      );
      if (correct) {
        // Mark as submitted and show positive feedback.
        updateResponse(currentIndex, { submitted: true, feedback: "Correct!" });
      } else {
        // Allow another attempt and show error feedback.
        updateResponse(currentIndex, { feedback: "Incorrect. Try again." });
      }
    } else {
      if (currentResponse.selectedAnswers.length === 0) return;
      updateResponse(currentIndex, { submitted: true });
    }
  };

  // Handler for override in typing round.
  const handleOverride = () => {
    // Override the wrong answer so that the answer is considered correct.
    updateResponse(currentIndex, { submitted: true, feedback: "Correct! (Overridden)" });
  };

  // For multiple-choice, add labels to options after submission.
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

  // Styling for multiple-choice option buttons.
  const getButtonStyle = (option) => {
    let backgroundColor = '#415A77';
    let borderColor = '#2E3B4E';

    if (currentResponse.submitted) {
      if (currentQuestion.correctAnswers.includes(option)) {
        backgroundColor = '#388e3c';
      } else if (currentResponse.selectedAnswers.includes(option)) {
        backgroundColor = '#d32f2f';
      }
    } else if (currentResponse.selectedAnswers?.includes(option)) {
      backgroundColor = '#556677';
      borderColor = '#ffffff';
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
      color: '#fff',
      transition: 'background-color 0.3s, border 0.3s'
    };
  };

  // ---------------------------
  // Navigation Handlers
  // ---------------------------
  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < questionOrder.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // End-of-round logic.
      const wrongQuestions = questionOrder.filter((question, i) => {
        return !isResponseCorrect(responses[i], question);
      });

      if (wrongQuestions.length > 0) {
        alert("Some questions were answered incorrectly. Repeating them now.");
        if (isTypingRound) {
          loadTypingRound(wrongQuestions, true);
        } else {
          loadNewRound(wrongQuestions, true);
        }
      } else {
        if (!isTypingRound) {
          // After a successful multiple-choice round, re-ask only those questions
          // whose correct answer is short AND that are NOT multiple-answer.
          const typingQuestions = questionOrder.filter((question) => {
            const firstCorrect = question.correctAnswers[0] || "";
            return !question.allowMultiple &&
                   firstCorrect.trim().split(/\s+/).length < 3;
          });
          if (typingQuestions.length > 0) {
            alert("All questions answered correctly! Now starting a typing round for short answers.");
            loadTypingRound(typingQuestions);
          } else {
            alert("All questions answered correctly! Starting a new round.");
            loadQuestionsForCategory(selectedCategory);
          }
        } else {
          alert("All typing questions answered correctly! Starting a new round.");
          setIsTypingRound(false);
          loadQuestionsForCategory(selectedCategory);
        }
      }
    }
  };

  // ---------------------------
  // Render
  // ---------------------------
  if (!currentQuestion)
    return <p style={{ color: '#fff' }}>Loading question...</p>;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0D1B2A',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '1.25rem',
        color: '#fff'
      }}
    >
      {/* Responsive styling */}
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
            width: 100% !important;
            font-size: 1rem !important;
            padding: 6px 10px !important;
          }
          button {
            font-size: 1rem !important;
            padding: 8px 16px !important;
          }
          .category-container {
            width: 90% !important;
            margin: 10px auto !important;
          }
        }
        @media (min-width: 481px) and (max-width: 1024px) {
          .card {
            width: 80% !important;
            margin: 30px auto !important;
            padding: 20px !important;
          }
          .option-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 12px !important;
          }
          .progress-text, .question-header, .question-text {
            font-size: 1.1rem !important;
          }
          select {
            width: 100% !important;
            font-size: 1.1rem !important;
            padding: 8px 12px !important;
          }
          button {
            font-size: 1.1rem !important;
            padding: 10px 18px !important;
          }
          .category-container {
            width: 80% !important;
            margin: 15px auto !important;
          }
        }
      `}</style>

      {/* Category Selector */}
      <div className="category-container" style={{ maxWidth: '600px', margin: '20px auto', textAlign: 'center' }}>
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
          backgroundColor: '#1B263B',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Question Progress */}
        <p className="progress-text" style={{ textAlign: 'center', marginBottom: '10px', color: '#E0E1DD' }}>
          Question {currentIndex + 1} of {questionOrder.length} {isRetest && "(Retest)"} {isTypingRound && "(Typing Round)"}
        </p>
        <h2 className="question-header" style={{ fontSize: '1.75rem', textAlign: 'center', marginBottom: '20px', color: '#E0E1DD' }}>
          Exam Practice Question
        </h2>
        <p className="question-text" style={{ textAlign: 'center', marginBottom: '30px', color: '#E0E1DD' }}>
          {currentQuestion.question}
        </p>

        {/* Typing round or multiple-choice options */}
        {isTypingRound ? (
          <div style={{ marginBottom: '30px' }}>
            {/* Override button appears if a wrong answer was submitted */}
            {currentResponse.feedback === "Incorrect. Try again." && (
              <button
                onClick={handleOverride}
                style={{
                  marginBottom: '10px',
                  padding: '8px 12px',
                  fontSize: '1rem',
                  borderRadius: '8px',
                  backgroundColor: '#388e3c',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                I'm correct
              </button>
            )}
            <input
              type="text"
              value={currentResponse.typedAnswer}
              onChange={(e) => updateResponse(currentIndex, { typedAnswer: e.target.value, feedback: '' })}
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '1.25rem',
                borderRadius: '8px',
                boxSizing: 'border-box'
              }}
              placeholder="Type your answer here"
              disabled={currentResponse.submitted}
            />
            {currentResponse.feedback && (
              <p style={{ textAlign: 'center', marginTop: '10px', color: currentResponse.submitted ? '#388e3c' : '#d32f2f' }}>
                {currentResponse.feedback}
              </p>
            )}
          </div>
        ) : (
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
        )}

        {/* Navigation Buttons */}
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
            Prev
          </button>

          {/* Submit button is shown when the current response isn’t submitted */}
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

          {/* In typing round, Next is disabled until a correct answer is submitted */}
          <button
            onClick={handleNext}
            disabled={isTypingRound && !currentResponse.submitted}
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
