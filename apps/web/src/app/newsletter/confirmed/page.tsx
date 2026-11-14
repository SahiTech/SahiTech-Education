import Link from 'next/link';
import { CheckCircle2, MailCheck, XCircle } from 'lucide-react';
import { getServerDictionary, getServerDirection, getServerLocale } from '@/lib/i18n/server';

type Props = { searchParams: Promise<{ status?: string }> };

export default async function NewsletterConfirmedPage({ searchParams }: Props) {
  const [{ status }, dict, direction, locale] = await Promise.all([
    searchParams,
    getServerDictionary(),
    getServerDirection(),
    getServerLocale(),
  ]);
  const copy = dict.home;
  const isSuccess = status === 'success';
  const isUnsubscribed = status === 'unsubscribed';
  const title = isSuccess ? copy.newsletterConfirmTitle : isUnsubscribed ? copy.newsletterUnsubscribeSuccess : copy.newsletterConfirmTitle;
  const message = isSuccess ? copy.newsletterConfirmSuccess : isUnsubscribed ? copy.newsletterUnsubscribeSuccess : copy.newsletterConfirmInvalid;
  const Icon = isSuccess ? MailCheck : isUnsubscribed ? CheckCircle2 : XCircle;

  return (
    <main dir={direction} lang={locale} className="flex min-h-[65vh] items-center justify-center bg-[#F7F4EC] px-4 py-16">
      <section className="w-full max-w-xl rounded-[28px] border border-[#E6DFD1] bg-white p-8 text-center shadow-[0_16px_44px_rgba(22,46,35,0.07)] sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF0E9] text-[#123D32]">
          <Icon className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-[#17372D]">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-[#69736E]">{message}</p>
        <Link href="/" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#123D32] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0B2B24]">
          {copy.footerHome}
        </Link>
        <p className="mt-8 text-xs text-[#69736E]">SahiTech Education · Madrasa Digitalization Initiative (MDI)</p>
      </section>
    </main>
  );
}
