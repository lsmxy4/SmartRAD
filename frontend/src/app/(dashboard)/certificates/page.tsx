"use client";

import CertificateStats from "@/components/certificate/CertificateStats";
import CertificateList from "@/components/certificate/CertificateList";

export default function CertificatesPage() {
  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-100px)] flex flex-col p-6">
      <CertificateStats />
      <CertificateList />
    </div>
  );
}
