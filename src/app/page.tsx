import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { getPageMarkdown, listPages } from "@/lib/content";
import AcmeBoxDecoration from "@/app/_components/AcmeBoxDecoration";

export const dynamic = "force-dynamic";

interface PageInfo {
  slug: string[];
  title: string;
}

export default async function Home(): Promise<React.ReactNode> {
  // If marketing add a content/index.md, serve it as the landing page.
  const markdown: string | null = await getPageMarkdown([]);
  if (markdown !== null) {
    return (
      <>
        <div className="home-background" aria-hidden="true" />
        <article>
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </article>
        <AcmeBoxDecoration />
      </>
    );
  }

  const pages: PageInfo[] = await listPages();
  return (
    <>
      <div className="home-background" aria-hidden="true" />
      <section className="hero">
        <p className="hero-eyebrow">Acme Corporation</p>
        <h1 className="hero-title">Widgets that move the world</h1>
        <p className="hero-intro">
          For over 70 years, Acme Co. has engineered the gadgets, gizmos, and
          contraptions trusted by adventurers everywhere. Explore our latest
          updates and pages below.
        </p>
      </section>
      <nav aria-label="Site pages">
        <p className="section-label">Explore our pages</p>
        <ul className="page-index">
          {pages.map((page) => (
            <li key={page.slug.join("/")}>
              <Link href={`/${page.slug.join("/")}`}>{page.title}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
