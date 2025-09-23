import { StarRating } from "@/components/ui/star-rating";

interface VotingOverlayProps {
  isThisWeek: boolean;
  isVoted: boolean;
  isEditing: boolean;
  showThanks: boolean;
  isExample: boolean;
  propUser: any;
  userRating: number;
  handleRate: (rating: number) => void;
  setShowLoginModal: (show: boolean) => void;
  setUserRating: (rating: number) => void;
  setIsEditing: (editing: boolean) => void;
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
  setShowLoginModal,
  setUserRating,
  setIsEditing,
  handleRate,
  name,
  compact = false
}: VotingOverlayProps) {
  // For THIS WEEK section - always show voting stars for unauthenticated users, regardless of previous votes
  // For other sections with unauthenticated users - don't show overlay at all (show full card info)
  // For authenticated users - show voting overlay only if not voted and not editing
  if (isThisWeek && !propUser && !isExample) {
    // Show stars for unauthenticated users in THIS WEEK ONLY
    return (
      <div className={`absolute inset-0 bg-gray-300 rounded-r flex flex-col items-center justify-center ${compact ? 'gap-2' : 'gap-12'}`}>
        {compact ? (
          <>
            <div className="scale-[1.2] sm:scale-[1.4]">
              <StarRating 
                rating={0} 
                isVoted={false}
                variant="white"
                hideText={true}
                onRate={(rating) => {
                  console.log('Unauthenticated user voting in THIS WEEK, showing login modal');
                  setShowLoginModal(true);
                }}
              />
            </div>
            <span className="text-xs text-gray-600 text-center leading-tight">Rate from 1 (lowest)<br />to 5 (highest)</span>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 whitespace-nowrap">Rate from 1 (lowest) 5 (highest)</span>
            <div className="scale-[0.8] sm:scale-[0.9]">
              <StarRating 
                rating={0} 
                isVoted={false}
                variant="white"
                hideText={true}
                onRate={(rating) => {
                  console.log('Unauthenticated user voting in THIS WEEK, showing login modal - FULL MODE');
                  setShowLoginModal(true);
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  } else if (!isThisWeek && !propUser && !isExample) {
    // For unauthenticated users in other blocks - don't show overlay, show full card info
    return null;
  } else if (!isVoted && !isEditing && !showThanks && !isExample) {
    // Show voting overlay only for authenticated users in all sections
    return (
      <div className={`absolute inset-0 bg-gray-300 rounded-r flex flex-col items-center justify-center ${compact ? 'gap-2' : 'gap-4'}`}>
        {/* Show only stars for all users in THIS WEEK, full voting UI for other sections */}
        {isThisWeek ? (
          compact ? (
            <>
              <div className="scale-[1.2] sm:scale-[1.4]">
                <StarRating 
                  rating={0} 
                  isVoted={false}
                  variant="white"
                  hideText={true}
                  onRate={(rating) => {
                    console.log('Authenticated user voting in THIS WEEK');
                    handleRate(rating);
                  }}
                />
              </div>
              <span className="text-xs text-gray-600 text-center leading-tight">Rate from 1 (lowest)<br />to 5 (highest)</span>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 whitespace-nowrap">Rate from 1 (lowest) 5 (highest)</span>
              <div className="scale-[0.8] sm:scale-[0.9]">
                <StarRating 
                  rating={0} 
                  isVoted={false}
                  variant="white"
                  hideText={true}
                  onRate={(rating) => {
                    console.log('Authenticated user voting in THIS WEEK');
                    handleRate(rating);
                  }}
                />
              </div>
            </div>
          )
        ) : (
          compact ? (
            <>
              <div className="scale-[1.2] sm:scale-[1.4]">
                <StarRating 
                  rating={0} 
                  isVoted={false}
                  variant="white"
                  hideText={true}
                  onRate={(rating) => {
                    console.log('StarRating onRate called with rating:', rating);
                    console.log('User state:', propUser);
                    handleRate(rating);
                  }}
                />
              </div>
              <span className="text-xs text-gray-600 text-center leading-tight">Rate from 1 (lowest)<br />to 5 (highest)</span>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 whitespace-nowrap">Rate from 1 (lowest) 5 (highest)</span>
              <div className="scale-[0.8] sm:scale-[0.9]">
                <StarRating 
                  rating={0} 
                  isVoted={false}
                  variant="white"
                  hideText={true}
                  onRate={(rating) => {
                    console.log('StarRating onRate called with rating:', rating);
                    console.log('User state:', propUser);
                    handleRate(rating);
                  }}
                />
              </div>
            </div>
          )
        )}
      </div>
    );
  }
  
  // Thank you message - shown for 1 second after voting
  if (showThanks) {
    return (
      <div className="absolute inset-0 bg-gray-300 rounded-r flex items-center justify-center px-4">
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
      <div className={`absolute inset-0 bg-gray-300 rounded-r flex flex-col items-center justify-center ${compact ? 'gap-2' : 'gap-4'}`}>
        {compact ? (
          <>
            <div className="scale-[1.2] sm:scale-[1.4]">
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
            <span className="text-xs text-gray-600 text-center leading-tight">Rate from 1 (lowest)<br />to 5 (highest)</span>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 whitespace-nowrap">Rate from 1 (lowest) 5 (highest)</span>
            <div className="scale-[0.8] sm:scale-[0.9]">
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
        )}
      </div>
    );
  }

  return null;
}