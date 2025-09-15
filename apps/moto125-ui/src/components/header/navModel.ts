import type { ArticleType } from "@moto125/api-client";
import { slugify, toUpperCamelCase } from "@/utils/utils";

export type MenuLink = {
  key: string;
  label: string;
  href: string;
};

export type NavItem = {
  key: string;
  label: string;
  href?: string;        // si tiene href es link directo
  children?: MenuLink[]; // si tiene children es un dropdown/sección
};

export function buildNav(types: ArticleType[]): NavItem[] {
  const articles: MenuLink[] = [
    { key: "all", label: "Todos los artículos", href: "/articulos" },
    ...types.map((t) => ({
      key: String(t.documentId ?? t.id ?? slugify(t.name ?? "")),
      label: toUpperCamelCase(t.name),
      href: `/articulos/tipo/${slugify(t.name)}`,
    })),
  ];

  return [
    { key: "motos", label: "Motos", href: "/motos" },
    { key: "marcas", label: "Marcas", href: "/marcas" },
    { key: "articulos", label: "Artículos", children: articles },
  ];
}
