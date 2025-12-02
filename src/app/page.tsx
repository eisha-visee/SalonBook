import Hero from '@/components/Hero';
import SalonCard from '@/components/SalonCard';
import { salons } from '@/data/salons';
import Link from 'next/link';

export default function Home() {
  const featuredSalons = salons.slice(0, 3);

  const beautyTips = [
    {
      id: 1,
      title: 'Coconut Oil Hair Mask',
      description: 'Apply warm coconut oil to your hair, leave for 30 minutes, then wash. This natural remedy deeply nourishes and repairs damaged hair, leaving it soft and shiny.',
      icon: '🥥',
      color: '#FFE8F0',
    },
    {
      id: 2,
      title: 'Honey & Lemon Face Glow',
      description: 'Mix 1 tbsp honey with a few drops of lemon juice. Apply to face for 15 minutes. This natural remedy brightens skin and reduces blemishes naturally.',
      icon: '🍯',
      color: '#FFF4E6',
    },
    {
      id: 3,
      title: 'Green Tea Eye Relief',
      description: 'Place cooled green tea bags on closed eyes for 10 minutes. Reduces puffiness and dark circles while providing antioxidants for delicate under-eye skin.',
      icon: '🍵',
      color: '#E8F5E9',
    },
    {
      id: 4,
      title: 'Aloe Vera Skin Soother',
      description: 'Apply fresh aloe vera gel to skin before bed. Perfect for healing sunburns, moisturizing dry skin, and reducing acne inflammation naturally.',
      icon: '🌿',
      color: '#E0F7FA',
    },
    {
      id: 5,
      title: 'Oatmeal Facial Scrub',
      description: 'Mix ground oatmeal with yogurt for gentle exfoliation. Remove dead skin cells while nourishing and calming sensitive or irritated skin.',
      icon: '🌾',
      color: '#FFF9C4',
    },
    {
      id: 6,
      title: 'Cucumber Hydration Boost',
      description: 'Blend cucumber and apply as a face mask. Hydrates skin, reduces inflammation, and provides a cooling effect perfect for hot summer days.',
      icon: '🥒',
      color: '#C8E6C9',
    },
  ];

  return (
    <>
      <Hero />

      <section className="featured-salons">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Top Rated</span>
            <h2>Featured <span className="text-accent">Salons</span></h2>
            <p>Discover our handpicked selection of premium salons</p>
          </div>

          <div className="grid grid-3">
            {featuredSalons.map(salon => (
              <SalonCard key={salon.id} salon={salon} />
            ))}
          </div>

          <div className="text-center mt-xl">
            <Link href="/salons" className="btn btn-secondary">
              View All Salons
            </Link>
          </div>
        </div>
      </section>

      <section className="beauty-tips-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Beauty Wisdom</span>
            <h2>Natural <span className="text-accent">Beauty Remedies</span></h2>
            <p>Simple homemade tips for radiant skin and healthy hair</p>
          </div>

          <div className="beauty-tips-grid">
            {beautyTips.map(tip => (
              <div key={tip.id} className="beauty-tip-card" style={{ backgroundColor: tip.color }}>
                <div className="tip-icon">{tip.icon}</div>
                <h3 className="tip-title">{tip.title}</h3>
                <p className="tip-description">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
