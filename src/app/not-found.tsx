import Image from "next/image";
import Link from "next/link";

export default function NotFound(): React.ReactNode {
  return (
    <div className="state-view">
      <Image
        src="/not_found.png"
        alt="Wile E. Coyote holding an 'Oops' sign"
        width={500}
        height={500}
        className="state-image"
        priority
      />
      <p className="state-eyebrow">Error 404</p>
      <h1 className="state-title">Page not found</h1>
      <p className="state-text">
        We couldn&apos;t find the page you were looking for. It may have been
        moved, renamed, or never existed.
      </p>
      <Link href="/" className="state-link">
        Back to home
      </Link>
    </div>
  );
}
