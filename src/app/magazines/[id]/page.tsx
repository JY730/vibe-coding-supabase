import MagazinesDetail from '@/components/magazines-detail';

interface MagazineDetailPageProps {
  params: {
    id: string;
  };
}

export default function MagazineDetailPage({ params }: MagazineDetailPageProps) {
  return <MagazinesDetail id={params.id} />;
}
