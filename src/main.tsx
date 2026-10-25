import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    return Promise.all(registrations.map((registration) => registration.unregister()));
  }).catch((error: unknown) => {
    console.error('Failed to unregister existing service workers:', error);
  });
}

createRoot(document.getElementById('root')!).render(<App />);
