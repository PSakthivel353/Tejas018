import Link from "next/link";
import { Building2, ChevronRight, GraduationCap, Landmark } from "lucide-react";
import { DISTRICT } from "@/lib/mock";

const portals = [
  {
    href: "/seeker",
    icon: GraduationCap,
    title: "I am looking for work",
    text: "Upload your CV and see openings near you that fit your trade.",
  },
  {
    href: "/employer",
    icon: Building2,
    title: "I am hiring",
    text: "Post a vacancy and review the candidates matched to it.",
  },
  {
    href: "/officer",
    icon: Landmark,
    title: "I plan training for the district",
    text: "See where demand is growing and which trades need more seats.",
  },
];

export default function Home() {
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:gap-20 lg:py-10">
      <div>
        <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-6xl">
          Train for the jobs your district is hiring for.
        </h1>
        <p className="mt-6 max-w-md text-lg text-muted">
          SkillBridge compares what local employers will need with what ITIs teach, so young people find work near
          home and officers know which courses to grow. Pilot district: {DISTRICT}.
        </p>
      </div>

      <ul className="divide-y divide-line border-y border-line">
        {portals.map(({ href, icon: Icon, title, text }) => (
          <li key={href}>
            <Link href={href} className="group flex items-center gap-4 px-2 py-5 transition-colors hover:bg-sunken">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <Icon size={22} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-semibold">{title}</span>
                <span className="block text-sm text-muted">{text}</span>
              </span>
              <ChevronRight size={20} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
