'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <header className="header">
            <div className="container">
                <div className="header-content">
                    <Link href="/" className="logo">
                        <span className="logo-text">Salon<span className="text-accent">Book</span></span>
                    </Link>

                    <nav className="nav">
                        <Link href="/" className="nav-link">Home</Link>
                        <Link href="/salons" className="nav-link">Salons</Link>
                        <Link href="/contact" className="nav-link">Contact</Link>
                    </nav>

                    <div className="header-actions">
                        <Link href="/salons" className="btn btn-primary">
                            Book Now
                        </Link>

                        <button
                            className={`hamburger ${isMenuOpen ? 'active' : ''}`}
                            onClick={toggleMenu}
                            aria-label="Toggle menu"
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    <div className={`mobile-menu ${isMenuOpen ? 'active' : ''}`}>
                        <nav className="mobile-nav">
                            <Link href="/" className="mobile-nav-link" onClick={closeMenu}>Home</Link>
                            <Link href="/salons" className="mobile-nav-link" onClick={closeMenu}>Salons</Link>
                            <Link href="/contact" className="mobile-nav-link" onClick={closeMenu}>Contact</Link>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Overlay */}
            {isMenuOpen && <div className="menu-overlay" onClick={closeMenu}></div>}
        </header>
    );
}
