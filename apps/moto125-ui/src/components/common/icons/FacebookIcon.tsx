import type { SVGProps } from "react";

/** Minimal Facebook "f" */
export default function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      role="img"
      focusable="false"
      {...props}
    >
      <path
        d="M22 12.06C22 6.5 17.523 2 12 2S2 6.5 2 12.06c0 5.02 3.657 9.19 8.437 9.94v-7.03H7.898V12.06h2.54V9.83c0-2.51 1.492-3.9 3.777-3.9 1.094 0 2.238.196 2.238.196v2.47h-1.26c-1.243 0-1.63.774-1.63 1.565v1.9h2.773l-.443 2.91h-2.33v7.03C18.343 21.25 22 17.08 22 12.06Z"
        fill="currentColor"
      />
    </svg>
  );
}
