import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function CardLayoutVariants() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      const hasAdminRole = roles?.some(r => r.role === 'admin' || r.role === 'moderator') || false;
      setIsAdmin(hasAdminRole);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Проверка прав доступа...</div>;
  }

  if (!isAdmin) {
    return null; // Не показываем ничего, если не админ
  }

  const mockData = {
    name: "Test User",
    age: 25,
    weight: 55,
    height: 165,
    faceImage: "/lovable-uploads/0db6ac53-7148-4ae3-9622-f3af6675c364.png",
    fullBodyImage: "/lovable-uploads/eecb29a9-eb9b-47c0-acad-9666f450ccc7.png",
    rank: 1,
    rating: 4.5
  };

  const handleVariantSelect = (variant: number) => {
    setSelectedVariant(variant);
    console.log(`Админ выбрал вариант ${variant}`);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 overflow-auto">
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto bg-white rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-red-600">🔧 ADMIN: Варианты верстки карточек</h2>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              Закрыть
            </Button>
          </div>

          {selectedVariant && (
            <div className="mb-4 p-3 bg-green-100 rounded">
              <strong>Выбран вариант {selectedVariant}</strong>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Вариант 1: Классические карточки */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Вариант 1: Классические карточки</h3>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden max-w-sm">
                <div className="flex">
                  <img 
                    src={mockData.faceImage} 
                    alt="Face" 
                    className="w-1/2 h-48 object-cover" 
                  />
                  <img 
                    src={mockData.fullBodyImage} 
                    alt="Full body" 
                    className="w-1/2 h-48 object-cover" 
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900">{mockData.name}</h3>
                  <p className="text-sm text-gray-600">{mockData.age} yo · {mockData.weight} kg · {mockData.height} cm</p>
                </div>
              </div>
              <Button onClick={() => handleVariantSelect(1)} className="w-full">
                Выбрать этот вариант
              </Button>
            </div>

            {/* Вариант 2: С рангом в углу */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Вариант 2: С рангом в углу</h3>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden max-w-sm relative">
                <div className="absolute top-2 left-2 bg-black/80 text-white w-6 h-6 rounded flex items-center justify-center text-sm font-bold z-10">
                  {mockData.rank}
                </div>
                <div className="flex">
                  <img 
                    src={mockData.faceImage} 
                    alt="Face" 
                    className="w-1/2 h-48 object-cover" 
                  />
                  <img 
                    src={mockData.fullBodyImage} 
                    alt="Full body" 
                    className="w-1/2 h-48 object-cover" 
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900">{mockData.name}</h3>
                  <p className="text-sm text-gray-600">{mockData.age} yo · {mockData.weight} kg · {mockData.height} cm</p>
                </div>
              </div>
              <Button onClick={() => handleVariantSelect(2)} className="w-full">
                Выбрать этот вариант
              </Button>
            </div>

            {/* Вариант 3: Компактные карточки */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Вариант 3: Компактные карточки</h3>
              <div className="bg-white border border-gray-200 overflow-hidden max-w-sm">
                <div className="flex">
                  <img 
                    src={mockData.faceImage} 
                    alt="Face" 
                    className="w-1/2 h-40 object-cover" 
                  />
                  <img 
                    src={mockData.fullBodyImage} 
                    alt="Full body" 
                    className="w-1/2 h-40 object-cover" 
                  />
                </div>
                <div className="p-2">
                  <h3 className="text-sm font-medium text-gray-900">{mockData.name}</h3>
                  <p className="text-xs text-gray-600">{mockData.age} yo · {mockData.weight} kg · {mockData.height} cm</p>
                </div>
              </div>
              <Button onClick={() => handleVariantSelect(3)} className="w-full">
                Выбрать этот вариант
              </Button>
            </div>

            {/* Вариант 4: С рейтингом справа */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Вариант 4: С рейтингом справа</h3>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden max-w-sm relative">
                <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-sm font-bold z-10">
                  {mockData.rating}
                </div>
                <div className="flex">
                  <img 
                    src={mockData.faceImage} 
                    alt="Face" 
                    className="w-1/2 h-48 object-cover" 
                  />
                  <img 
                    src={mockData.fullBodyImage} 
                    alt="Full body" 
                    className="w-1/2 h-48 object-cover" 
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900">{mockData.name}</h3>
                  <p className="text-sm text-gray-600">{mockData.age} yo · {mockData.weight} kg · {mockData.height} cm</p>
                </div>
              </div>
              <Button onClick={() => handleVariantSelect(4)} className="w-full">
                Выбрать этот вариант
              </Button>
            </div>

            {/* Вариант 5: Оригинальный стиль */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Вариант 5: Оригинальный стиль (как на скриншоте)</h3>
              <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-sm">
                <div className="relative">
                  <div className="absolute top-2 left-2 bg-black/70 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold z-10">
                    {mockData.rank}
                  </div>
                  <div className="flex">
                    <img 
                      src={mockData.faceImage} 
                      alt="Face" 
                      className="w-1/2 h-52 object-cover" 
                    />
                    <img 
                      src={mockData.fullBodyImage} 
                      alt="Full body" 
                      className="w-1/2 h-52 object-cover" 
                    />
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{mockData.name}</h3>
                  <div className="space-y-0.5 text-sm text-gray-600">
                    <div>{mockData.age} yo</div>
                    <div>{mockData.weight} kg</div>
                    <div>{mockData.height} cm</div>
                  </div>
                </div>
              </div>
              <Button onClick={() => handleVariantSelect(5)} className="w-full bg-blue-600 hover:bg-blue-700">
                Выбрать этот вариант (рекомендуется)
              </Button>
            </div>

            {/* Вариант 6: Стиль из референса */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Вариант 6: Точный стиль из референса</h3>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-sm">
                <div className="relative">
                  <div className="absolute top-3 left-3 bg-black/80 text-white w-6 h-6 flex items-center justify-center text-sm font-bold">
                    {mockData.rank}
                  </div>
                  <div className="grid grid-cols-2">
                    <img 
                      src={mockData.faceImage} 
                      alt="Face" 
                      className="w-full h-48 object-cover" 
                    />
                    <img 
                      src={mockData.fullBodyImage} 
                      alt="Full body" 
                      className="w-full h-48 object-cover" 
                    />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-medium text-gray-900 mb-2">{mockData.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>{mockData.age} yo</div>
                    <div>{mockData.weight} kg</div>
                    <div>{mockData.height} cm</div>
                  </div>
                </div>
              </div>
              <Button onClick={() => handleVariantSelect(6)} className="w-full bg-green-600 hover:bg-green-700">
                Это оригинал!
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}