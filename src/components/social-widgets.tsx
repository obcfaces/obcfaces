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
      {/* Убрали все дополнительные кнопки социальных сетей */}
      
      {/* Главная кнопка мессенджера */}
      <Button
        onClick={openMessenger}
        size="lg"
        className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 p-0"
        aria-label="Связаться с нами"
      >
        <img 
          src={messengerMainIcon} 
          alt="Messenger" 
          className="w-30 h-30 object-contain"
        />
      </Button>
    </div>
  );
};