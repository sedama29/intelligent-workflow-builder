import React, { useState } from 'react';
import './App.css';
import WorkflowBuilder from './components/WorkflowBuilder';
import ChatInterface from './components/ChatInterface';

function App() {
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Intelligent Workflow Builder</h1>
        <div className="header-actions">
          {activeWorkflow && (
            <button
              className="btn btn-primary"
              onClick={() => setShowChat(!showChat)}
            >
              {showChat ? 'Hide Chat' : 'Chat with Stack'}
            </button>
          )}
        </div>
      </header>
      
      <div className="App-content">
        {showChat && activeWorkflow ? (
          <ChatInterface
            workflowId={activeWorkflow.id}
            onClose={() => setShowChat(false)}
          />
        ) : (
          <WorkflowBuilder
            onWorkflowSelect={setActiveWorkflow}
            activeWorkflow={activeWorkflow}
          />
        )}
      </div>
    </div>
  );
}

export default App;

