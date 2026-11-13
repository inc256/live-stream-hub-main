import { Baby, Clapperboard, Film, Globe2, Home, Menu, Newspaper, Search, Tv2, Trophy, UsersRound } from "lucide-react";
import { NavLink } from "react-router-dom";
import { BROWSABLE_CATEGORIES, CategoryId } from "@/lib/iptv";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const categoryIcons: Record<string, typeof Clapperboard> = {
  entertainment: Clapperboard,
  sports: Trophy,
  movies: Film,
  news: Newspaper,
  family: UsersRound,
  kids: Baby,
  international: Globe2,
};

const categoryOrder: CategoryId[] = ["sports", "entertainment", "movies", "news", "family", "kids", "international"];
const orderedCategories = [...BROWSABLE_CATEGORIES].sort(
  (a, b) => categoryOrder.indexOf(a.id) - categoryOrder.indexOf(b.id),
);

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  ...orderedCategories.map((category) => ({
    to: `/category/${category.id}`,
    label: category.label,
    icon: categoryIcons[category.id as CategoryId] ?? Clapperboard,
  })),
];

const mobileTabItems = [
  items[0],
  items[1],
  ...items.filter((item) => item.to === "/category/sports" || item.to === "/category/movies"),
];

function NavigationLinks() {
  return (
    <>
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.to === "/"}
          className={({ isActive }) =>
            `tv-focus flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-semibold transition-all duration-150 ${
              isActive
                ? "border-primary/40 bg-primary/20 text-white shadow-[0_8px_24px_rgba(10,132,255,0.16)]"
                : "border-transparent bg-white/[0.035] text-white/80 hover:border-white/10 hover:bg-white/[0.09] hover:text-white"
            }`
          }
        >
          <it.icon className="h-5 w-5 shrink-0" />
          <span>{it.label}</span>
        </NavLink>
      ))}
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden h-full w-64 shrink-0 p-4 md:flex lg:w-72">
      <div className="flex min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-[rgba(20,20,25,0.6)] shadow-[0_20px_40px_rgba(0,0,0,0.55)] backdrop-blur-[40px]">
        <div className="flex items-center gap-3 px-5 pb-3 pt-5">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.08] text-white shadow-[0_8px_20px_rgba(0,0,0,0.35)]">
            <Tv2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none text-white">SupaMax Live</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">Browse</p>
          </div>
        </div>
        <nav className="flex min-h-0 w-full flex-col gap-1 overflow-y-auto px-3 pb-4 pt-1">
          <NavigationLinks />
        </nav>
      </div>
    </aside>
  );
}

export function MobileTopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-black/40 px-4 backdrop-blur-2xl md:hidden">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Tv2 className="h-4 w-4" />
        </div>
        <span className="text-sm font-extrabold">SupaMax <span className="text-primary">Live</span></span>
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open navigation menu"
            className="tv-focus grid h-10 w-10 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col gap-6 border-white/10 bg-background">
          <SheetTitle className="flex items-center gap-2 pr-8">
            <Tv2 className="h-5 w-5 text-primary" />
            SupaMax Live
          </SheetTitle>
          <nav className="flex flex-col gap-1">
            {items.map((item) => (
              <SheetClose asChild key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `tv-focus flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium ${
                      isActive
                        ? "border-primary/40 bg-primary/20 font-semibold text-white shadow-[0_8px_24px_rgba(10,132,255,0.16)]"
                        : "border-transparent bg-white/[0.035] text-white/80 hover:border-white/10 hover:bg-white/[0.09] hover:text-white"
                    }`
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              </SheetClose>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}

export function MobileTabBar() {
  return (
    <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-white/5 bg-black/40 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-2xl md:hidden">
      {mobileTabItems.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.to === "/"}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-semibold ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`
          }
        >
          <it.icon className="h-5 w-5" />
          {it.label}
        </NavLink>
      ))}
    </nav>
  );
}
