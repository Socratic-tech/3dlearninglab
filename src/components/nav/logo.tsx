import Link from "next/link";

/** Mark: an isometric cube drawn as a blueprint wireframe with one solid face. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <path d="M16 3 28 10v12l-12 7-12-7V10z" fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16 17 28 10M16 17 4 10M16 17v12" stroke="var(--primary)" strokeWidth="1.8" fill="none" />
      <path d="M16 17 28 10v12l-12 7z" fill="var(--primary)" opacity=".85" />
      <path d="M8 12.3 16 17" stroke="var(--accent)" strokeWidth="1.6" strokeDasharray="2 2" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-display text-base font-bold tracking-tight">
      <LogoMark />
      <span>
        3D Design <span className="text-primary">Academy</span>
      </span>
    </Link>
  );
}
