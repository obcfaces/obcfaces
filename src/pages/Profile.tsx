import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Share2, Trophy, Camera, MessageCircle, AlertCircle, Grid2X2, AlignJustify } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import PostCard from "@/components/profile/PostCard";
import LikedItem from "@/components/profile/LikedItem";
import { PhotoModal } from "@/components/photo-modal";
import { ContestParticipationModal } from "@/components/contest-participation-modal";
import CreatePostModal from "@/components/create-post-modal";

interface ProfileRow {
  id: string;
  display_name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  birthdate?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  avatar_url?: string | null;
  city?: string | null;
  country?: string | null;
  bio?: string | null;
  gender?: string | null;
  age?: number | null;
  photo_1_url?: string | null;
  photo_2_url?: string | null;
  is_contest_participant?: boolean;
}

const Profile = () => {
  const { id: userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [displayStyle, setDisplayStyle] = useState<'grid' | 'list'>('grid');
  const [isContestModalOpen, setIsContestModalOpen] = useState(false);
  const [postsCount, setPostsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        setIsCurrentUser(session?.user?.id === userId);
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profileError || !profileData) {
          setLoading(false);
          return;
        }

        setProfile(profileData);

        // Fetch user posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles!posts_user_id_fkey(display_name, avatar_url)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!postsError) {
          setPosts(postsData || []);
          setPostsCount(postsData?.length || 0);
        }

        // Fetch liked posts if current user
        if (session?.user?.id === userId) {
          const { data: likedData, error: likedError } = await supabase
            .from('post_likes')
            .select(`
              post_id,
              posts(
                *,
                profiles!posts_user_id_fkey(display_name, avatar_url)
              )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (!likedError && likedData) {
            setLikedPosts(likedData.map(item => item.posts).filter(Boolean));
          }
        }

        // Fetch followers/following counts
        const { count: followersCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('followee_id', userId);

        const { count: followingCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId);

        setFollowersCount(followersCount || 0);
        setFollowingCount(followingCount || 0);

      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handlePhotoClick = (photos: string[], index: number) => {
    setSelectedPhotos(photos);
    setSelectedPhotoIndex(index);
    setIsPhotoModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-2">Loading profile...</div>
          <div className="text-sm text-muted-foreground">User ID: {userId}</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <div className="text-lg mb-2">Profile not found</div>
          <div className="text-sm text-muted-foreground mb-4">
            {!user ? (
              <>This profile may require authentication to view. Please log in to continue.</>
            ) : (
              <>This profile is private or doesn't exist.</>
            )}
          </div>
          <div className="space-y-2">
            {!user ? (
              <Button 
                onClick={() => navigate('/auth')} 
                className="mr-2"
              >
                Log In
              </Button>
            ) : null}
            <Button 
              onClick={() => navigate('/')} 
              variant="outline"
            >
              Go back to home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const profilePhotos = [profile.photo_1_url, profile.photo_2_url].filter(Boolean);
  const displayName = profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User';

  return (
    <>
      <Helmet>
        <title>{displayName} - Profile</title>
        <meta name="description" content={`View ${displayName}'s profile and posts`} />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Profile Header */}
          <div className="bg-card rounded-lg p-6 mb-6">
            <div className="flex items-start gap-6 mb-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <Avatar className="w-24 h-24 md:w-32 md:h-32">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">{displayName}</h1>
                  <Button variant="ghost" size="sm">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Stats */}
                <div className="flex gap-8 text-sm mb-4">
                  <div className="text-center">
                    <div className="font-bold text-base">{postsCount}</div>
                    <div className="text-muted-foreground">posts</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-base">{followersCount}</div>
                    <div className="text-muted-foreground">followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-base">{followingCount}</div>
                    <div className="text-muted-foreground">following</div>
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-sm text-muted-foreground italic">{profile.bio}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={() => setIsContestModalOpen(true)}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-6 py-2 rounded-lg font-medium"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Join & Win 5,000 PHP
              </Button>
              
              {isCurrentUser && (
                <CreatePostModal 
                  onPostCreated={() => {
                    window.location.reload();
                  }}
                >
                  <Button 
                    variant="outline" 
                    className="px-6 py-2 rounded-lg font-medium border-gray-300"
                  >
                    Add Post
                  </Button>
                </CreatePostModal>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-card rounded-lg">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-4 bg-transparent border-b border-border rounded-none h-auto p-0">
                <TabsTrigger 
                  value="posts"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none py-4 font-medium"
                >
                  Posts
                </TabsTrigger>
                <TabsTrigger 
                  value="photos"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none py-4 font-medium"
                >
                  Photos
                </TabsTrigger>
                <TabsTrigger 
                  value="participation"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none py-4 font-medium"
                >
                  Participation
                </TabsTrigger>
                <TabsTrigger 
                  value="about"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none py-4 font-medium"
                >
                  About
                </TabsTrigger>
              </TabsList>

              <div className="p-6">
                <TabsContent value="posts" className="mt-0">
                  {posts.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <div className="mb-2 text-lg">У вас пока нет постов</div>
                      <div className="text-sm">Создайте свой первый пост, нажав "Add Post"</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {posts.map((post) => (
                        <PostCard
                          key={post.id}
                          id={post.id}
                          authorName={displayName}
                          authorAvatarUrl={profile.avatar_url}
                          authorProfileId={profile.id}
                          time={new Date(post.created_at).toLocaleDateString()}
                          content={post.caption || ''}
                          mediaUrls={post.media_urls}
                          mediaTypes={post.media_types}
                          likes={post.likes_count}
                          comments={post.comments_count}
                          isOwnPost={isCurrentUser}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="photos" className="mt-0">
                  {profilePhotos.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <div className="mb-4 text-lg">No photos</div>
                      <div className="text-sm">Add photos to your profile</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {profilePhotos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`${displayName} photo ${index + 1}`}
                          className="aspect-square object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handlePhotoClick(profilePhotos, index)}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="participation" className="mt-0">
                  <div className="text-center py-16 text-muted-foreground">
                    <div className="mb-4 text-lg">Contest Participation</div>
                    <div className="text-sm">Your contest history will appear here</div>
                  </div>
                </TabsContent>

                <TabsContent value="about" className="mt-0">
                  <div className="space-y-4">
                    {profile.gender && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gender:</span>
                        <span>{profile.gender}</span>
                      </div>
                    )}
                    {profile.age && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Age:</span>
                        <span>{profile.age}</span>
                      </div>
                    )}
                    {profile.city && profile.country && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span>{profile.city}, {profile.country}</span>
                      </div>
                    )}
                    {profile.height_cm && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Height:</span>
                        <span>{profile.height_cm} cm</span>
                      </div>
                    )}
                    {profile.weight_kg && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Weight:</span>
                        <span>{profile.weight_kg} kg</span>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        {/* Photo Modal */}
        <PhotoModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          photos={selectedPhotos}
          currentIndex={selectedPhotoIndex}
          contestantName={displayName}
          age={profile.age || 0}
          weight={profile.weight_kg || 0}
          height={profile.height_cm || 0}
          country={profile.country || ''}
          city={profile.city || ''}
        />

        {/* Contest Participation Modal */}
        <ContestParticipationModal 
          isOpen={isContestModalOpen}
          onOpenChange={setIsContestModalOpen}
        />

      </div>
    </>
  );
};

export default Profile;