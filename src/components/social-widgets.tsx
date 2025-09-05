import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export const SocialWidgets = () => {
  const openTelegram = () => {
    window.open('https://t.me/obcfaces', '_blank');
  };

  const openWhatsApp = () => {
    const phoneNumber = '+77029202072';
    window.open(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}`, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
      <Button
        onClick={openTelegram}
        size="lg"
        className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        aria-label="Написать в Telegram"
      >
        <Send className="w-6 h-6" />
      </Button>
      
      <Button
        onClick={openWhatsApp}
        size="lg"
        className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        aria-label="Написать в WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    </div>
  );
};