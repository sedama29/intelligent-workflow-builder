import React from 'react';
import './ComponentLibrary.css';

const components = [
  { type: 'user_query', label: 'User Query', icon: '💬' },
  { type: 'knowledgebase', label: 'Knowledge Base', icon: '📚' },
  { type: 'llm_engine', label: 'LLM Engine', icon: '🤖' },
  { type: 'output', label: 'Output', icon: '📤' },
];

function ComponentLibrary({ onAddNode }) {
  const handleDragStart = (event, componentType) => {
    event.dataTransfer.setData('application/reactflow', componentType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="component-library">
      <h3>Components</h3>
      <p className="library-subtitle">Drag to add to canvas</p>
      <div className="component-list">
        {components.map((component) => (
          <div
            key={component.type}
            className="component-item"
            draggable
            onDragStart={(e) => handleDragStart(e, component.type)}
            onClick={() => onAddNode(component.type)}
          >
            <span className="component-icon">{component.icon}</span>
            <span className="component-label">{component.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ComponentLibrary;

