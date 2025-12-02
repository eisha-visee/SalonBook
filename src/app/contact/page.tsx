export default function ContactPage() {
    return (
        <div className="contact-page">
            <section className="contact-hero">
                <div className="container">
                    <h1>Get in <span className="text-accent">Touch</span></h1>
                    <p>We'd love to hear from you. Reach out for any queries or support.</p>
                </div>
            </section>

            <section className="contact-content">
                <div className="container">
                    <div className="contact-grid">
                        <div className="contact-info">
                            <div className="contact-info-item">
                                <div className="contact-icon">📧</div>
                                <h3>Email Us</h3>
                                <p>support@salonbook.com</p>
                            </div>

                            <div className="contact-info-item">
                                <div className="contact-icon">📱</div>
                                <h3>Call Us</h3>
                                <p>+91 98765 43210</p>
                            </div>

                            <div className="contact-info-item">
                                <div className="contact-icon">📍</div>
                                <h3>Visit Us</h3>
                                <p>Mumbai, Maharashtra, India</p>
                            </div>
                        </div>

                        <div className="contact-form-container">
                            <h2>Send us a Message</h2>
                            <form className="contact-form">
                                <div className="form-field">
                                    <label htmlFor="name">Full Name</label>
                                    <input type="text" id="name" placeholder="John Doe" required />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="email">Email Address</label>
                                    <input type="email" id="email" placeholder="john@example.com" required />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="subject">Subject</label>
                                    <input type="text" id="subject" placeholder="How can we help?" required />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="message">Message</label>
                                    <textarea id="message" rows={5} placeholder="Tell us more..." required></textarea>
                                </div>

                                <button type="submit" className="btn btn-primary">Send Message</button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
