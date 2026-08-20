import { redirect } from 'next/navigation'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CategoriesPage(props: PageProps) {
  const searchParams = await props.searchParams

  const params = new URLSearchParams()
  Object.entries(searchParams).forEach(([key, val]) => {
    if (val !== undefined) {
      if (Array.isArray(val)) {
        val.forEach((v) => params.append(key, v))
      } else {
        params.append(key, val)
      }
    }
  })

  const queryString = params.toString()
  redirect(queryString ? `/schedule?${queryString}` : '/schedule')
}
