import Image from "next/image";

import RequestList from '@/components/features/request-list';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <RequestList />
    </main>
  );
}
