import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-section">
                        <h3 className="footer-logo">Salon<span className="text-accent">Book</span></h3>
                        <p className="footer-tagline">Your gateway to premium beauty services</p>
                    </div>

                    <div className="footer-section">
                        <h4 className="footer-title">Quick Links</h4>
                        <ul className="footer-links">
                            <li><Link href="/">Home</Link></li>
                            <li><Link href="/salons">Salons</Link></li>
                            <li><Link href="/booking">Book Now</Link></li>
                            <li><Link href="#services">Services</Link></li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4 className="footer-title">Contact</h4>
                        <ul className="footer-links">
                            <li>Email: hello@salonbook.com</li>
                            <li>Phone: +91 98765 43210</li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4 className="footer-title">Follow Us</h4>
                        <div className="footer-social">
                            <a href="#" className="social-link">Instagram</a>
                            <a href="#" className="social-link">Facebook</a>
                            <a href="#" className="social-link">Twitter</a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; 2024 SalonBook. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
