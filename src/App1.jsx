import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return (
    <div>
      <h1>Hello, Vite!</h1>
      <p>This should be visible.</p>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);