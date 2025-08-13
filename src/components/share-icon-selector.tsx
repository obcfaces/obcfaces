import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Share icon variants for selection
const ShareIcon1 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12c0 0 4-6 10-6s10 6 10 6" />
    <path d="M16 3l7 3-7 3" />
    <path d="M8 15c0 0 5 6 8 6" />
  </svg>
);

const ShareIcon2 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

const ShareIcon3 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 7h10v10"/>
    <path d="M7 17 17 7"/>
  </svg>
);

const ShareIcon4 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M9 9l6 6"/>
    <path d="M15 9v6h-6"/>
  </svg>
);

const ShareIcon5 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <polyline points="16,6 12,2 8,6"/>
    <line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);

const ShareIcon6 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
);

export const ShareIconSelector = () => {
  const icons = [
    { id: 1, name: "Curved Arrow", component: ShareIcon1 },
    { id: 2, name: "Network Share", component: ShareIcon2 },
    { id: 3, name: "External Link", component: ShareIcon3 },
    { id: 4, name: "Box Arrow", component: ShareIcon4 },
    { id: 5, name: "Upload", component: ShareIcon5 },
    { id: 6, name: "Document Share", component: ShareIcon6 },
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Choose Share Icon Style:</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-6 gap-4">
          {icons.map(({ id, name, component: Icon }) => (
            <div 
              key={id}
              className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => console.log(`Selected icon ${id}: ${name}`)}
            >
              <Icon className="w-8 h-8 text-foreground" />
              <span className="text-xs text-center">{name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};