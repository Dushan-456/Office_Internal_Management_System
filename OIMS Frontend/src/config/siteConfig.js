import dark_logo1 from "../assets/images/logo1.png";
import light_logo1 from "../assets/images/logo1.png";
import dark_logo2 from "../assets/images/dark-logo2.png";
import light_logo2 from "../assets/images/light-logo2.png";

export const siteConfig = {
  name: "PGIM OIMS Portal",
  motto: "Advanced PostGraduate Institute of Management",
  logo: light_logo1, // Fallback or main logo
  "light-logo1": light_logo1,
  "dark-logo1": dark_logo1,
  "light-logo2": light_logo2,
  "dark-logo2": dark_logo2,
  favicon: light_logo1,
  coverImage:
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000",
  colors: {
    primary: "#6366f1", // Deep Indigo
    secondary: "#230666ff", // Vibrant Violet
    accent: "#06b6d4", // Electric Cyan
    background: "#f8fafc",
    surface: "rgba(255, 255, 255, 0.7)", // Glass base transparency
    text: "#1e293b",
    textMuted: "#64748b",
    dark: {
      background: "#0f172a", // Deep Slate
      surface: "rgba(15, 23, 42, 0.7)", // Dark glass
      text: "#f8fafc",
      textMuted: "#94a3b8",
    },
  },
  glass: {
    background: "rgba(255, 255, 255, 0.6)",
    border: "rgba(255, 255, 255, 0.4)",
    blur: "12px",
  },
};
