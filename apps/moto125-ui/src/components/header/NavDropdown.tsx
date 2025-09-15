import Link from "next/link";
import type { MenuLink } from "./navModel";

type Props = {
  items: MenuLink[];
  label?: string; // por defecto "Artículos"
};

export default function NavDropdown({ items, label }: Props) {
  return (
    <li className="relative uppercase">
      <div className="group/dropdown relative inline-block">
        <button
          type="button"
          className="px-3 py-1.5 rounded-full hover:bg-black/5 transition flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          {label.toUpperCase()}
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-4 transition-transform group-focus-within/dropdown:rotate-180"
          >
            <path
              d="M5.5 7.5l4.5 4 4.5-4"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div
          className="
            pointer-events-none opacity-0 translate-y-1
            group-focus-within/dropdown:pointer-events-auto
            group-focus-within/dropdown:opacity-100
            group-focus-within/dropdown:translate-y-0
            transition
            absolute left-0 mt-2 min-w-56 rounded-xl border border-[#e6e6e6] bg-white shadow-md p-2"
          tabIndex={-1}
        >
          <ul className="max-h-[60vh] overflow-auto">
            {items.length > 0 ? (
              items.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="block px-3 py-2 rounded-lg hover:bg-black/5 transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-sm text-[#666]">Sin tipos disponibles</li>
            )}
          </ul>
        </div>
      </div>
    </li>
  );
}
