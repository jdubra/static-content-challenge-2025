import ReactMarkdown from "react-markdown";
import { notFound } from "next/navigation";
import { getPageMarkdown } from "@/lib/content";
import AcmeBoxDecoration from "@/app/_components/AcmeBoxDecoration";

// Render on demand so newly added content folders are served without a redeploy.
export const dynamic = "force-dynamic";

interface ContentPageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function ContentPage({ params }: ContentPageProps): Promise<React.ReactNode> {
  const { slug } = await params;
  const markdown = await getPageMarkdown(slug);

  if (markdown === null) {
    notFound();
  }

  return (
    <>
      <article className="article-card">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </article>
      <AcmeBoxDecoration />
    </>
  );
}
