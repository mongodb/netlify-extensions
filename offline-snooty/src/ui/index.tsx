import './index.css';
import { NetlifyExtensionUI } from '@netlify/sdk/ui/react/components';
import { createRoot } from 'react-dom/client';
import { App } from './App.jsx';

const rootNodeId = 'root';
let rootNode = document.getElementById(rootNodeId);
if (rootNode === null) {
  rootNode = document.createElement('div');
  rootNode.id = rootNodeId;
}
const root = createRoot(rootNode);

root.render(
  <NetlifyExtensionUI>
    <App />
  </NetlifyExtensionUI>,
);
