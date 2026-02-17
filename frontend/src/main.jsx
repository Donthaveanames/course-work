import { createRoot } from 'react-dom/client';
import AuthProvider from './Page/contexts/AutoContecst.jsx';
import App from './App.jsx';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <AuthProvider>
        <App />
    </AuthProvider>
);