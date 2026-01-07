import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'react-flow-renderer';
import ComponentLibrary from './ComponentLibrary';
import ComponentConfigPanel from './ComponentConfigPanel';
import { workflowAPI } from '../services/api';
import { v4 as uuidv4 } from 'uuid';
import './WorkflowBuilder.css';

// Node Components
function UserQueryNode({ data }) {
  return (
    <div className="custom-node user-query-node">
      <div className="node-header">User Query</div>
      <div className="node-content">{data.label}</div>
    </div>
  );
}

function KnowledgeBaseNode({ data }) {
  return (
    <div className="custom-node knowledgebase-node">
      <div className="node-header">Knowledge Base</div>
      <div className="node-content">{data.label}</div>
    </div>
  );
}

function LLMEngineNode({ data }) {
  return (
    <div className="custom-node llm-engine-node">
      <div className="node-header">LLM Engine</div>
      <div className="node-content">{data.label}</div>
    </div>
  );
}

function OutputNode({ data }) {
  return (
    <div className="custom-node output-node">
      <div className="node-header">Output</div>
      <div className="node-content">{data.label}</div>
    </div>
  );
}

const nodeTypes = {
  user_query: UserQueryNode,
  knowledgebase: KnowledgeBaseNode,
  llm_engine: LLMEngineNode,
  output: OutputNode,
};

const initialNodes = [];
const initialEdges = [];

function WorkflowBuilder({ onWorkflowSelect, activeWorkflow }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowId, setWorkflowId] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    loadWorkflows();
    if (activeWorkflow) {
      loadWorkflow(activeWorkflow.id);
    }
  }, [activeWorkflow]);

  const loadWorkflows = async () => {
    try {
      const response = await workflowAPI.list();
      setWorkflows(response.data);
    } catch (error) {
      console.error('Error loading workflows:', error);
    }
  };

  const loadWorkflow = async (id) => {
    try {
      const response = await workflowAPI.get(id);
      const workflow = response.data;
      setWorkflowId(workflow.id);
      setWorkflowName(workflow.name);

      // Convert components to nodes
      const workflowNodes = workflow.components.map((comp) => ({
        id: comp.node_id,
        type: comp.component_type,
        position: { x: comp.position_x, y: comp.position_y },
        data: {
          label: getComponentLabel(comp.component_type),
          config: comp.config || {},
          componentId: comp.id,
        },
      }));

      // Convert connections to edges
      const workflowEdges = workflow.connections.map((conn) => {
        const sourceNode = workflow.components.find((c) => c.id === conn.source_component_id);
        const targetNode = workflow.components.find((c) => c.id === conn.target_component_id);
        return {
          id: `e${conn.id}`,
          source: sourceNode.node_id,
          target: targetNode.node_id,
          sourceHandle: conn.source_handle,
          targetHandle: conn.target_handle,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        };
      });

      setNodes(workflowNodes);
      setEdges(workflowEdges);
    } catch (error) {
      console.error('Error loading workflow:', error);
    }
  };

  const getComponentLabel = (type) => {
    const labels = {
      user_query: 'User Query',
      knowledgebase: 'Knowledge Base',
      llm_engine: 'LLM Engine',
      output: 'Output',
    };
    return labels[type] || type;
  };

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const addNode = (componentType) => {
    const newNode = {
      id: uuidv4(),
      type: componentType,
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
      data: {
        label: getComponentLabel(componentType),
        config: getDefaultConfig(componentType),
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const getDefaultConfig = (type) => {
    const configs = {
      user_query: {},
      knowledgebase: {
        collection_name: 'documents',
        n_results: 5,
        embedding_provider: 'openai',
      },
      llm_engine: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 1000,
        use_web_search: false,
      },
      output: {},
    };
    return configs[type] || {};
  };

  const updateNodeConfig = (nodeId, config) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, config } } : node
      )
    );
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode({
        ...selectedNode,
        data: { ...selectedNode.data, config },
      });
    }
  };

  const saveWorkflow = async () => {
    if (!workflowName.trim()) {
      alert('Please enter a workflow name');
      return;
    }

    try {
      // Convert nodes to components
      const components = nodes.map((node) => ({
        component_type: node.type,
        node_id: node.id,
        position_x: node.position.x,
        position_y: node.position.y,
        config: node.data.config || {},
      }));

      // Convert edges to connections - use node IDs
      const connections = edges.map((edge) => {
        return {
          source_component_id: edge.source,  // This is actually a node_id
          target_component_id: edge.target,   // This is actually a node_id
          source_handle: edge.sourceHandle,
          target_handle: edge.targetHandle,
        };
      });

      const workflowData = {
        name: workflowName,
        components,
        connections,
      };

      let response;
      if (workflowId) {
        response = await workflowAPI.update(workflowId, workflowData);
      } else {
        response = await workflowAPI.create(workflowData);
        setWorkflowId(response.data.id);
      }

      await loadWorkflows();
      setShowSaveDialog(false);
      if (onWorkflowSelect) {
        onWorkflowSelect(response.data);
      }
      alert('Workflow saved successfully!');
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Error saving workflow: ' + (error.response?.data?.detail || error.message));
    }
  };

  const validateWorkflow = async () => {
    if (!workflowId) {
      alert('Please save the workflow first');
      return;
    }

    try {
      const response = await workflowAPI.validate(workflowId);
      if (response.data.valid) {
        alert('Workflow is valid!');
      } else {
        alert('Workflow validation failed: ' + response.data.error);
      }
    } catch (error) {
      console.error('Error validating workflow:', error);
      alert('Error validating workflow');
    }
  };

  const deleteNode = (nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(null);
    }
  };

  return (
    <div className="workflow-builder">
      <ComponentLibrary onAddNode={addNode} />
      
      <div className="workflow-canvas-container">
        <div className="workflow-toolbar">
          <input
            type="text"
            placeholder="Workflow Name"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="workflow-name-input"
          />
          <button className="btn btn-primary" onClick={() => setShowSaveDialog(true)}>
            Save Workflow
          </button>
          <button className="btn btn-success" onClick={validateWorkflow}>
            Validate
          </button>
          {selectedNode && (
            <button
              className="btn btn-danger"
              onClick={() => deleteNode(selectedNode.id)}
            >
              Delete Node
            </button>
          )}
        </div>
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {selectedNode && (
        <ComponentConfigPanel
          node={selectedNode}
          onConfigUpdate={updateNodeConfig}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {showSaveDialog && (
        <div className="modal-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Save Workflow</h2>
            <input
              type="text"
              placeholder="Workflow Name"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="workflow-name-input"
            />
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={saveWorkflow}>
                Save
              </button>
              <button className="btn btn-secondary" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkflowBuilder;

