import { createSignal } from "solid-js";
import { translator } from "@solid-primitives/i18n";

import ar from "../../locales/ar.json" with { type: "json" };
import ca from "../../locales/ca.json" with { type: "json" };
import cs from "../../locales/cs.json" with { type: "json" };
import da from "../../locales/da.json" with { type: "json" };
import de from "../../locales/de.json" with { type: "json" };
import el from "../../locales/el.json" with { type: "json" };
import en from "../../locales/en.json" with { type: "json" };
import eo from "../../locales/eo.json" with { type: "json" };
import es from "../../locales/es.json" with { type: "json" };
import fa from "../../locales/fa.json" with { type: "json" };
import fi from "../../locales/fi.json" with { type: "json" };
import fr from "../../locales/fr.json" with { type: "json" };
import ga from "../../locales/ga.json" with { type: "json" };
import hu from "../../locales/hu.json" with { type: "json" };
import id from "../../locales/id.json" with { type: "json" };
import it from "../../locales/it.json" with { type: "json" };
import ja from "../../locales/ja.json" with { type: "json" };
import ka from "../../locales/ka.json" with { type: "json" };
import lt from "../../locales/lt.json" with { type: "json" };
import nb from "../../locales/nb.json" with { type: "json" };
import nl from "../../locales/nl.json" with { type: "json" };
import pl from "../../locales/pl.json" with { type: "json" };
import pt from "../../locales/pt.json" with { type: "json" };
import ro from "../../locales/ro.json" with { type: "json" };
import ru from "../../locales/ru.json" with { type: "json" };
import sv from "../../locales/sv.json" with { type: "json" };
import th from "../../locales/th.json" with { type: "json" };
import tr from "../../locales/tr.json" with { type: "json" };
import uk from "../../locales/uk.json" with { type: "json" };
import vi from "../../locales/vi.json" with { type: "json" };
import zh from "../../locales/zh.json" with { type: "json" };
import zhHant from "../../locales/zh-Hant.json" with { type: "json" };

export const dictionaries: Record<string, Record<string, string>> = {
  ar,
  ca,
  cs,
  da,
  de,
  el,
  en,
  eo,
  es,
  fa,
  fi,
  fr,
  ga,
  hu,
  id,
  it,
  ja,
  ka,
  lt,
  nb,
  nl,
  pl,
  pt,
  ro,
  ru,
  sv,
  th,
  tr,
  uk,
  vi,
  zh,
  "zh-CN": zh,
  "zh-Hant": zhHant,
  "zh-TW": zhHant,
  "zh-HK": zhHant,
};

export interface LocaleItem {
  code: string;
  name: string;
  isRoot: boolean;
  prefix: string;
}

export function parseLocales(raw?: string): LocaleItem[] {
  const config =
    raw ||
    (typeof process !== "undefined" && process.env?.MULTILINGUAL_LOCALES) ||
    "zh:中文, en:English";
  const entries = config.split(",").map((s) => s.trim()).filter(Boolean);
  return entries.map((entry, index) => {
    const [rawCode, ...rest] = entry.split(":");
    const code = rawCode.trim().toLowerCase();
    const name = rest.join(":").trim() || code.toUpperCase();
    return {
      code,
      name,
      isRoot: index === 0,
      prefix: index === 0 ? "" : `/${code}`,
    };
  });
}

let cachedLocales: LocaleItem[] | null = null;
export function getLocales(): LocaleItem[] {
  if (!cachedLocales) {
    cachedLocales = parseLocales();
  }
  return cachedLocales;
}

export function getDefaultLocale(): LocaleItem {
  return getLocales()[0];
}

export function getActiveLocale(pathname: string, locales = getLocales()): LocaleItem {
  for (let i = 1; i < locales.length; i++) {
    const loc = locales[i];
    if (new RegExp(`^${loc.prefix}(/|$)`, "i").test(pathname)) {
      return loc;
    }
  }
  return locales[0]; // Root locale
}

export function resolveTargetUrl(
  targetLoc: LocaleItem,
  currentPath: string,
  locales = getLocales()
): string {
  let basePath = currentPath;
  for (let i = 1; i < locales.length; i++) {
    const loc = locales[i];
    const prefixRegex = new RegExp(`^${loc.prefix}(/|$)`, "i");
    if (prefixRegex.test(basePath)) {
      basePath = basePath.replace(prefixRegex, "/") || "/";
      break;
    }
  }

  if (targetLoc.isRoot) {
    return basePath;
  }
  const cleanBase = basePath === "/" ? "" : basePath;
  return `${targetLoc.prefix}${cleanBase}` || "/";
}

export function getGhostFilterForLocale(localeCode?: string, locales = getLocales()): string {
  const current = locales.find((l) => l.code === localeCode) || locales[0];
  if (current.isRoot) {
    const exclusions = locales
      .filter((l) => !l.isRoot)
      .map((l) => `tag:-hash-${l.code}`)
      .join("+");
    return exclusions;
  }
  return `tag:hash-${current.code}`;
}

export const [locale, setLocale] = createSignal<string>(getDefaultLocale().code);

if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem("attegi_locale");
    if (saved && (dictionaries[saved] || saved === "zh" || saved === "en")) {
      setLocale(saved);
      document.documentElement.lang = saved;
    }
  } catch {}
}

export function changeLocale(newLocale: string) {
  setLocale(newLocale);
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem("attegi_locale", newLocale);
    } catch {}
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = newLocale;
  }
}

const resolver = (template: string, args?: Record<string, any>): string => {
  if (!args) return template;
  let res = template;
  for (const [k, v] of Object.entries(args)) {
    res = res.replaceAll(`{${k}}`, String(v)).replaceAll(`{{${k}}}`, String(v));
    if (k === "count" || k === "minutes" || k === "minute") {
      res = res.replaceAll("%", String(v));
    }
  }
  return res;
};

const dict = () => dictionaries[locale()] || dictionaries[getDefaultLocale().code] || dictionaries["en"];

export const t = translator(dict, resolver);

/**
 * Format date token strings like "MMMM D, YYYY" or "MMM DD, YYYY"
 * 1:1 matching Ghost Handlebars {{date format="..."}} behavior in all 32 locales
 */
export function formatDate(dateInput?: string | Date | null, formatStr = "MMMM D, YYYY"): string {
  if (!dateInput) return "";
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);

    const currentLocale = locale();
    const monthFull = new Intl.DateTimeFormat(currentLocale, { month: "long" }).format(d);
    const monthShort = new Intl.DateTimeFormat(currentLocale, { month: "short" }).format(d);
    const day = d.getDate();

    return formatStr
      .replaceAll("YYYY", String(d.getFullYear()))
      .replaceAll("MMMM", monthFull)
      .replaceAll("MMM", monthShort)
      .replaceAll("DD", String(day).padStart(2, "0"))
      .replaceAll("D", String(day));
  } catch {
    return String(dateInput);
  }
}

/**
 * Format as YYYY-MM-DD for standard datetime attribute
 */
export function formatIsoDateOnly(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return d.toISOString().split("T")[0];
  } catch {
    return String(dateInput);
  }
}
