import { MessageCircle, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const SocialWidgets = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openTelegram = () => {
    window.open('https://t.me/obcfaces', '_blank');
  };

  const openWhatsApp = () => {
    const phoneNumber = '+77029202072';
    window.open(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}`, '_blank');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-50">
      {/* Telegram and WhatsApp buttons - показываются только когда меню открыто */}
      {isOpen && (
        <>
          <Button
            onClick={openTelegram}
            size="lg"
            className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in"
            aria-label="Написать в Telegram"
          >
            <Send className="w-5 h-5" />
          </Button>
          
          <Button
            onClick={openWhatsApp}
            size="lg"
            className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in"
            aria-label="Написать в WhatsApp"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
        </>
      )}
      
      {/* Главная кнопка Ask */}
      <Button
        onClick={toggleMenu}
        size="lg"
        className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
        aria-label="Связаться с нами"
      >
        <MessageSquare className="w-6 h-6" />
      </Button>
    </div>
  );
};