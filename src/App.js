import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Game from './components/Game';
import Landing from './components/Landing';
import { initializePlatform } from './lib/capacitor-device';
function App() {
    const [platformReady, setPlatformReady] = useState(false);
    useEffect(() => {
        // Initialize Capacitor platform
        initializePlatform()
            .then(() => {
            setPlatformReady(true);
            console.log('Capacitor platform initialized');
        })
            .catch((error) => {
            console.warn('Platform initialization failed (web mode):', error);
            // Still allow web mode to work
            setPlatformReady(true);
        });
    }, []);
    if (!platformReady) {
        return (_jsx("div", { style: {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: '#0a0a18',
                color: '#f1c40f',
                fontFamily: "'Space Mono', monospace",
                fontSize: '1.5rem',
            }, children: "Loading..." }));
    }
    return (_jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Landing, {}) }), _jsx(Route, { path: "/game", element: _jsx(Game, {}) }), _jsx(Route, { path: "/psyduck-panic", element: _jsx(Game, {}) })] }) }));
}
export default App;
