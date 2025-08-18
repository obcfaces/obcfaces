import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, X } from "lucide-react";

interface ProfileHit {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

const nameOf = (p: ProfileHit) =>
  p.display_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || "User";

const initialHits: ProfileHit[] = [];

const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProfileHit[]>(initialHits);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  // Debounce
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(id);
  }, [query]);

  // Fetch profiles
  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!debounced) {
        if (active) setResults(initialHits);
        return;
      }
      setLoading(true);
      const like = `%${debounced}%`;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, first_name, last_name, avatar_url")
        .or(
          `display_name.ilike.${like},first_name.ilike.${like},last_name.ilike.${like}`
        )
        .limit(8);
      if (!active) return;
      if (error) {
        setResults([]);
      } else {
        setResults((data as ProfileHit[]) || []);
      }
      setLoading(false);
    };
    run();
    return () => {
      active = false;
    };
  }, [debounced]);

  // Close on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const onPick = (id: string) => {
    setOpen(false);
    setQuery("");
    navigate(`/u/${id}`);
  };

  const fallbackInitial = useMemo(() => (txt: string) => txt.trim().charAt(0).toUpperCase(), []);

  return (
    <div ref={wrapRef} className="relative">
      {!open ? (
        <Button variant="ghost" size="icon" aria-label="Search" onClick={() => setOpen(true)}>
          <Search className="h-5 w-5" strokeWidth={1} />
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" strokeWidth={1} />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a user..."
              className="h-9 w-56 sm:w-64 md:w-80 pl-10"
              aria-label="Search"
            />
          </div>
          <Button variant="ghost" size="icon" aria-label="Close search" onClick={() => { setOpen(false); setQuery(""); }}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      {open && (
        <div className="absolute left-0 top-11 z-50 w-[min(20rem,85vw)] sm:w-80 rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="max-h-80 overflow-auto p-1">
            {loading ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">Searching…</div>
            ) : debounced && results.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">No results</div>
            ) : results.length > 0 ? (
              <ul className="divide-y divide-border">
                {results.map((p) => {
                  const dn = nameOf(p);
                  return (
                    <li key={p.id}>
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent hover:text-accent-foreground text-left"
                        onClick={() => onPick(p.id)}
                      >
                        <Avatar className="h-7 w-7">
                          {p.avatar_url ? (
                            <AvatarImage src={p.avatar_url} alt={`${dn} avatar`} />
                          ) : (
                            <AvatarFallback className="text-xs">{fallbackInitial(dn)}</AvatarFallback>
                          )}
                        </Avatar>
                        <span className="text-sm font-medium">{dn}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">Enter a query</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
