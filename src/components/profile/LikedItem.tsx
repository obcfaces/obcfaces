import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageCircle, Share2, ThumbsDown, Pencil, X, Upload, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn, getCountryDisplayName } from "@/lib/utils";
import { PhotoModal } from "@/components/photo-modal";
import { Link } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCardData } from "@/hooks/useCardData";
import { useParticipantData } from "@/hooks/useParticipantData";
import LoginModalContent from "@/components/login-modal-content";

// Import contest images for mock display
import contestant1Face from "@/assets/contestant-1-face.jpg";
import contestant1Full from "@/assets/contestant-1-full.jpg";
import contestant2Face from "@/assets/contestant-2-face.jpg";
import contestant2Full from "@/assets/contestant-2-full.jpg";
import contestant3Face from "@/assets/contestant-3-face.jpg";
import contestant3Full from "@/assets/contestant-3-full.jpg";

interface LikedItemProps {
  likeId: string;
  contentType: 'post' | 'photo' | 'contest' | 'next_week_candidate';
  contentId: string;
  authorName: string;
  authorAvatarUrl?: string;
  authorProfileId?: string;
  time: string;
  content?: string;
  imageSrc?: string;
  likes?: number;
  comments?: number;
  onUnlike?: (likeId: string) => void;
  viewMode?: 'compact' | 'full';
  candidateData?: any;
  participantType?: 'candidate' | 'finalist' | 'winner';
  showStatusBadge?: boolean;
  isOwner?: boolean;
  onEditPhotos?: () => void;
  isEditMode?: boolean;
  onToggleEditMode?: () => void;
  onUpdatePhotos?: (photo1: string | null, photo2: string | null) => void;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("");
  return initials || "U";
};

const getParticipantBadge = (type?: 'candidate' | 'finalist' | 'winner', isFullView = false) => {
  if (!type) return null;
  
  const badgeStyles = {
    candidate: "bg-yellow-100 text-yellow-700",
    finalist: "bg-orange-100 text-orange-700", 
    winner: "bg-blue-100 text-blue-700"
  };
  
  const labels = {
    candidate: "Candidate",
    finalist: "Finalist",
    winner: "🏆 Winner + 5000 PHP"
  };

  const dates = {
    candidate: "1 Sep",
    finalist: "9 Sep",
    winner: "16 Sep"
  };
  
  const positionClasses = isFullView 
    ? "absolute bottom-0 left-0 right-0 z-20" 
    : "absolute bottom-0 left-0 w-[193px] sm:w-[225px] md:w-[257px] z-20";
  
  return (
    <div className={`${positionClasses} px-2 py-1 text-xs font-semibold ${badgeStyles[type]} flex justify-between items-center`}>
      <span>{labels[type]}</span>
      <span>{dates[type]}</span>
    </div>
  );
};

