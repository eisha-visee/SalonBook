import Link from 'next/link';

export default function Hero() {
    return (
        <section className="hero">
            <div className="hero-overlay"></div>
            <div className="container">
                <div className="hero-content">
                    <span className="section-tag">Beauty & Wellness</span>
                    <h1 className="hero-title">
                        Endless ways to <span className="text-accent">pamper.</span><br />
                        One place to <span className="text-accent">find it.</span>
                    </h1>
                    <p className="hero-subtitle">
                        From luxury hair treatments to rejuvenating spa sessions, discover exceptional salons tailored to your beauty goals across your city.
                    </p>
                    <div className="hero-cta">
                        <Link href="/salons" className="btn btn-primary">
                            Explore Salons
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
