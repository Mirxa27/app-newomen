import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MessageCircle,
  Stars,
  ClipboardList,
  User,
} from "lucide-react";
import routes from "../../routes";

const primaryItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { path: "/chat", icon: MessageCircle, label: "Chat" },
  { path: "/divinations", icon: Stars, label: "Oracle" },
  { path: "/assessments", icon: ClipboardList, label: "Tests" },
  { path: "/profile", icon: User, label: "Me" },
];

function MobileNavBar() {
  // This component must be used inside a Router context
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return (
      location.pathname === path ||
      location.pathname.startsWith(path + "/")
    );
  };

  // Only show on small screens
  return (
    <div className="fixed inset-x-0 bottom-3 z-40 flex justify-center md:hidden pointer-events-none">
      <nav className="pointer-events-auto glass-card backdrop-blur-xl bg-[hsl(var(--background))/0.9] border border-[hsl(var(--border))/0.7] rounded-full px-3 py-1.5 flex items-center justify-between gap-1.5 max-w-md w-[92%] safe-area-inset-bottom shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
        {primaryItems
          .filter((item) =>
            routes.some((r) => r.path === item.path && r.visible !== false)
          )
          .map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                to={path}
                className={
                  "flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 rounded-full px-2 py-1 text-[10px] transition-all duration-300 ease-in-out " +
                  (active
                    ? "bg-[hsl(var(--primary))/0.16] text-[hsl(var(--primary))] scale-110"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:scale-105 active:scale-95")
                }
              >
                <Icon
                  className={
                    "w-4 h-4 mb-0.5 transition-transform duration-300 " +
                    (active
                      ? "text-[hsl(var(--primary))] scale-110"
                      : "text-[hsl(var(--muted-foreground))]")
                  }
                />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
      </nav>
    </div>
  );
}

export default MobileNavBar;
