import { Send, MessageSquare, MessageCircle, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import messengerMainIcon from "@/assets/messenger-main-icon.png";

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
    const link = document.createElement('a');
    link.href = 'https://www.facebook.com/share/1PzEdJr8WL/?mibextid=wwXIfr';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            className="w-12 h-12 rounded-full bg-transparent hover:bg-transparent transition-all duration-300 animate-fade-in p-0"
            aria-label="Написать в Facebook Messenger"
          >
            <img 
              src={messengerMainIcon} 
              alt="Facebook Messenger" 
              className="w-12 h-12 object-contain"
            />
          </Button>
          
          <Button
            onClick={() => handleSocialClick(openTelegram)}
            className="!w-12 !h-12 !min-w-12 !min-h-12 !max-w-12 !max-h-12 rounded-full bg-blue-500 hover:bg-blue-600 transition-all duration-300 animate-fade-in flex items-center justify-center !p-0"
            aria-label="Написать в Telegram"
          >
            <Send className="w-6 h-6 text-white" />
          </Button>
          
          <Button
            onClick={() => handleSocialClick(openWhatsApp)}
            className="!w-12 !h-12 !min-w-12 !min-h-12 !max-w-12 !max-h-12 rounded-full bg-green-500 hover:bg-green-600 transition-all duration-300 animate-fade-in flex items-center justify-center !p-0"
            aria-label="Написать в WhatsApp"
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </Button>
        </>
      )}
      
      {/* Главная кнопка мессенджера */}
      <Button
        onClick={toggleMenu}
        size="lg"
        className="w-14 h-14 rounded-full bg-transparent hover:bg-transparent transition-all duration-300 p-0"
        aria-label="Связаться с нами"
      >
        <img 
          src={messengerMainIcon} 
          alt="Messenger" 
          className="w-20 h-20 object-contain"
        />
      </Button>
    </div>
  );
};