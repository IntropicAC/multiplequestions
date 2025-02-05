// App.js
import React from 'react';
import MultipleChoiceQuestion from './components/multipleChoiceQuestion';


function App() {
  return (
    <div
      className="App"
      style={{
        minHeight: '100vh',
        backgroundColor: '#0D1B2A', // Dark blue background for the entire page
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        color: '#fff'
      }}
    >
      <h1
        style={{
          textAlign: 'center',
          color: '#E0E1DD', // Lighter text for the header
          marginBottom: '20px'
        }}
      >
        Exam Practice
      </h1>
      <MultipleChoiceQuestion />
    </div>
  );
}


export default App;



