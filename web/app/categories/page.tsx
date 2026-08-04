import { getCategories } from "@/lib/api/events";
import { CategoriesClient } from "@/components/categories/CategoriesClient";

export const revalidate = 60;

export default async function CategoriesPage() {
  const categories = await getCategories();
  return <CategoriesClient categories={categories} />;
}
