import { getCategoriesWithCounts } from "@/lib/api/events";
import { CategoriesClient } from "@/components/categories/CategoriesClient";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await getCategoriesWithCounts();
  return <CategoriesClient categories={categories} />;
}
