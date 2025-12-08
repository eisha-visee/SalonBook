'use client';

import { useState } from 'react';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import AdminChat from '@/components/AdminChat';

export default function AdminDashboard() {
    const [chatActions, setChatActions] = useState<any[]>([]);

    const handleActionExecuted = (result: any) => {
        setChatActions(prev => [...prev, result]);
    };

    return (
        <div className="admin-dashboard">
            <div className="page-header">
                <h1>Dashboard Overview</h1>
                <p className="page-subtitle">Welcome back, Admin! Here's what's happening today.</p>
            </div>

            <div className="dashboard-grid">
                <div className="analytics-section">
                    <AnalyticsDashboard />
                </div>
                <div className="chat-section">
                    <AdminChat onActionExecuted={handleActionExecuted} />
                </div>
            </div>

            <style jsx>{`
                .admin-dashboard {
                    padding: 2rem;
                }

                .page-header {
                    margin-bottom: 2rem;
                }

                .page-header h1 {
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                }

                .page-subtitle {
                    color: #6B7280;
                }

                .dashboard-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                }

                .analytics-section {
                    flex: 1;
                }

                .chat-section {
                    flex: 1;
                }

                @media (max-width: 1200px) {
                    .dashboard-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}
