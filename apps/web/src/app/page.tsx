import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BookOpen,
  Building2,
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
  Award,
  Globe2,
  Landmark,
  ChevronDown,
} from 'lucide-react';
import { getServerDictionary } from '@/lib/i18n/server';

export default async function HomePage() {
  const dict = await getServerDictionary();

  const capabilities = [
    {
      icon: BookOpen,
      title: dict.home.qawmiTitle,
      description: dict.home.qawmiDesc,
      tone: 'bg-amber-50 text-amber-800',
    },
    {
      icon: GraduationCap,
      title: dict.home.aliaTitle,
      description: dict.home.aliaDesc,
      tone: 'bg-sky-50 text-sky-800',
    },
    {
      icon: ShieldCheck,
      title: dict.home.securityTitle,
      description: dict.home.securityDesc,
      tone: 'bg-emerald-50 text-emerald-800',
    },
  ];

  const pathways = [
    {
      icon: HeartHandshake,
      title: dict.home.liveStatsStudents,
      description: dict.home.qawmiDesc,
    },
    {
      icon: Award,
      title: dict.home.verifySanadCta,
      description: dict.home.aliaDesc,
    },
    {
      icon: Building2,
      title: dict.home.publicSiteCta,
      description: dict.home.featuresSubtitle,
    },
  ];

  return (
    <div className="min-h-screen bg-[#fbfaf6] text-slate-900">
      <section className="relative isolate flex min-h-[620px] items-center overflow-hidden bg-[#082f2a] text-white sm:min-h-[700px]">
        <div className="absolute inset-0 -z-30">
          <Image
            src="/images/hero-campus.jpg"
            alt="Islamic educational campus architecture"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 -z-20 bg-gradient-to-r from-[#052c27]/95 via-[#073b32]/85 to-[#092f2b]/65" />
        <div
          className="absolute inset-0 -z-10 opacity-[0.12]"
          style={{
            backgroundImage: "url('/images/islamic-pattern.jpg')",
            backgroundSize: '300px 300px',
          }}
          aria-hidden="true"
        />
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-10">
          <div className="max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-amber-200/30 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-amber-100 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-amber-300" />
              {dict.home.heroTag}
            </div>
            <h1 className="text-4xl font-bold leading-[1.18] tracking-tight sm:text-5xl lg:text-6xl">
              {dict.home.heroTitle}
              <span className="mt-2 block text-amber-200">{dict.home.heroTitleHighlight}</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-emerald-50/90 sm:text-lg">
              {dict.home.heroSubtitle}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register-madrasa"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#c9a45c] px-6 py-3 text-sm font-bold text-[#172b25] shadow-lg shadow-black/15 transition hover:bg-[#dfbd79]"
              >
                {dict.nav.registerMadrasa}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <Link
                href="/verify"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                <ShieldCheck className="h-4 w-4" />
                {dict.home.verifySanadCta}
              </Link>
            </div>
            <a href="#capabilities" className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-emerald-100/80 hover:text-white">
              {dict.home.featuresTitle}
              <ChevronDown className="h-4 w-4" />
            </a>
          </div>

          <div className="hidden lg:block">
            <div className="rounded-[2rem] border border-white/20 bg-white/10 p-3 shadow-2xl shadow-black/25 backdrop-blur-md">
              <div className="rounded-[1.5rem] border border-amber-100/20 bg-[#f8f5eb] p-8 text-[#173c32]">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9dfc8] text-[#8c6b32]">
                  <Landmark className="h-7 w-7" />
                </div>
                <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#947747]">SahiTech Education</p>
                <h2 className="mt-3 text-2xl font-bold leading-snug">{dict.home.featuresTitle}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{dict.home.featuresSubtitle}</p>
                <div className="mt-7 flex items-center gap-3 border-t border-[#e8dfcd] pt-5 text-xs font-semibold text-[#567365]">
                  <Globe2 className="h-4 w-4" />
                  <span>Madrasa Digitalization Initiative</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="capabilities" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#e7dcc5] bg-[#f3eee2] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#80663b]">
            <BookOpen className="h-4 w-4" />
            SahiTech Education
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-[#153d32] sm:text-4xl">{dict.home.featuresTitle}</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">{dict.home.featuresSubtitle}</p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {capabilities.map(({ icon: Icon, title, description, tone }) => (
            <article key={title} className="group rounded-2xl border border-[#e9e4d9] bg-white p-7 shadow-[0_8px_30px_rgba(28,55,43,0.04)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(28,55,43,0.09)]">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-[#173d32]">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
              <div className="mt-6 h-px w-full bg-[#eee9df]" />
              <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#8a7042]">
                {dict.common.view}
                <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e9e2d4] bg-[#f2efe6]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a7042]">Madrasa Digitalization Initiative</p>
              <h2 className="mt-4 text-3xl font-bold leading-tight text-[#153d32]">{dict.home.heroTitleHighlight}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">{dict.home.heroSubtitle}</p>
              <Link href="/register-madrasa" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#174c3d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d3b30]">
                {dict.nav.registerMadrasa}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {pathways.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-xl border border-[#e5dece] bg-white/80 p-5">
                  <Icon className="h-6 w-6 text-[#987943]" />
                  <h3 className="mt-4 text-base font-bold text-[#173d32]">{title}</h3>
                  <p className="mt-2 text-xs leading-6 text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#092f29] px-5 py-10 text-emerald-50 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-bold tracking-tight text-white">SahiTech Education</p>
            <p className="mt-1 text-xs text-emerald-100/70">Madrasa Digitalization Initiative (MDI)</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-emerald-100/80">
            <Link href="/verify" className="hover:text-white">{dict.home.verifySanadCta}</Link>
            <Link href="/register-madrasa" className="hover:text-white">{dict.nav.registerMadrasa}</Link>
            <Link href="/login" className="hover:text-white">{dict.nav.login}</Link>
          </div>
          <p className="text-xs text-emerald-100/60">© {new Date().getFullYear()} SahiTech Education</p>
        </div>
      </footer>
    </div>
  );
}
