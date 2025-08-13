import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ShareIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 20L21 4"/>
    <path d="M21 4L14 4L3 20L9 13L21 4Z"/>
  </svg>
);

export const ShareIconSelector = () => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Share Icon:</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
            <ShareIcon className="w-8 h-8 text-foreground" />
            <span className="text-xs text-center">Share</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

