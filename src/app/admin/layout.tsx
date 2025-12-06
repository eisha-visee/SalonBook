'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

import ProfileMenu from '@/components/admin/ProfileMenu';

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

    return (
        <ProtectedRoute>
            <div className="admin-layout">
                <aside className="admin-sidebar">
                    <div className="admin-sidebar-header">
                        <Link href="/admin/dashboard" className="admin-sidebar-logo">
                            Salon<span className="text-accent">Book</span>
                        </Link>
                    </div>

                    <nav className="admin-nav">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`admin-nav-item ${pathname === item.href ? 'active' : ''}`}
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
                        <div className="header-title">
                            <h2>Admin Panel</h2>
                        </div>

                        <ProfileMenu />
                    </header>

                    <div className="admin-content">
                        {children}
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
