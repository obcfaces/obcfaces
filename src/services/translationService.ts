interface TranslationService {
  translateText(text: string, targetLanguage: string): Promise<string>;
}

class AutoTranslationService implements TranslationService {
  private cache = new Map<string, Map<string, string>>();

  async translateText(text: string, targetLanguage: string): Promise<string> {
    // Check cache first
    if (this.cache.has(text) && this.cache.get(text)?.has(targetLanguage)) {
      return this.cache.get(text)!.get(targetLanguage)!;
    }

    try {
      // Use browser's built-in translation or a translation API
      const translated = await this.performTranslation(text, targetLanguage);
      
      // Cache the result
      if (!this.cache.has(text)) {
        this.cache.set(text, new Map());
      }
      this.cache.get(text)!.set(targetLanguage, translated);
      
      return translated;
    } catch (error) {
      console.error('Translation failed:', error);
      return text; // Fallback to original text
    }
  }

  private async performTranslation(text: string, targetLanguage: string): Promise<string> {
    // Simple translation mappings for key terms
    const translations: Record<string, Record<string, string>> = {
      'ru': {
        'Home': 'Главная',
        'Contest': 'Конкурс',
        'Messages': 'Сообщения',
        'Likes': 'Лайки',
        'Account': 'Аккаунт',
        'Login': 'Вход',
        'Profile': 'Профиль',
        'Online Beauty Contest': 'Онлайн Конкурс Красоты',
        'Join & Win': 'Участвовать и Выиграть',
        'How it works': 'Как это работает',
        'Vote': 'Голосовать',
        'View Profile': 'Посмотреть Профиль',
        'Upload your photos': 'Загрузите ваши фото',
        'Portrait photo': 'Портретное фото',
        'Body photo': 'Фото в полный рост',
        'Height': 'Рост',
        'Weight': 'Вес',
        'Loading...': 'Загрузка...',
        'Search': 'Поиск',
        'About': 'О нас',
        'Terms of Service': 'Условия использования',
        'Privacy Policy': 'Политика конфиденциальности',
      },
      'es': {
        'Home': 'Inicio',
        'Contest': 'Concurso',
        'Messages': 'Mensajes',
        'Likes': 'Me gusta',
        'Account': 'Cuenta',
        'Login': 'Iniciar sesión',
        'Profile': 'Perfil',
        'Online Beauty Contest': 'Concurso de Belleza Online',
        'Join & Win': 'Unirse y Ganar',
        'How it works': 'Cómo funciona',
        'Vote': 'Votar',
        'View Profile': 'Ver Perfil',
        'Upload your photos': 'Sube tus fotos',
        'Portrait photo': 'Foto de retrato',
        'Body photo': 'Foto de cuerpo',
        'Height': 'Altura',
        'Weight': 'Peso',
        'Loading...': 'Cargando...',
        'Search': 'Buscar',
        'About': 'Acerca de',
        'Terms of Service': 'Términos de servicio',
        'Privacy Policy': 'Política de privacidad',
      },
      'fr': {
        'Home': 'Accueil',
        'Contest': 'Concours',
        'Messages': 'Messages',
        'Likes': 'J\'aime',
        'Account': 'Compte',
        'Login': 'Connexion',
        'Profile': 'Profil',
        'Online Beauty Contest': 'Concours de Beauté en Ligne',
        'Join & Win': 'Rejoindre et Gagner',
        'How it works': 'Comment ça marche',
        'Vote': 'Voter',
        'View Profile': 'Voir le Profil',
        'Upload your photos': 'Téléchargez vos photos',
        'Portrait photo': 'Photo portrait',
        'Body photo': 'Photo du corps',
        'Height': 'Taille',
        'Weight': 'Poids',
        'Loading...': 'Chargement...',
        'Search': 'Rechercher',
        'About': 'À propos',
        'Terms of Service': 'Conditions de service',
        'Privacy Policy': 'Politique de confidentialité',
      },
      'de': {
        'Home': 'Startseite',
        'Contest': 'Wettbewerb',
        'Messages': 'Nachrichten',
        'Likes': 'Gefällt mir',
        'Account': 'Konto',
        'Login': 'Anmelden',
        'Profile': 'Profil',
        'Online Beauty Contest': 'Online-Schönheitswettbewerb',
        'Join & Win': 'Mitmachen und Gewinnen',
        'How it works': 'Wie es funktioniert',
        'Vote': 'Abstimmen',
        'View Profile': 'Profil anzeigen',
        'Upload your photos': 'Laden Sie Ihre Fotos hoch',
        'Portrait photo': 'Porträtfoto',
        'Body photo': 'Ganzkörperfoto',
        'Height': 'Größe',
        'Weight': 'Gewicht',
        'Loading...': 'Laden...',
        'Search': 'Suchen',
        'About': 'Über uns',
        'Terms of Service': 'Nutzungsbedingungen',
        'Privacy Policy': 'Datenschutzrichtlinie',
      }
    };

    if (translations[targetLanguage] && translations[targetLanguage][text]) {
      return translations[targetLanguage][text];
    }

    // If no direct translation found, return original text
    return text;
  }

  clearCache() {
    this.cache.clear();
  }
}

export const translationService = new AutoTranslationService();