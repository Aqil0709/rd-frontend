import React from 'react';
import { AppProvider } from './context/AppContext';
import Main from './Main';


export default function App() {
  return (
    <AppProvider>
      <div className="flex flex-col min-h-screen font-sans">
        <Main />
      </div>
    </AppProvider>
  );
}