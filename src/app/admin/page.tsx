'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Mock authentication
        setTimeout(() => {
            if (email && password) {
                // In a real app, we would validate credentials here
                // For now, any non-empty email/password works
                router.push('/admin/dashboard');
            } else {
                setError('Please enter both email and password');
                setLoading(false);
            }
        }, 1000);
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-card">
                <div className="admin-login-header">
                    <Link href="/" className="admin-logo">
                        Salon<span className="text-accent">Book</span> Admin
                    </Link>
                    <p className="admin-login-subtitle">Sign in to manage bookings</p>
                </div>

                <form onSubmit={handleLogin} className="admin-login-form">
                    {error && <div className="admin-error-message">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@example.com"
                            required
                            className="admin-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="admin-input"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary admin-login-btn"
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="admin-login-footer">
                    <Link href="/" className="back-to-home">
                        ← Back to Website
                    </Link>
                </div>
            </div>
            <style jsx>{styles}</style>
        </div>
    );
}

const styles = `
    .admin-login-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #F9FAFB;
        padding: 1rem;
    }

    .admin-login-card {
        background: white;
        width: 100%;
        max-width: 400px;
        padding: 2.5rem;
        border-radius: 16px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .admin-login-header {
        text-align: center;
        margin-bottom: 2rem;
    }

    .admin-logo {
        font-size: 1.75rem;
        font-weight: 800;
        color: #1F2937;
        text-decoration: none;
        display: block;
        margin-bottom: 0.5rem;
    }

    .admin-login-subtitle {
        color: #6B7280;
        font-size: 0.95rem;
    }

    .form-group {
        margin-bottom: 1.25rem;
    }

    .form-group label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
    }

    .admin-input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        font-size: 1rem;
        transition: all 0.2s;
    }

    .admin-input:focus {
        outline: none;
        border-color: #FF6B9D;
        box-shadow: 0 0 0 3px rgba(255, 107, 157, 0.1);
    }

    .admin-login-btn {
        width: 100%;
        padding: 0.875rem;
        background: #FF6B9D;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: background 0.2s;
        margin-top: 0.5rem;
    }

    .admin-login-btn:hover {
        background: #E5427A;
    }

    .admin-login-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .admin-error-message {
        background: #FEE2E2;
        color: #991B1B;
        padding: 0.75rem;
        border-radius: 8px;
        font-size: 0.875rem;
        margin-bottom: 1.5rem;
        text-align: center;
    }

    .admin-login-footer {
        margin-top: 2rem;
        text-align: center;
        border-top: 1px solid #E5E7EB;
        padding-top: 1.5rem;
    }

    .back-to-home {
        color: #6B7280;
        text-decoration: none;
        font-size: 0.875rem;
        transition: color 0.2s;
    }

    .back-to-home:hover {
        color: #1F2937;
    }
`;
