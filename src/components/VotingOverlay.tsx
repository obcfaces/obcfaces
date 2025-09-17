import { StarRating } from "@/components/ui/star-rating";

interface VotingOverlayProps {
  isThisWeek: boolean;
  isVoted: boolean;
  isEditing: boolean;
  showThanks: boolean;
  isExample: boolean;
  propUser: any;
  userRating: number;
  onRate: (rating: number) => void;
  setShowLoginModal: (show: boolean) => void;
  setUserRating: (rating: number) => void;
  setIsEditing: (editing: boolean) => void;
  handleRate: (rating: number) => void;
  name: string;
  compact?: boolean;
}

export function VotingOverlay({
  isThisWeek,
  isVoted,
  isEditing,
  showThanks,
  isExample,
  propUser,
  userRating,
  onRate,
  setShowLoginModal,
  setUserRating,
  setIsEditing,
  handleRate,
  name,
  compact = false
}: VotingOverlayProps) {
  // Voting overlay - shown by default when not voted and not editing
  if (!isVoted && !isEditing && !showThanks && !isExample) {
    return (
      <div className="absolute inset-0 bg-gray-300 rounded-r flex flex-col items-center justify-center gap-3">
        {/* Show only stars for all users in THIS WEEK, full voting UI for other sections */}
        {isThisWeek ? (
          <div className="scale-[1.5] sm:scale-[1.8]">
            <StarRating 
              rating={0} 
              isVoted={false}
              variant="white"
              hideText={true}
              onRate={(rating) => {
                if (!propUser) {
                  console.log('Unauthenticated user voting in THIS WEEK, showing login modal');
                  setShowLoginModal(true);
                } else {
                  console.log('Authenticated user voting in THIS WEEK');
                  handleRate(rating);
                }
              }}
            />
          </div>
        ) : (
          <>
            <span className="text-lg sm:text-xl font-medium text-gray-800">Vote</span>
            <div className="scale-[1.5] sm:scale-[1.8]">
              <StarRating 
                rating={0} 
                isVoted={false}
                variant="white"
                hideText={true}
                onRate={(rating) => {
                  console.log('StarRating onRate called with rating:', rating);
                  console.log('User state:', propUser);
                  if (!propUser) {
                    console.log('Unauthenticated user voting, showing login modal');
                    setShowLoginModal(true);
                  } else {
                    handleRate(rating);
                  }
                }}
              />
            </div>
          </>
        )}
      </div>
    );
  }
  
  // Thank you message - shown for 1 second after voting
  if (showThanks) {
    return (
      <div className="absolute inset-0 bg-gray-200 rounded-r flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-base font-medium text-gray-800 mb-1">Thank you. Rated</div>
          <div className="text-xl font-bold text-gray-800">{userRating.toFixed(0)}</div>
        </div>
      </div>
    );
  }
  
  // Re-voting overlay - shown when editing existing vote
  if (isVoted && isEditing && !showThanks && !isExample) {
    return (
      <div className="absolute inset-0 bg-gray-300 rounded-r flex flex-col items-center justify-center gap-3">
        <span className="text-lg sm:text-xl font-medium text-gray-800">Vote</span>
        <div className="scale-[1.5] sm:scale-[1.8]">
          <StarRating 
            rating={0} 
            isVoted={false}
            variant="white"
            hideText={true}
            onRate={(rating) => {
              console.log('Edit mode StarRating onRate called with rating:', rating);
              console.log('User state:', propUser);
              if (!propUser) {
                setShowLoginModal(true);
                return;
              }
              setUserRating(rating);
              localStorage.setItem(`rating-${name}-${propUser.id}`, rating.toString());
              setIsEditing(false);
              handleRate(rating);
            }}
          />
        </div>
      </div>
    );
  }

  return null;
}