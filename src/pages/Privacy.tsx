import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Footer } from '@/components/Footer';
import { MetaTags } from '@/components/MetaTags';
import { Navbar } from '@/components/Navbar';
import { CORRECTIONS_EMAIL } from '@/lib/threatIntel/officialLinks';
import { staticRouteMeta, toMetaTagsProps } from '@/seo/routeMeta';
import { serializeJsonLd } from '@/utils/jsonLd';

const pageMeta = staticRouteMeta('/privacy');

/** Bump when a statement below changes. Every statement was checked against the code on this date. */
export const PRIVACY_LAST_UPDATED = '11 October 2026';

const linkClass = 'font-medium text-primary underline-offset-2 hover:underline';

const Section = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => (
  <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-28 space-y-3">
    <h2 id={`${id}-heading`} className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
    {children}
  </section>
);

const Paragraph = ({ children }: { children: ReactNode }) => (
  <p className="leading-7 text-muted-foreground">{children}</p>
);

const List = ({ items }: { items: ReactNode[] }) => (
  <ul className="list-disc space-y-2 pl-5 leading-7 text-muted-foreground">
    {items.map((item, index) => <li key={index}>{item}</li>)}
  </ul>
);

const Privacy = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <MetaTags {...toMetaTagsProps(pageMeta)} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageMeta.jsonLd) }} />
    <Navbar />
    <main className="flex-1 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl space-y-10">
        <header className="space-y-3">
          <p className="text-sm text-muted-foreground">Last updated: {PRIVACY_LAST_UPDATED}</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{pageMeta.body.h1}</h1>
          <Paragraph>
            You do not need an account to read Threat Intel, the guides or the checklists, or to take the OpSec self-check.
            We collect only what a feature needs to work, and we do not sell data or show ads. This page lists what each
            feature stores.
          </Paragraph>
        </header>

        <Section id="subscriptions" title="Email subscriptions">
          <Paragraph>When you subscribe to alerts or newsletters, we store:</Paragraph>
          <List
            items={[
              'your email address, and your name if you give one;',
              'the filters you pick: categories, technologies, minimum severity, chains, and whether to include unconfirmed reports;',
              'which emails you want, your timezone and your delivery hour;',
              'where you signed up, and a one-way hash of your IP address at that moment, as a record of your consent.',
            ]}
          />
          <Paragraph>
            To stop abuse, the sign-up and contact forms count requests per hashed email address and hashed IP address.
          </Paragraph>
        </Section>

        <Section id="emails" title="What our emails record">
          <List
            items={[
              'Real-time alerts, the daily brief and the weekly deep-dive contain no tracking pixel. We record that each email was sent, and whether our email provider reports it as delivered, bounced or marked as spam.',
              'Links in these emails carry utm tags that name the email type, so we can see which emails bring readers to the site. The tags do not identify you.',
              'The older daily and weekly digest emails, which go out until the new newsletters launch, do contain a tracking pixel and tracked links. When you open one or click a link, we record the time, the link, a hashed IP address, your country and region, your device type, your email app and your browser’s user-agent string.',
              'If an address bounces or reports an email as spam, we add a hash of the address to a suppression list and turn the subscription off.',
            ]}
          />
        </Section>

        <Section id="unsubscribe" title="Unsubscribing and deletion">
          <Paragraph>
            Every email has an unsubscribe link, and a one-click unsubscribe header that many mail apps show as an
            Unsubscribe button. You can also change or stop your emails on the{' '}
            <Link to="/manage-subscription" className={linkClass}>subscription page</Link>.
          </Paragraph>
          <Paragraph>
            Unsubscribing stops all emails but keeps your saved preferences, so you can come back. To delete your
            subscription record entirely, email{' '}
            <a href={`mailto:${CORRECTIONS_EMAIL}`} className={linkClass}>{CORRECTIONS_EMAIL}</a>{' '}
            from the address you subscribed with.
          </Paragraph>
        </Section>

        <Section id="self-check" title="OpSec self-check and leaderboard">
          <Paragraph>
            Your answers are scored on our server. Each self-check session stores a hash of your IP address so a score
            cannot be replayed from another connection. If you enter a display name other than “anon”, we store that name
            with your score, badge count and rank, and the top 50 scores appear on the{' '}
            <Link to="/leaderboard" className={linkClass}>leaderboard</Link>. With “anon”, no score is saved.
          </Paragraph>
          <Paragraph>
            Profile pictures on result and challenge cards load from unavatar.io, using the handle you type.
          </Paragraph>
        </Section>

        <Section id="browser" title="What stays in your browser">
          <Paragraph>
            Checklist progress, your chosen threat level, your score history, the theme and a few display settings are
            saved in your browser’s local storage. They never reach our servers, and clearing your site data removes them.
          </Paragraph>
        </Section>

        <Section id="contact" title="Contact form">
          <Paragraph>
            The <Link to="/contact" className={linkClass}>contact form</Link> sends your name, email address, topic,
            optional social handle and message to Web3Forms, which emails them to us.
          </Paragraph>
        </Section>

        <Section id="providers" title="Services we use">
          <List
            items={[
              'Lovable hosts the website.',
              'Supabase, through Lovable Cloud, runs the database and the server functions.',
              'Resend sends our emails.',
              'Web3Forms delivers contact-form messages.',
              'Google Fonts serves the fonts, so your browser contacts Google when a page loads.',
              'unavatar.io serves profile pictures in the self-check.',
            ]}
          />
          <Paragraph>
            We have not added analytics or advertising scripts to www.digibastion.com. Our hosting providers keep their
            own standard request logs.
          </Paragraph>
        </Section>

        <Section id="questions" title="Questions">
          <Paragraph>
            Email <a href={`mailto:${CORRECTIONS_EMAIL}`} className={linkClass}>{CORRECTIONS_EMAIL}</a> with any
            question about your data. The <Link to="/faq" className={linkClass}>FAQ</Link> covers how the rest of the
            site works.
          </Paragraph>
        </Section>
      </article>
    </main>
    <Footer />
  </div>
);

export default Privacy;
