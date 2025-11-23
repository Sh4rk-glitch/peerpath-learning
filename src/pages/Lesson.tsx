import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import lessonGen from "@/lib/lessonGenerator";

const Lesson = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const subject = searchParams.get('subject') || 'general';
  const index = Number(searchParams.get('index') || '1');
  const [lesson, setLesson] = useState<{ title: string; content: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    lessonGen.getLesson(subject, index).then(l => { if (mounted) setLesson(l); });
    return () => { mounted = false; };
  }, [subject, index]);

  if (!lesson) return (<div className="min-h-screen bg-background"><Navigation /><div className="container py-8">Loading lesson...</div></div>);

  const renderBlock = (block: string, i: number) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    // Headings by known prefixes
    if (trimmed.startsWith('Overview:')) {
      const rest = trimmed.replace(/^Overview:\s*/i, '');
      return (
        <section key={i} className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Overview</h3>
          <p>{rest}</p>
        </section>
      );
    }

    if (trimmed.startsWith('Key Concepts:')) {
      // lines starting with '- '
      const lines = trimmed.split('\n').slice(1).map(l => l.trim()).filter(Boolean);
      const items = lines.map(l => l.replace(/^[-\u2022\*]\s*/, ''));
      return (
        <section key={i} className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Key Concepts</h3>
          <ul className="list-disc ml-6 space-y-1">
            {items.map((it, idx) => <li key={idx}>{it}</li>)}
          </ul>
        </section>
      );
    }

    if (trimmed.startsWith('Detailed Explanation:')) {
      const rest = trimmed.replace(/^Detailed Explanation:\s*/i, '');
      // split into paragraphs by double newlines
      const paras = rest.split('\n\n').map(p => p.trim()).filter(Boolean);
      return (
        <section key={i} className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Detailed Explanation</h3>
          {paras.map((p, idx) => <p key={idx} className="mb-3">{p}</p>)}
        </section>
      );
    }

    if (trimmed.startsWith('Worked Examples & Practice:')) {
      const rest = trimmed.replace(/^Worked Examples & Practice:\s*/i, '');
      const lines = rest.split('\n').map(l => l.trim()).filter(Boolean);
      // handle numbered items like '1) ...'
      const numbered = lines.filter(l => /^\d+\)/.test(l));
      const others = lines.filter(l => !/^\d+\)/.test(l));
      return (
        <section key={i} className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Worked Examples & Practice</h3>
          {others.map((p, idx) => <p key={idx} className="mb-2">{p}</p>)}
          {numbered.length > 0 && (
            <ol className="list-decimal ml-6 space-y-1">
              {numbered.map((n, idx) => (
                <li key={idx}>{n.replace(/^\d+\)\s*/, '')}</li>
              ))}
            </ol>
          )}
        </section>
      );
    }

    if (trimmed.startsWith('Applications & Labs:')) {
      const rest = trimmed.replace(/^Applications & Labs:\s*/i, '');
      const paras = rest.split('\n').map(p => p.trim()).filter(Boolean);
      return (
        <section key={i} className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Applications & Labs</h3>
          {paras.map((p, idx) => <p key={idx}>{p}</p>)}
        </section>
      );
    }

    if (trimmed.startsWith('Summary & Next Steps:')) {
      const rest = trimmed.replace(/^Summary & Next Steps:\s*/i, '');
      return (
        <section key={i} className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Summary & Next Steps</h3>
          <p>{rest}</p>
        </section>
      );
    }

    // Generic: convert lists and paragraphs
    const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
    const isList = lines.every(l => /^[-\u2022\*]\s+/.test(l) || /^\d+\)/.test(l));
    if (isList) {
      const isNumbered = /^\d+\)/.test(lines[0]);
      return isNumbered ? (
        <ol key={i} className="list-decimal ml-6 space-y-1">{lines.map((l, idx) => <li key={idx}>{l.replace(/^\d+\)\s*/, '')}</li>)}</ol>
      ) : (
        <ul key={i} className="list-disc ml-6 space-y-1">{lines.map((l, idx) => <li key={idx}>{l.replace(/^[-\u2022\*]\s*/, '')}</li>)}</ul>
      );
    }

    // Fallback paragraph(s)
    const paras = trimmed.split('\n\n').map(p => p.trim()).filter(Boolean);
    return (
      <section key={i} className="mb-6">
        {paras.map((p, idx) => <p key={idx} className="mb-3">{p}</p>)}
      </section>
    );
  };

  const blocks = lesson.content.split('\n\n');

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container py-8">
        <Card className="p-8">
          <h1 className="text-2xl font-semibold mb-4">{lesson.title}</h1>
          <div className="prose max-w-none mb-6">
            {blocks.map((b, i) => renderBlock(b, i))}
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => navigate(-1)}>Back to Subject</Button>
            <Button onClick={() => {
              const url = `/quiz?subject=${encodeURIComponent(subject)}&index=${index}&count=5&style=mixed&newtab=1`;
              window.open(url, '_blank');
            }}>Next: Quiz</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Lesson;
