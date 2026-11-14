import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Building2,
  ClipboardList,
  GraduationCap,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { getServerDictionary, getServerLocale, getServerDirection } from '@/lib/i18n/server';
import { PrayerTimesWidget } from '@/components/home/PrayerTimesWidget';
import { NewsletterForm } from '@/components/home/NewsletterForm';

export default async function HomePage() {
  const dict = await getServerDictionary();
  const locale = await getServerLocale();
  const direction = await getServerDirection();
  const t = dict.home;

  const features = [
    { icon: BookOpen, title: t.qawmiTitle, description: t.qawmiDesc },
    { icon: GraduationCap, title: t.aliaTitle, description: t.aliaDesc },
    { icon: Users, title: t.studentTitle, description: t.studentDesc },
    { icon: Wallet, title: t.financeTitle, description: t.financeDesc },
    { icon: Award, title: t.sanadTitle, description: t.sanadDesc },
  ];

  const journey = [
    { title: t.journeyStep1Title, description: t.journeyStep1Desc },
    { title: t.journeyStep2Title, description: t.journeyStep2Desc },
    { title: t.journeyStep3Title, description: t.journeyStep3Desc },
    { title: t.journeyStep4Title, description: t.journeyStep4Desc },
    { title: t.journeyStep5Title, description: t.journeyStep5Desc },
  ];

  const shortcuts = [
    { title: t.shortcutQuran, href: 'https://quran.com', icon: BookOpen, external: true },
    { title: t.shortcutQibla, href: 'https://qiblafinder.withgoogle.com/', icon: Building2, external: true },
    { title: t.shortcutVerify, href: '/verify', icon: ShieldCheck, external: false },
    { title: t.shortcutRegister, href: '/register-madrasa', icon: ClipboardList, external: false },
  ];

  return (
    <div dir={direction} lang={locale} className="min-h-screen bg-[#F7F4EC] text-[#202B27]">
      <section className="relative isolate overflow-hidden bg-[#0B2B24] text-white">
        <Image
          src="/images/hero-campus.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="absolute inset-0 -z-20 object-cover object-center opacity-35"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(105deg,rgba(7,31,25,0.98)_0%,rgba(11,43,36,0.93)_48%,rgba(11,43,36,0.48)_100%)]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.13]"
          style={{ backgroundImage: "url('/images/islamic-pattern.jpg')", backgroundSize: '360px 360px' }}
        />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-[#C5A66B]/40 bg-white/[0.07] px-4 py-2 text-xs font-semibold text-[#E7D5B2] backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-[#C5A66B]" />
              <span>{t.heroTag}</span>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-semibold tracking-wide text-[#E7D5B2]">
              <span className="text-white">SahiTech</span>
              <span aria-hidden="true" className="text-white/45">/</span>
              <span>SahiTech Education</span>
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.16] tracking-tight sm:text-5xl lg:text-[3.65rem]">
              {t.heroTitle}
              <span className="mt-2 block text-[#D6B875]">{t.heroTitleHighlight}</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-[#E4EAE5] sm:text-lg">
              {t.heroSubtitle}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/register-madrasa"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#C5A66B] px-6 py-3 text-sm font-bold text-[#172D25] shadow-lg shadow-black/20 transition hover:bg-[#D9BC83]"
              >
                {t.registerCta}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/[0.08] px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/[0.15]"
              >
                {t.primaryCta}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
            <Link href="/verify" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#E7D5B2] transition hover:text-white">
              {t.verifySanadCta}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <p className="mt-8 max-w-xl border-s-2 border-[#C5A66B]/70 ps-4 text-sm leading-7 text-white/70">
              {t.brandRelationship}
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-[470px]">
            <div aria-hidden="true" className="absolute -inset-4 rounded-t-[220px] rounded-b-[36px] border border-[#C5A66B]/45" />
            <div className="relative aspect-[4/4.8] overflow-hidden rounded-t-[205px] rounded-b-[28px] border border-white/15 bg-[#163E33] shadow-2xl shadow-black/35">
              <Image
                src="/images/hero-campus.jpg"
                alt=""
                fill
                sizes="(max-width: 1024px) 80vw, 420px"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071F19]/95 via-[#071F19]/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-center sm:p-9">
                <p lang="ar" dir="rtl" className="font-serif text-2xl leading-relaxed text-[#F0D9A6] sm:text-3xl">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
                <div className="mx-auto my-4 h-px w-16 bg-[#C5A66B]/80" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                  Madrasa Digitalization Initiative (MDI)
                </p>
                <p className="mt-2 text-xs text-white/65">An initiative by SahiTech Education</p>
              </div>
            </div>
            <div className="absolute -bottom-5 -start-7 hidden rounded-2xl border border-[#D8C9A8] bg-[#F7F4EC] px-5 py-4 text-[#17372D] shadow-xl sm:block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8E0D0] text-[#8A6A35]">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">SahiTech Education</p>
                  <p className="mt-0.5 text-[11px] text-[#69736E]">An education division of SahiTech</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-8 bg-[#F7F4EC]" style={{ clipPath: 'polygon(0 100%, 0 55%, 50% 0, 100% 55%, 100% 100%)' }} />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#987640]">{t.capabilitiesEyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#17372D] sm:text-4xl">{t.featuresTitle}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#69736E] sm:text-base">{t.featuresSubtitle}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="group relative overflow-hidden rounded-2xl border border-[#E6DFD1] bg-white p-6 shadow-[0_8px_28px_rgba(26,45,35,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(26,45,35,0.09)]">
                <div aria-hidden="true" className="absolute -end-9 -top-9 h-28 w-28 rounded-full border border-[#C5A66B]/25 transition group-hover:scale-110" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF0E9] text-[#1B5947]">
                  <Icon className="h-6 w-6" strokeWidth={1.8} />
                </div>
                <h3 className="relative mt-6 text-lg font-bold text-[#17372D]">{feature.title}</h3>
                <p className="relative mt-3 text-sm leading-7 text-[#69736E]">{feature.description}</p>
                <div className="mt-6 h-px w-14 bg-[#C5A66B] transition-all group-hover:w-24" />
                <span className="absolute bottom-6 end-6 text-xs font-bold tracking-[0.16em] text-[#A88A55]">0{index + 1}</span>
              </article>
            );
          })}
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#EDE8DC]">
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.2]" style={{ backgroundImage: "url('/images/islamic-pattern.jpg')", backgroundSize: '420px 420px' }} />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#987640]">{t.journeyEyebrow}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#17372D] sm:text-4xl">{t.journeyTitle}</h2>
            <p className="mt-4 text-sm leading-7 text-[#69736E] sm:text-base">{t.journeySubtitle}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {journey.map((step, index) => (
              <div key={step.title} className="relative rounded-2xl border border-[#DED5C3] bg-[#FBFAF6]/90 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#C5A66B]/60 bg-[#F3EBDD] text-sm font-bold text-[#7D6032]">{index + 1}</div>
                <h3 className="mt-5 text-base font-bold text-[#17372D]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#69736E]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-9 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#987640]">{t.islamicEyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#17372D] sm:text-4xl">{t.islamicTitle}</h2>
          <p className="mt-4 text-sm leading-7 text-[#69736E] sm:text-base">{t.islamicSubtitle}</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <PrayerTimesWidget
            locale={locale}
            labels={{
              title: t.prayerTitle,
              description: t.prayerDescription,
              locationLabel: t.prayerLocationLabel,
              nextLabel: t.prayerNextLabel,
              loading: t.prayerLoading,
              error: t.prayerError,
              retry: t.prayerRetry,
              sourceNote: t.prayerSourceNote,
              fajr: t.prayerFajr,
              sunrise: t.prayerSunrise,
              dhuhr: t.prayerDhuhr,
              asr: t.prayerAsr,
              maghrib: t.prayerMaghrib,
              isha: t.prayerIsha,
            }}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <Link
                  key={shortcut.href}
                  href={shortcut.href}
                  target={shortcut.external ? '_blank' : undefined}
                  rel={shortcut.external ? 'noopener noreferrer' : undefined}
                  className="group flex min-h-[78px] items-center justify-between rounded-2xl border border-[#E5DDCE] bg-white px-5 py-4 shadow-sm transition hover:border-[#C5A66B] hover:shadow-md"
                >
                  <span className="flex items-center gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF0E9] text-[#1B5947]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-bold text-[#17372D]">{shortcut.title}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-[#A88A55] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-[#123D32] px-6 py-10 text-white shadow-xl shadow-[#123D32]/10 sm:px-10 sm:py-12 lg:px-14">
          <div aria-hidden="true" className="absolute inset-0 opacity-[0.14]" style={{ backgroundImage: "url('/images/islamic-pattern.jpg')", backgroundSize: '340px 340px' }} />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8BD86]">{t.newsletterEyebrow}</p>
              <h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">{t.newsletterTitle}</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-white/75">{t.newsletterSubtitle}</p>
            </div>
            <NewsletterForm
              locale={locale}
              labels={{
                emailLabel: t.newsletterEmailLabel,
                placeholder: t.newsletterPlaceholder,
                button: t.newsletterButton,
                consent: t.newsletterConsent,
                success: t.newsletterSuccess,
                error: t.newsletterError,
              }}
            />
          </div>
        </div>
      </section>

      <footer className="relative overflow-hidden bg-[#09251E] text-white">
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "url('/images/islamic-pattern.jpg')", backgroundSize: '360px 360px' }} />
        <div aria-hidden="true" className="absolute -end-20 -top-28 h-80 w-80 rounded-full border border-[#C5A66B]/25" />
        <div aria-hidden="true" className="absolute -end-10 -top-20 h-60 w-60 rounded-full border border-[#C5A66B]/20" />
        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-6 lg:px-8 lg:pt-16">
          <div className="grid gap-10 border-b border-white/15 pb-12 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
            <div className="max-w-md">
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[#C5A66B]/50 bg-white/[0.06] text-[#D8BD86]">
                <BookOpen className="h-7 w-7" />
              </div>
              <p className="text-xl font-bold tracking-tight">SahiTech Education</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#D8BD86]">Madrasa Digitalization Initiative (MDI)</p>
              <p className="mt-5 text-sm leading-7 text-white/70">{t.footerAbout}</p>
              <p className="mt-4 text-sm leading-7 text-white/80">{t.footerDivisionStatement}</p>
              <p className="mt-2 text-sm leading-7 text-white/80">{t.footerInitiativeStatement}</p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#E9D8B7]">{t.footerLinksLabel}</h3>
              <div className="mt-5 flex flex-col items-start gap-3 text-sm text-white/75">
                <Link className="transition hover:text-white" href="/">{t.footerHome}</Link>
                <Link className="transition hover:text-white" href="/dashboard">{t.footerDashboard}</Link>
                <Link className="transition hover:text-white" href="/register-madrasa">{t.footerRegister}</Link>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#E9D8B7]">{t.footerResourcesLabel}</h3>
              <div className="mt-5 flex flex-col items-start gap-3 text-sm text-white/75">
                <Link className="transition hover:text-white" href="/verify">{t.footerVerify}</Link>
                <a className="transition hover:text-white" href="https://quran.com" target="_blank" rel="noopener noreferrer">{t.shortcutQuran}</a>
                <a className="transition hover:text-white" href="https://qiblafinder.withgoogle.com/" target="_blank" rel="noopener noreferrer">{t.shortcutQibla}</a>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-6 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} SahiTech Education. {t.footerCopyright}</p>
            <p className="tracking-wide">SahiTech <span className="px-1 text-[#C5A66B]">/</span> SahiTech Education <span className="px-1 text-[#C5A66B]">/</span> MDI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
