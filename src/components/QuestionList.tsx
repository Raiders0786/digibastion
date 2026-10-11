import { Link } from 'react-router-dom';
import type { FaqEntry } from '@/seo/siteFacts';
import type { PrerenderLink } from '@/seo/routeTypes';

const linkClass = 'font-medium text-primary underline-offset-2 hover:underline';

export const AnswerLink = ({ link }: { link: PrerenderLink }) => (
  link.href.startsWith('/')
    ? <Link to={link.href} className={linkClass}>{link.label}</Link>
    : <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>{link.label}</a>
);

/**
 * Short Q&A with real headings, so a reader or an answer engine can quote
 * one answer on its own. Entries come from faqEntries() in siteFacts.
 */
export const QuestionList = ({ entries, idPrefix }: { entries: readonly FaqEntry[]; idPrefix: string }) => (
  <div className="space-y-6">
    {entries.map((entry) => (
      <div key={entry.id} className="space-y-2">
        <h3 id={`${idPrefix}-${entry.id}`} className="text-base font-semibold text-foreground">{entry.question}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{entry.answer}</p>
        {entry.links && entry.links.length > 0 && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {entry.links.map((link) => <li key={link.href}><AnswerLink link={link} /></li>)}
          </ul>
        )}
      </div>
    ))}
  </div>
);
