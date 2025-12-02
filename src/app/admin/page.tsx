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
        </div>
    );
}
