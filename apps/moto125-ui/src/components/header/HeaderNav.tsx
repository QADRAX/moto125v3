import Link from "next/link";
import type { ArticleType } from "@moto125/api-client";
import NavDropdown from "./NavDropdown";
import { buildNav } from "./navModel";
import SearchNavItem from "./SearchNavItem";

type Props = {
  types: ArticleType[];
  layout?: "stacked" | "inline";
};

export default function HeaderNav({ types, layout = "stacked" }: Props) {
  const nav = buildNav(types);
  const isInline = layout === "inline";

  return (
    <nav
      className={[
        isInline ? "mt-0 pb-0" : "mt-3 sm:mt-4 pb-2",
        "font-heading font-bold text-lg uppercase",
      ].join(" ")}
    >
      <ul
        className={[
          "flex flex-wrap items-center gap-2 sm:gap-4",
          isInline ? "justify-start" : "justify-center",
        ].join(" ")}
      >
        {nav.map((item) =>
          item.children?.length ? (
            <NavDropdown key={item.key} items={item.children} label={item.label} />
          ) : (
            <li key={item.key}>
              <Link
                href={item.href!}
                className="px-3 py-1.5 hover:bg-black/5 transition"
              >
                {item.label}
              </Link>
            </li>
          )
        )}
        <SearchNavItem />
      </ul>
    </nav>
  );
}
