// Server-side guard for every route under /admin. Runs before any admin
// data is fetched or rendered, so non-admins (including signed-out users)
// never reach the page — this is not just a hidden UI link.
import { redirect } from "next/navigation";
import { getIsAdmin } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) {
    redirect("/");
  }

  return <>{children}</>;
}
