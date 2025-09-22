import JsonLd from "./JsonLd";

type Crumb = { name: string; item: string };

export default function BreadcrumbsJsonLd({ crumbs }: { crumbs: Crumb[] }) {
  if (!crumbs?.length) return null;
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.item,
    })),
  };
  return <JsonLd data={data} />;
}
