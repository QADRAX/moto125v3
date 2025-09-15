import Link from "next/link";
import type { ArticleType } from "@moto125/api-client";
import NavDropdown from "./NavDropdown";
import { buildNav } from "./navModel";

type Props = { types: ArticleType[] };

export default function HeaderNav({ types }: Props) {
  const nav = buildNav(types);
  return (
    <nav className="mt-3 sm:mt-4 font-heading font-semibold text-lg uppercase pb-2">
      <ul className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
        {nav.map((item) =>
          item.children?.length ? (
            <NavDropdown key={item.key} items={item.children} label={item.label} />
          ) : (
            <li key={item.key}>
              <Link
                href={item.href!}
                className="px-3 py-1.5 rounded-full hover:bg-black/5 transition"
              >
                {item.label}
              </Link>
            </li>
          )
        )}
      </ul>
    </nav>
  );
}
