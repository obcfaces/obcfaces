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

const ShareIcon7 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
);

const ShareIcon8 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22,12 18,8 18,11 2,11 2,13 18,13 18,16"/>
  </svg>
);

const ShareIcon9 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const ShareIcon10 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7,10 12,15 17,10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const ShareIcon11 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 17l4 4 4-4"/>
    <path d="M12 12v9"/>
    <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
  </svg>
);

const ShareIcon12 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/>
    <polyline points="22,6 12,13 2,6"/>
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
    { id: 7, name: "Fire Share", component: ShareIcon7 },
    { id: 8, name: "Arrow Right", component: ShareIcon8 },
    { id: 9, name: "Link Chain", component: ShareIcon9 },
    { id: 10, name: "Download", component: ShareIcon10 },
    { id: 11, name: "Cloud Share", component: ShareIcon11 },
    { id: 12, name: "Email Share", component: ShareIcon12 },
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