const LikedItem = ({
  likeId,
  contentType,
  contentId,
  authorName,
  authorAvatarUrl,
  authorProfileId,
  time,
  content,
  imageSrc,
  likes = 0,
  comments = 0,
  onUnlike,
  viewMode = 'compact',
  candidateData,
  participantType,
  showStatusBadge = false,
  isOwner = false,
  onEditPhotos,
  isEditMode = false,
  onToggleEditMode,
  onUpdatePhotos
}: LikedItemProps) => {
  const [isUnliking, setIsUnliking] = useState(false);
  const [isLiked, setIsLiked] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Photo editing states
  const [editingPhoto1, setEditingPhoto1] = useState<File | null>(null);
  const [editingPhoto2, setEditingPhoto2] = useState<File | null>(null);
  const [photo1Preview, setPhoto1Preview] = useState<string | null>(null);
  const [photo2Preview, setPhoto2Preview] = useState<string | null>(null);
  const [photo1Deleted, setPhoto1Deleted] = useState(false);
  const [photo2Deleted, setPhoto2Deleted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentParticipantType, setCurrentParticipantType] = useState<'candidate' | 'finalist' | 'winner' | null>(participantType || null);

  // Use unified card data hook
  const { data: cardData, loading: cardDataLoading } = useCardData(authorName, user?.id);
  
  // Get real participant data from database
  const { getParticipantByName } = useParticipantData();
  const realParticipantData = getParticipantByName(authorName);
  
  // Don't render until card data is loaded (participant data loads separately)
  const isDataLoading = cardDataLoading;

  // Get current user
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch current participant type from database
  useEffect(() => {
    if (authorProfileId && contentType === 'next_week_candidate') {
      const fetchParticipantType = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('participant_type')
            .eq('id', authorProfileId)
            .single();
          
          if (!error && data?.participant_type) {
            setCurrentParticipantType(data.participant_type as 'candidate' | 'finalist' | 'winner');
          }
        } catch (error) {
          console.error('Error fetching participant type:', error);
        }
      };
      
      fetchParticipantType();
    }
  }, [authorProfileId, contentType]);

  const handleUnlike = async () => {
    setIsUnliking(true);
    try {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("id", likeId);
      
      if (error) throw error;
      
      setIsLiked(false);
      onUnlike?.(likeId);
      toast({ description: "Лайк убран" });
    } catch (error) {
      toast({ description: "Не удалось убрать лайк" });
    } finally {
      setIsUnliking(false);
    }
  };

  const openModal = (photoIndex: number) => {
    setModalStartIndex(photoIndex);
    setIsModalOpen(true);
  };

  const handleComment = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    openModal(0);
  };

  // Photo upload handlers
  const handlePhoto1Change = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setEditingPhoto1(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhoto1Preview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setPhoto1Deleted(false);
    }
  };

  const handlePhoto2Change = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setEditingPhoto2(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhoto2Preview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setPhoto2Deleted(false);
    }
  };

  const deletePhoto1 = () => {
    setPhoto1Deleted(true);
    setEditingPhoto1(null);
    setPhoto1Preview(null);
  };

  const deletePhoto2 = () => {
    setPhoto2Deleted(true);
    setEditingPhoto2(null);
    setPhoto2Preview(null);
  };

  const uploadPhoto = async (file: File, photoNumber: 1 | 2): Promise<string | null> => {
    console.log(`📤 Starting upload for photo ${photoNumber}:`, { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type 
    });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated for upload');
        return null;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/photo_${photoNumber}.${fileExt}`;
      
      console.log(`📁 Uploading to path: ${fileName}`);
      
      const { error: uploadError } = await supabase.storage
        .from('contest-photos')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) {
        console.error(`❌ Upload error for photo ${photoNumber}:`, uploadError);
        throw uploadError;
      }
      
      console.log(`✅ Upload successful for photo ${photoNumber}`);
      
      const { data } = supabase.storage
        .from('contest-photos')
        .getPublicUrl(fileName);
      
      const publicUrl = data.publicUrl;
      console.log(`🔗 Generated public URL: ${publicUrl}`);
      
      return publicUrl;
    } catch (error) {
      console.error(`❌ Error uploading photo ${photoNumber}:`, error);
      return null;
    }
  };

  const savePhotoChanges = async () => {
    console.log('🔄 Starting photo save process...');
    console.log('📷 Photo states:', {
      photo1Deleted,
      photo2Deleted,
      hasEditingPhoto1: !!editingPhoto1,
      hasEditingPhoto2: !!editingPhoto2,
      currentPhoto1: displayFaceImage,
      currentPhoto2: displayFullImage
    });
    
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated');
        toast({ description: "Не авторизован" });
        return;
      }

      console.log('👤 User authenticated:', user.id);

      let photo1Url = photo1Deleted ? null : displayFaceImage;
      let photo2Url = photo2Deleted ? null : displayFullImage;

      console.log('📸 Initial photo URLs:', { photo1Url, photo2Url });

      // Upload new photos if selected
      if (editingPhoto1) {
        console.log('⬆️ Uploading photo 1...');
        photo1Url = await uploadPhoto(editingPhoto1, 1);
        console.log('✅ Photo 1 upload result:', photo1Url);
        if (!photo1Url) {
          console.error('❌ Failed to upload photo 1');
          toast({ description: "Ошибка загрузки первого фото" });
          return;
        }
      }

      if (editingPhoto2) {
        console.log('⬆️ Uploading photo 2...');
        photo2Url = await uploadPhoto(editingPhoto2, 2);
        console.log('✅ Photo 2 upload result:', photo2Url);
        if (!photo2Url) {
          console.error('❌ Failed to upload photo 2');
          toast({ description: "Ошибка загрузки второго фото" });
          return;
        }
      }

      console.log('💾 Updating profile with URLs:', { photo1Url, photo2Url });

      // Update profile with new photo URLs
      const { error } = await supabase
        .from('profiles')
        .update({
          photo_1_url: photo1Url,
          photo_2_url: photo2Url
        })
        .eq('id', user.id);

      if (error) {
        console.error('❌ Database update error:', error);
        throw error;
      }

      console.log('✅ Profile updated successfully');
      toast({ description: "Фотографии обновлены!" });
      onUpdatePhotos?.(photo1Url, photo2Url);
      onToggleEditMode?.();
      
      // Reset editing state
      setEditingPhoto1(null);
      setEditingPhoto2(null);
      setPhoto1Preview(null);
      setPhoto2Preview(null);
      setPhoto1Deleted(false);
      setPhoto2Deleted(false);
    } catch (error) {
      console.error('❌ Error updating photos:', error);
      toast({ description: "Ошибка обновления фотографий" });
    } finally {
      setUploading(false);
      console.log('🏁 Photo save process completed');
    }
  };

  const cancelEdit = () => {
    setEditingPhoto1(null);
    setEditingPhoto2(null);
    setPhoto1Preview(null);
    setPhoto2Preview(null);
    setPhoto1Deleted(false);
    setPhoto2Deleted(false);
    onToggleEditMode?.();
  };

  // Use real participant data from database if available, otherwise fallback
  const candidateAge = realParticipantData?.age || candidateData?.age || 25;
  const candidateWeight = realParticipantData?.weight_kg || candidateData?.weight || 52;
  const candidateHeight = realParticipantData?.height_cm || candidateData?.height || 168;
  const candidateCountry = realParticipantData?.country || candidateData?.country || "Philippines";
  const candidateCity = realParticipantData?.city || candidateData?.city || "Unknown";
  const candidateState = realParticipantData?.state || candidateData?.state || "";
  const candidateFaceImage = realParticipantData?.photo_1_url || candidateData?.faceImage || imageSrc;
  const candidateFullImage = realParticipantData?.photo_2_url || candidateData?.fullBodyImage || imageSrc;
  const candidateAdditionalPhotos = candidateData?.additionalPhotos || [];
  
  // Fallback mock images if no real data available
  const images = [contestant1Face, contestant2Face, contestant3Face];
  const fullImages = [contestant1Full, contestant2Full, contestant3Full];
  const randomIndex = Math.floor(Math.random() * images.length);
  
  // Use real candidate photos if available, otherwise use mock images
  const displayFaceImage = candidateFaceImage || images[randomIndex];
  const displayFullImage = candidateFullImage || fullImages[randomIndex];
  const allPhotos = [displayFaceImage, displayFullImage, ...candidateAdditionalPhotos].filter(Boolean);
  
  // Show loading skeleton while data is loading
  if (isDataLoading) {
    return (
      <Card className="bg-card border-contest-border relative overflow-hidden animate-pulse">
        {viewMode === 'compact' ? (
          <div className="flex h-32 sm:h-36 md:h-40">
            <div className="flex-shrink-0 flex h-full relative gap-px">
              <div className="bg-muted w-24 sm:w-28 md:w-32 h-full" />
              <div className="bg-muted w-24 sm:w-28 md:w-32 h-full" />
            </div>
            <div className="flex-1 p-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
              <div className="flex gap-4 justify-end">
                <div className="h-6 bg-muted rounded w-12" />
                <div className="h-6 bg-muted rounded w-12" />
                <div className="h-6 bg-muted rounded w-8" />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="h-[72px] border-b border-contest-border p-4">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/4 mt-2" />
            </div>
            <div className="grid grid-cols-2 gap-px">
              <div className="bg-muted aspect-[4/5]" />
              <div className="bg-muted aspect-[4/5]" />
            </div>
            <div className="border-t border-contest-border px-4 py-2 flex justify-evenly gap-4">
              <div className="h-6 bg-muted rounded w-12" />
              <div className="h-6 bg-muted rounded w-12" />
              <div className="h-6 bg-muted rounded w-8" />
            </div>
          </div>
        )}
      </Card>
    );
  }
  
  // Compact view (same as contest compact mode) 
  if (viewMode === 'compact') {
    return (
      <>
        <Card className="bg-card border-contest-border relative overflow-hidden flex h-32 sm:h-36 md:h-40">
          {/* Edit/Save buttons for owner */}
          {isOwner && (
            <div className="absolute top-2 right-2 z-20 flex gap-1">
              {isEditMode ? (
                <>
                  <button
                    onClick={cancelEdit}
                    className="bg-gray-500/90 hover:bg-gray-600 text-white rounded-full p-1.5 shadow-sm transition-colors"
                    disabled={uploading}
                    aria-label="Cancel edit"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={savePhotoChanges}
                    className="bg-green-500/90 hover:bg-green-600 text-white rounded-full p-1.5 shadow-sm transition-colors"
                    disabled={uploading}
                    aria-label="Save changes"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={onToggleEditMode}
                  className="bg-white/90 hover:bg-white border border-gray-200 rounded-full p-1.5 shadow-sm transition-colors"
                  aria-label="Edit photos"
                >
                  <Pencil className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>
          )}
          
          {/* Participant Type Badge */}
          {showStatusBadge && getParticipantBadge(currentParticipantType)}
          {/* Main two photos */}
          <div className="flex-shrink-0 flex h-full relative gap-px">
            {/* Photo 1 */}
            <div className="relative">
              {photo1Deleted ? (
                <div className="w-24 sm:w-28 md:w-32 h-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <div className="text-center">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Фото 1</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhoto1Change}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              ) : (
                <>
                  <img 
                    src={photo1Preview || displayFaceImage}
                    alt={`${authorName} face`}
                    className="w-24 sm:w-28 md:w-32 h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => !isEditMode && openModal(0)}
                  />
                  {isEditMode && (
                    <>
                      <button
                        onClick={deletePhoto1}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                        aria-label="Delete photo 1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhoto1Change}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </>
                  )}
                </>
              )}
            </div>
            
            {/* Photo 2 */}
            <div className="relative">
              {photo2Deleted ? (
                <div className="w-24 sm:w-28 md:w-32 h-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <div className="text-center">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Фото 2</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhoto2Change}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              ) : (
                <>
                  <img 
                    src={photo2Preview || displayFullImage} 
                    alt={`${authorName} full body`}
                    className="w-24 sm:w-28 md:w-32 h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => !isEditMode && openModal(1)}
                  />
                  {isEditMode && (
                    <>
                      <button
                        onClick={deletePhoto2}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                        aria-label="Delete photo 2"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhoto2Change}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Content area - показываем информацию как в проголосованных карточках конкурса */}
          <div className="flex-1 p-1.5 sm:p-2 md:p-3 flex flex-col relative">
            <div className="absolute inset-0 bg-white rounded-r flex flex-col justify-between p-2 sm:p-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1 mr-2">
                  <h3 className="font-semibold text-contest-text text-base sm:text-lg truncate">
                    {authorProfileId ? (
                      <Link to={`/u/${authorProfileId}`} className="hover:text-primary underline-offset-2 hover:underline">
                        {authorName}
                      </Link>
                    ) : (
                      authorName
                    )}, {candidateAge}
                  </h3>
                   <div className="text-xs sm:text-sm text-muted-foreground font-normal">{candidateWeight} kg · {candidateHeight} cm</div>
                   <div className="text-sm sm:text-base text-contest-blue truncate">
                     {getCountryDisplayName(candidateCountry)}{candidateCity !== "Unknown" && candidateCity !== candidateCountry ? ` · ${candidateCity}` : ''}
                   </div>
                </div>
                
                <div className="text-right flex-shrink-0">
                  {/* Empty space like in contest cards */}
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-4">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs sm:text-sm text-contest-blue hover:text-contest-blue/80 transition-colors"
                  aria-label="Unlike"
                  onClick={handleUnlike}
                  disabled={isUnliking}
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-primary" strokeWidth={1} />
                   <span className="hidden xl:inline">Unlike</span>
                   <span>{cardData.likes}</span>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={handleComment}
                  aria-label="Comments"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-primary" strokeWidth={1} />
                  <span className="hidden xl:inline">Comment</span>
                   <span>{cardData.comments}</span>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={async () => {
                    try {
                      if ((navigator as any).share) {
                        await (navigator as any).share({ title: authorName, url: window.location.href });
                      } else if (navigator.clipboard) {
                        await navigator.clipboard.writeText(window.location.href);
                        toast({ title: "Link copied" });
                      }
                    } catch {}
                  }}
                  aria-label="Share"
                >
                  <Share2 className="w-3.5 h-3.5" strokeWidth={1} />
                  <span className="hidden xl:inline">Share</span>
                </button>
              </div>
            </div>
          </div>
        </Card>

        <PhotoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          photos={allPhotos}
          currentIndex={modalStartIndex}
          contestantName={authorName}
          age={candidateAge}
          weight={candidateWeight}
          height={candidateHeight}
          country={candidateCountry}
          city={candidateCity}
        />

        {/* Login Modal */}
        <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
          <DialogContent className="sm:max-w-lg">
            <LoginModalContent onClose={() => setShowLoginModal(false)} />
          </DialogContent>
        </Dialog>
      </>
    );
  }
  
  // Full view (same as contest full mode)
  return (
    <>
      <Card className="bg-card border-contest-border relative overflow-hidden">
        {/* Edit button for owner */}
        {isOwner && onEditPhotos && (
          <button
            onClick={onEditPhotos}
            className="absolute top-4 right-4 z-20 bg-white/90 hover:bg-white border border-gray-200 rounded-full p-2 shadow-sm transition-colors"
            aria-label="Edit photos"
          >
            <Pencil className="w-5 h-5 text-gray-600" />
          </button>
        )}
        
        {/* Name in top left - показываем всегда как в проголосованных */}
        <div className="absolute top-2 left-4 z-20">
          <h3 className="text-xl font-semibold text-contest-text">
            {authorProfileId ? (
              <Link to={`/u/${authorProfileId}`} className="hover:text-primary underline-offset-2 hover:underline">
                {authorName}
              </Link>
            ) : (
              authorName
            )}, {candidateAge} <span className="text-sm text-muted-foreground font-normal">({candidateWeight} kg · {candidateHeight} cm)</span>
          </h3>
          <div className="text-contest-blue text-sm">{getCountryDisplayName(candidateCountry)}{candidateCity !== "Unknown" && candidateCity !== candidateCountry ? ` · ${candidateCity}` : ''}</div>
        </div>
        
        {/* Header - пустой как в проголосованных карточках конкурса */}
        <div className="relative p-4 border-b border-contest-border h-[72px]">
          <div className="h-full"></div>
        </div>
        
        {/* Photos section */}
        <div className="relative">
          <div className="grid grid-cols-2 gap-px">
            {/* Participant Type Badge - overlaid on photos */}
            {showStatusBadge && getParticipantBadge(currentParticipantType, true)}
            <div className="relative">
              <img 
                src={displayFaceImage} 
                alt={`${authorName} face`}
                className="w-full aspect-[4/5] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openModal(0)}
              />
            </div>
            <div className="relative">
              <img 
                src={displayFullImage} 
                alt={`${authorName} full body`}
                className="w-full aspect-[4/5] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openModal(1)}
              />
            </div>
          </div>
        </div>
        
        {/* Footer with actions - точно как в конкурсе */}
        <div className="border-t border-contest-border px-4 py-2 flex items-center justify-evenly gap-4">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-contest-blue hover:text-contest-blue/80 transition-colors"
            aria-label="Unlike"
            onClick={handleUnlike}
            disabled={isUnliking}
          >
            <ThumbsUp className="w-4 h-4 text-blue-500 fill-blue-500" strokeWidth={1} />
             <span className="hidden sm:inline text-blue-500">Unlike</span>
             <span className="text-blue-500">{cardData.likes}</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleComment}
            aria-label="Comments"
          >
            <MessageCircle className="w-4 h-4 text-primary" strokeWidth={1} />
            <span className="hidden sm:inline">Comment</span>
            <span>{cardData.comments}</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={async () => {
              try {
                if ((navigator as any).share) {
                  await (navigator as any).share({ title: authorName, url: window.location.href });
                } else if (navigator.clipboard) {
                  await navigator.clipboard.writeText(window.location.href);
                  toast({ title: "Link copied" });
                }
              } catch {}
            }}
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" strokeWidth={1} />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </Card>

      <PhotoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        photos={allPhotos}
        currentIndex={modalStartIndex}
        contestantName={authorName}
        age={candidateAge}
        weight={candidateWeight}
        height={candidateHeight}
        country={candidateCountry}
        city={candidateCity}
      />

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-lg">
          <LoginModalContent onClose={() => setShowLoginModal(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LikedItem;