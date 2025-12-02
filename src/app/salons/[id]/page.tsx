import SalonDetailClient from './SalonDetailClient';
import { salons } from '@/data/salons';

interface SalonDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export function generateStaticParams() {
    return salons.map((salon) => ({
        id: salon.id,
    }));
}

export default async function SalonDetailPage({ params }: SalonDetailPageProps) {
    const { id } = await params;
    return <SalonDetailClient id={id} />;
}
