import Link from 'next/link';
import { Hero } from '@/components/home/Hero';
import { FeatureMarquee } from '@/components/home/FeatureMarquee';
import { QuickTools } from '@/components/home/QuickTools';
import { BranchSelector } from '@/components/home/BranchSelector';
import { WhyVidyaaraa } from '@/components/home/WhyVidyaaraa';
import { RequestNotes } from '@/components/home/RequestNotes';
import { FeedbackSection } from '@/components/home/FeedbackSection';
import { ChevronRight, GraduationCap } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. HERO */}
      <Hero />

      {/* 2. MOVING FEATURE STRIP (MARQUEE) */}
      <FeatureMarquee />

      {/* 3. QUICK TOOLS */}
      <QuickTools />

      {/* 4. CHOOSE YOUR BRANCH */}
      <BranchSelector />

      {/* 5. WHY VIDYAARAA */}
      <WhyVidyaaraa />

      {/* 6. REQUEST NOTES */}
      <RequestNotes />

      {/* 7. FEEDBACK */}
      <FeedbackSection />

      {/* 8. FINAL CTA */}
      <section className="py-12 sm:py-16 bg-[var(--bg-raised)] border-t border-[var(--bd)] text-center">
        <div className="container-cf max-w-3xl space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-[rgba(0,212,170,0.1)] border border-[rgba(0,212,170,0.2)] flex items-center justify-center mx-auto text-[var(--accent)] shadow-md">
            <GraduationCap size={24} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-1)]">
              Ready to simplify your college prep?
            </h2>
            <p className="text-sm text-[var(--text-2)] max-w-md mx-auto">
              Get instant access to notes, question papers, grade calculators, and AI assistance without sign-up or ads.
            </p>
          </div>
          <div className="flex flex-wrap gap-3.5 justify-center pt-2">
            <Link href="/resources" className="btn btn-primary btn-lg flex items-center">
              <span>Explore Resources</span>
              <ChevronRight size={18} />
            </Link>
            <Link
              href="https://biet-sgpa-auto.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-lg"
            >
              Try Calculators
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
