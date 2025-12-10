'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

import ProfileMenu from '@/components/admin/ProfileMenu';

import AdminChatbot from '@/components/admin/AdminChatbot';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();

    // Don't show sidebar on login page
    if (pathname === '/admin/login' || pathname === '/admin') {
        return <>{children}</>;
    }

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/admin/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const navItems = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
        { name: 'Bookings', href: '/admin/bookings', icon: '📅' },
        { name: 'Salons', href: '/admin/salons', icon: '💈' },
        { name: 'Clients', href: '/admin/clients', icon: '👥' },
        { name: 'Employees', href: '/admin/employees', icon: '👨‍💼' },
    ];

    const [isSidebarOpen, setSidebarOpen] = useState(false);

    return (
        <ProtectedRoute>
            <div className="admin-layout">
                {/* Mobile Overlay */}
                {isSidebarOpen && (
                    <div
                        className="sidebar-overlay"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    <div className="admin-sidebar-header">
                        <Link href="/admin/dashboard" className="admin-sidebar-logo">
                            Salon<span className="text-accent">Book</span>
                        </Link>
                        <button
                            className="close-sidebar-btn"
                            onClick={() => setSidebarOpen(false)}
                        >
                            ×
                        </button>
                    </div>

                    <nav className="admin-nav">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`admin-nav-item ${pathname === item.href ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <span className="admin-nav-icon">{item.icon}</span>
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    <div className="admin-sidebar-footer">
                        <button onClick={handleLogout} className="admin-nav-item logout-btn">
                            <span className="admin-nav-icon">🚪</span>
                            Logout
                        </button>
                    </div>
                </aside>

                <main className="admin-main">
                    <header className="admin-header">
                        <div className="header-left">
                            <button
                                className="menu-toggle-btn"
                                onClick={() => setSidebarOpen(true)}
                            >
                                ☰
                            </button>
                            <div className="header-title">
                                <h2>Admin Panel</h2>
                            </div>
                        </div>

                        <ProfileMenu />
                    </header>

                    <div className="admin-content">
                        {children}
                    </div>
                </main>
                <AdminChatbot />
            </div>
            <style jsx global>{`
                .admin-layout {
                    display: flex;
                    min-height: 100vh;
                    background: #F9FAFB;
                }
                .admin-sidebar {
                    width: 260px;
                    background: white;
                    border-right: 1px solid #E5E7EB;
                    display: flex;
                    flex-direction: column;
                    position: fixed;
                    height: 100vh;
                    z-index: 50;
                    transition: transform 0.3s ease;
                }
                .close-sidebar-btn {
                    display: none;
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #6B7280;
                }
                .admin-main {
                    flex: 1;
                    margin-left: 260px;
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                    transition: margin-left 0.3s ease;
                }
                .admin-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 2rem;
                    background: white;
                    border-bottom: 1px solid #E5E7EB;
                }
                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .menu-toggle-btn {
                    display: none;
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #374151;
                    padding: 0.25rem;
                }
                .admin-content {
                    padding: 2rem;
                    max-width: 100%;
                    overflow-x: hidden;
                }
                
                /* Mobile Responsiveness */
                @media (max-width: 768px) {
                    .admin-sidebar {
                        transform: translateX(-100%);
                    }
                    .admin-sidebar.open {
                        transform: translateX(0);
                    }
                    .admin-main {
                        margin-left: 0;
                    }
                    .menu-toggle-btn {
                        display: block;
                    }
                    .close-sidebar-btn {
                        display: block;
                    }
                    .sidebar-overlay {
                        position: fixed;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background: rgba(0,0,0,0.5);
                        z-index: 40;
                        animation: fadeIn 0.3s;
                    }
                    .admin-content {
                        padding: 1rem;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                }
            `}</style>
        </ProtectedRoute>
    );
}
