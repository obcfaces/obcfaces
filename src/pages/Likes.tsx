import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LikedItem from "@/components/profile/LikedItem";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import c1face from "@/assets/contestant-1-face.jpg";
import c2face from "@/assets/contestant-2-face.jpg";
import c3face from "@/assets/contestant-3-face.jpg";

const Likes = () => {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [likedItems, setLikedItems] = useState<any[]>([]);
  const [usersWhoLikedMe, setUsersWhoLikedMe] = useState<any[]>([]);

  // Mock data for "I liked" section
  const mockLikedItems = [
    {
      id: 1,
      type: 'photo',
      content: {
        photos: [
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&crop=face"
        ],
        description: "Beautiful sunset photoshoot"
      },
      author: {
        id: "user1",
        name: "Elena Martinez",
        username: "elena_m",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
      },
      likesCount: 124,
      commentsCount: 18,
      isLiked: true,
      createdAt: "2024-01-15T10:30:00Z"
    },
    {
      id: 2,
      type: 'contest_participant',
      content: {
        photos: [
          "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&crop=face"
        ],
        description: "Contest participant",
        participantType: 'candidate'
      },
      author: {
        id: "user2",
        name: "Sofia Chen",
        username: "sofia_c",
        avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop&crop=face"
      },
      likesCount: 89,
      commentsCount: 12,
      isLiked: true,
      createdAt: "2024-01-14T15:20:00Z"
    },
    {
      id: 3,
      type: 'photo',
      content: {
        photos: [
          "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=400&fit=crop&crop=face"
        ],
        description: "Morning coffee vibes"
      },
      author: {
        id: "user3",
        name: "Maria Rodriguez",
        username: "maria_r",
        avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&h=100&fit=crop&crop=face"
      },
      likesCount: 45,
      commentsCount: 8,
      isLiked: true,
      createdAt: "2024-01-13T08:45:00Z"
    }
  ];

  // Mock data for "I was liked" section
  const mockUsersWhoLikedMe = [
    {
      id: "user4",
      name: "Anna Petrova",
      username: "anna_p",
      avatar: c1face,
      bio: "Model and photographer",
      isFollowing: false,
      likesCount: 5
    },
    {
      id: "user5", 
      name: "Carmen Silva",
      username: "carmen_s",
      avatar: c2face,
      bio: "Fashion designer",
      isFollowing: true,
      likesCount: 3
    },
    {
      id: "user6",
      name: "Lucia Fernandez", 
      username: "lucia_f",
      avatar: c3face,
      bio: "Travel enthusiast",
      isFollowing: false,
      likesCount: 7
    }
  ];

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setCurrentUserId(user.id);
      setLoading(false);
    };
    getCurrentUser();
  }, [navigate]);

  // Load liked items and users who liked me
  useEffect(() => {
    if (currentUserId) {
      // For now, using mock data
      setLikedItems(mockLikedItems);
      setUsersWhoLikedMe(mockUsersWhoLikedMe);
    }
  }, [currentUserId]);

  const handleUnlike = (itemId: number) => {
    setLikedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleUserClick = (userId: string) => {
    navigate(`/u/${userId}`);
  };

  const handleFollow = async (userId: string) => {
    setUsersWhoLikedMe(prev => 
      prev.map(user => 
        user.id === userId 
          ? { ...user, isFollowing: !user.isFollowing }
          : user
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Likes - OBC faces</title>
        <meta name="description" content="View your liked content and users who liked you" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Likes</h1>
        </div>

        <Tabs defaultValue="i-liked" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="i-liked">I Liked</TabsTrigger>
            <TabsTrigger value="i-was-liked">I Was Liked</TabsTrigger>
          </TabsList>
          
          <TabsContent value="i-liked" className="mt-6">
            <div className="space-y-6">
              {likedItems.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">You haven't liked anything yet</p>
                </div>
              ) : (
                likedItems.map((item) => (
                  <LikedItem
                    key={item.id}
                    likeId={item.id.toString()}
                    contentType="photo"
                    contentId={item.id.toString()}
                    authorName={item.author.name}
                    authorAvatarUrl={item.author.avatar}
                    authorProfileId={item.author.id}
                    time={item.createdAt}
                    content={item.content.description}
                    imageSrc={item.content.photos[0]}
                    likes={item.likesCount}
                    comments={item.commentsCount}
                    onUnlike={() => handleUnlike(item.id)}
                    viewMode="full"
                  />
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="i-was-liked" className="mt-6">
            <div className="space-y-4">
              {usersWhoLikedMe.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">No one has liked your content yet</p>
                </div>
              ) : (
                usersWhoLikedMe.map((user) => (
                  <Card key={user.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center gap-4 flex-1"
                          onClick={() => handleUserClick(user.id)}
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold">{user.name}</h3>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                            {user.bio && (
                              <p className="text-sm text-muted-foreground mt-1">{user.bio}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Liked {user.likesCount} of your posts
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFollow(user.id);
                          }}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            user.isFollowing
                              ? "bg-muted text-muted-foreground hover:bg-muted/80"
                              : "bg-primary text-primary-foreground hover:bg-primary/90"
                          }`}
                        >
                          {user.isFollowing ? "Following" : "Follow"}
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Likes;