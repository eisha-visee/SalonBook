import SalonDetailClient from './SalonDetailClient';

interface SalonDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function SalonDetailPage({ params }: SalonDetailPageProps) {
    const { id } = await params;
    return <SalonDetailClient id={id} />;
}
