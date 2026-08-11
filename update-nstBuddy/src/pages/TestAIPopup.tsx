import React, { useState } from 'react';
import AIUploadPopup from '../components/AIUploadPopup';

// Simple test component to verify the popup works
const TestAIPopup = () => {
    const [show, setShow] = useState(false);

    return (
        <div style={{ padding: '20px' }}>
            <h1>AI Upload Popup Test</h1>
            <button
                onClick={() => setShow(true)}
                style={{
                    padding: '15px 30px',
                    background: 'purple',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px'
                }}
            >
                Open Popup
            </button>
            <p>State: {show ? 'OPEN' : 'CLOSED'}</p>
            <AIUploadPopup isOpen={show} onClose={() => setShow(false)} />
        </div>
    );
};

export default TestAIPopup;
