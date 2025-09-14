import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SearchableSelect from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LogOut, Eye, EyeOff, UserIcon, MapPin, Pencil, Lock, MessageCircle, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import PostCard from "@/components/profile/PostCard";
import LikedItem from "@/components/profile/LikedItem";
import { PhotoModal } from "@/components/photo-modal";
import { ProfilePhotoModal } from "@/components/profile-photo-modal";
import { ContestParticipationModal } from "@/components/contest-participation-modal";
import CreatePostModal from "@/components/create-post-modal";
import { REJECTION_REASONS, RejectReasonModal, RejectionReasonType } from "@/components/reject-reason-modal";
import c1 from "@/assets/contestant-1.jpg";
import c2 from "@/assets/contestant-2.jpg";
import c3 from "@/assets/contestant-3.jpg";
import c1face from "@/assets/contestant-1-face.jpg";
import c2face from "@/assets/contestant-2-face.jpg";
import c3face from "@/assets/contestant-3-face.jpg";
import { AlignJustify, Grid2X2, Edit } from "lucide-react";

interface ProfileRow {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  birthdate: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  avatar_url?: string | null;
  city?: string | null;
  country?: string | null;
  bio?: string | null;
  gender?: string | null;
  age?: number | null;
  photo_1_url?: string | null;
  photo_2_url?: string | null;
}

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [isProfilePhotoModalOpen, setIsProfilePhotoModalOpen] = useState(false);
  const [displayStyle, setDisplayStyle] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        setIsCurrentUser(session?.user?.id === userId);

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          navigate('/404');
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
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, navigate]);

  const handlePhotoClick = (photos: string[], index: number) => {
    setSelectedPhotos(photos);
    setSelectedPhotoIndex(index);
    setIsPhotoModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Profile not found</div>
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
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Profile Header */}
          <div className="bg-card rounded-lg p-6 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <Avatar 
                  className="w-32 h-32 cursor-pointer"
                  onClick={() => profile.avatar_url && setIsProfilePhotoModalOpen(true)}
                >
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                  <h1 className="text-3xl font-bold">{displayName}</h1>
                  {isCurrentUser && (
                    <Button variant="outline" size="sm">
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  {profile.city && profile.country && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {profile.city}, {profile.country}
                    </div>
                  )}
                  {profile.age && (
                    <div>Age: {profile.age}</div>
                  )}
                  {profile.gender && (
                    <div>Gender: {profile.gender}</div>
                  )}
                  {profile.height_cm && (
                    <div>Height: {profile.height_cm} cm</div>
                  )}
                </div>

                {profile.bio && (
                  <p className="mt-4 text-sm">{profile.bio}</p>
                )}

                {/* Profile Photos */}
                {profilePhotos.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Photos</h3>
                    <div className="flex gap-2">
                      {profilePhotos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`${displayName} photo ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg cursor-pointer"
                          onClick={() => handlePhotoClick(profilePhotos, index)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
                {isCurrentUser && (
                  <TabsTrigger value="liked">Liked ({likedPosts.length})</TabsTrigger>
                )}
              </TabsList>

              {activeTab === "posts" && posts.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDisplayStyle('grid')}
                    className={displayStyle === 'grid' ? 'bg-muted' : ''}
                  >
                    <Grid2X2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDisplayStyle('list')}
                    className={displayStyle === 'list' ? 'bg-muted' : ''}
                  >
                    <AlignJustify className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <TabsContent value="posts">
              {posts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {isCurrentUser ? "You haven't posted anything yet" : "No posts yet"}
                </div>
              ) : (
                <div className={displayStyle === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
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

            {isCurrentUser && (
              <TabsContent value="liked">
                {likedPosts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    You haven't liked any posts yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {likedPosts.map((post) => (
                      <LikedItem
                        key={post.id}
                        likeId={`like-${post.id}`}
                        contentType="post"
                        contentId={post.id}
                        authorName={post.profiles?.display_name || 'User'}
                        authorAvatarUrl={post.profiles?.avatar_url}
                        authorProfileId={post.user_id}
                        time={new Date(post.created_at).toLocaleDateString()}
                        content={post.caption}
                        imageSrc={post.media_urls?.[0]}
                        likes={post.likes_count}
                        comments={post.comments_count}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
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

        {/* Profile Photo Modal */}
        {profile.avatar_url && (
          <PhotoModal
            isOpen={isProfilePhotoModalOpen}
            onClose={() => setIsProfilePhotoModalOpen(false)}
            photos={[profile.avatar_url]}
            currentIndex={0}
            contestantName={displayName}
            age={profile.age || 0}
            weight={profile.weight_kg || 0}
            height={profile.height_cm || 0}
            country={profile.country || ''}
            city={profile.city || ''}
          />
        )}
      </div>
    </>
  );
};

export default Profile;