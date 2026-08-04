import { redirect } from "next/navigation";

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DiscoverPage(props: PageProps) {
  const searchParams = await props.searchParams;
  
  // Build query string from searchParams to preserve filters (like search, category, etc.)
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, val]) => {
    if (val !== undefined) {
      if (Array.isArray(val)) {
        val.forEach((v) => params.append(key, v));
      } else {
        params.append(key, val);
      }
    }
  });

  const queryString = params.toString();
  redirect(queryString ? `/?${queryString}` : "/");
}
