import Link from 'next/link';

export default function Header() {
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

                    <Link href="/salons" className="btn btn-primary">
                        Book Now
                    </Link>
                </div>
            </div>
        </header>
    );
}
