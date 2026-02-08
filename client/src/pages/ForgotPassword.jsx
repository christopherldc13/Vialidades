import { useState } from 'react';
import { Link } from 'react-router-dom';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulate API call
        setMessage(`If an account with email ${email} exists, a reset link has been sent.`);
        setEmail('');
    };

    return (
        <div className="auth-container">
            <div className="card">
                <h2 style={{ textAlign: 'center' }}>Forgot Password</h2>
                {message && <p style={{ color: 'green', marginBottom: '1rem', textAlign: 'center' }}>{message}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Enter your email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <button type="submit">Send Reset Link</button>
                </form>
                <p style={{ marginTop: '1rem', textAlign: 'center' }}>
                    Remembered it? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}

export default ForgotPassword;
