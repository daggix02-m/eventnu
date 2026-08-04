import { notFound } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { TopHeader } from "@/components/TopHeader";
import { getCurrentAdminProfile } from "@/lib/actions/session";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentAdminProfile();
  if (!profile || profile.role !== "admin" || profile.suspended) notFound();

  return (
    <>
      <Sidebar />
      <div className="lg:ml-[260px] flex flex-col min-h-screen">
        <TopHeader />
        <main className="mt-16 flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </>
  );
}
