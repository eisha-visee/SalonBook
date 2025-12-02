'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Don't show sidebar on login page
    if (pathname === '/admin') {
        return <>{children}</>;
    }

    const navItems = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
        { name: 'Bookings', href: '/admin/bookings', icon: '📅' },
        { name: 'Clients', href: '/admin/clients', icon: '👥' },
        { name: 'Employees', href: '/admin/employees', icon: '👨‍💼' },
    ];

    return (
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
                    <Link href="/admin" className="admin-nav-item logout-btn">
                        <span className="admin-nav-icon">🚪</span>
                        Logout
                    </Link>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <div className="admin-header-logo">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 14c0 5-4 7-9 7s-9-2-9-7 4-9 9-9 9 4 9 9Z" />
                            <path d="M2 14h20" />
                        </svg>
                        <span className="admin-logo-text">SalonBook</span>
                    </div>

                    <div className="admin-search-bar">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search..."
                            className="admin-search-input"
                        />
                    </div>

                    <div className="admin-user-profile">
                        <div className="admin-user-info">
                            <span className="admin-user-name">Sofia Martinez</span>
                            <span className="admin-user-role">Admin</span>
                        </div>
                        <div className="admin-user-avatar">S</div>
                    </div>
                </header>

                <div className="admin-content">
                    {children}
                </div>
            </main>
        </div>
    );
}
