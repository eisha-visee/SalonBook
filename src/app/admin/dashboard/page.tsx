'use client';

import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';

export default function AdminDashboard() {
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
                    grid-template-columns: 1fr;
                    gap: 2rem;
                }

                .analytics-section {
                    flex: 1;
                }
            `}</style>
        </div>
    );
}
