import Image from "next/image";

// Decorative box pinned to the bottom of the viewport, straddling the footer.
// Rendered only on pages that successfully parse a markdown file.
export default function AcmeBoxDecoration(): React.ReactNode {
  return (
    <Image
      src="/acme_box.png"
      alt=""
      aria-hidden="true"
      width={500}
      height={500}
      className="acme-box-decoration"
    />
  );
}
