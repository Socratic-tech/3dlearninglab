import type { AnchorHTMLAttributes } from "react";

/** next/link stand-in for the static build: hash routes are plain anchors. */
export default function Link({ href, prefetch, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean }) {
  void prefetch;
  return <a href={href} {...props} />;
}
