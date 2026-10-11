import { Link } from 'react-router-dom';
import { Footer } from '@/components/Footer';
import { MetaTags } from '@/components/MetaTags';
import { Navbar } from '@/components/Navbar';
import { staticRouteMeta, toMetaTagsProps } from '@/seo/routeMeta';
import { faqEntries, type FaqEntry } from '@/seo/siteFacts';
import type { PrerenderLink } from '@/seo/routeTypes';
import { serializeJsonLd } from '@/utils/jsonLd';

const pageMeta = staticRouteMeta('/faq');

const FaqLink = ({ link }: { link: PrerenderLink }) => (
  link.href.startsWith('/')
    ? <Link to={link.href} className="font-medium text-primary underline-offset-2 hover:underline">{link.label}</Link>
    : (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-2 hover:underline">
        {link.label}
      </a>
    )
);

const FaqItem = ({ entry }: { entry: FaqEntry }) => (
  <section aria-labelledby={entry.id} className="scroll-mt-28 space-y-3">
    <h2 id={entry.id} className="text-xl font-semibold tracking-tight text-foreground">{entry.question}</h2>
    <p className="leading-7 text-muted-foreground">{entry.answer}</p>
    {entry.links && entry.links.length > 0 && (
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {entry.links.map((link) => <li key={link.href}><FaqLink link={link} /></li>)}
      </ul>
    )}
  </section>
);

const Faq = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <MetaTags {...toMetaTagsProps(pageMeta)} />
    {/* The FAQPage JSON-LD is built from the same entries rendered below. */}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageMeta.jsonLd) }} />
    <Navbar />
    <main className="flex-1 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl space-y-10">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{pageMeta.body.h1}</h1>
          <p className="leading-7 text-muted-foreground">{pageMeta.description}</p>
        </header>
        {faqEntries().map((entry) => <FaqItem key={entry.id} entry={entry} />)}
      </article>
    </main>
    <Footer />
  </div>
);

export default Faq;
