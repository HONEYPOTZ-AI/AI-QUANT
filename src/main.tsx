import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import OptionsGreeksPage from '@/pages/OptionsGreeksPage';
import SPXOptionsPage from '@/pages/SPXOptionsPage';

createRoot(document.getElementById("root")!).render(<App />);