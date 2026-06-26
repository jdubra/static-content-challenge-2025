"use client";

import Image from "next/image";
import Link from "next/link";

export default function Error(): React.ReactNode {
  return (
    <div className="state-view">
      <Image
        src="/roadrunner.webp"
        alt="The Road Runner speeding away"
        width={820}
        height={862}
        className="state-image"
        priority
      />
      <p className="state-eyebrow">Something went wrong</p>
      <h1 className="state-title">Beep beep &mdash; that page got away</h1>
      <p className="state-text">
        We couldn&apos;t load this page. The server may have errored, the
        content couldn&apos;t be rendered, or the connection dropped. Catch your
        breath and give it another try.
      </p>
      <Link href="/" className="state-link">
        Back to home
      </Link>
    </div>
  );
}
