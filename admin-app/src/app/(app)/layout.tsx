import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { IdleTimeout } from "@/components/IdleTimeout";
import { getCurrentAdminProfile } from "@/lib/actions/session";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentAdminProfile();
  if (!profile || profile.role !== "admin" || profile.suspended) notFound();

  return (
    <AppShell>
      <IdleTimeout />
      {children}
    </AppShell>
  );
}
