import { MessageCircle, Send, MessageSquare, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";

export const SocialWidgets = () => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const openTelegram = () => {
    window.open('https://t.me/obcfaces', '_blank');
  };

  const openWhatsApp = () => {
    const phoneNumber = '+77029202072';
    window.open(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}`, '_blank');
  };

  const openMessenger = () => {
    window.open('https://www.facebook.com/share/1PzEdJr8WL/?mibextid=wwXIfr', '_blank');
  };

  const clearAutoCloseTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startAutoCloseTimeout = () => {
    clearAutoCloseTimeout();
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 5000);
  };

  const toggleMenu = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    if (newIsOpen) {
      startAutoCloseTimeout();
    } else {
      clearAutoCloseTimeout();
    }
  };

  const handleSocialClick = (action: () => void) => {
    clearAutoCloseTimeout();
    setIsOpen(false);
    action();
  };

  useEffect(() => {
    return () => {
      clearAutoCloseTimeout();
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-50">
      {/* Социальные кнопки - показываются только когда меню открыто */}
      {isOpen && (
        <>
          <Button
            onClick={() => handleSocialClick(openMessenger)}
            size="lg"
            className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in"
            aria-label="Написать в Facebook Messenger"
          >
            <Facebook className="w-5 h-5" />
          </Button>
          
          <Button
            onClick={() => handleSocialClick(openTelegram)}
            size="lg"
            className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in"
            aria-label="Написать в Telegram"
          >
            <Send className="w-5 h-5" />
          </Button>
          
          <Button
            onClick={() => handleSocialClick(openWhatsApp)}
            size="lg"
            className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in"
            aria-label="Написать в WhatsApp"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
        </>
      )}
      
      {/* Главная кнопка мессенджера */}
      <Button
        onClick={toggleMenu}
        size="lg"
        className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        aria-label="Связаться с нами"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    </div>
  );
};