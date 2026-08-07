import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Plus, 
  MessageCircle, 
  ThumbsUp, 
  MoreHorizontal, 
  Trash2, 
  Image as ImageIcon,
  X,
  Send,
  Pin
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/muro")({
  component: MuroPage,
});

function MuroPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("vecino");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Create post state
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newType, setNewType] = useState<"vecinal" | "oficial">("vecinal");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    if (user && profile) {
      setUserRole(profile.role);
      if (profile.building_id) {
        fetchPosts(profile.building_id);
      }
    }
  }

  async function fetchPosts(buildingId: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        author:profiles(full_name, avatar_url),
        comments(
          *,
          author:profiles(full_name, avatar_url)
        ),
        reactions(*)
      `)
      .eq("building_id", buildingId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error al cargar publicaciones");
    } else {
      // Sort: Official posts first if within 7 days, then by date
      const now = new Date();
      const sortedPosts = [...(data || [])].sort((a, b) => {
        const aIsOfficialAndRecent = a.type === "oficial" && (now.getTime() - new Date(a.created_at).getTime() < 7 * 24 * 60 * 60 * 1000);
        const bIsOfficialAndRecent = b.type === "oficial" && (now.getTime() - new Date(b.created_at).getTime() < 7 * 24 * 60 * 60 * 1000);
        
        if (aIsOfficialAndRecent && !bIsOfficialAndRecent) return -1;
        if (!aIsOfficialAndRecent && bIsOfficialAndRecent) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setPosts(sortedPosts);
    }
    setLoading(false);
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newBody) return;
    
    setUploading(true);
    let imageUrl = "";

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from("post-images")
        .upload(fileName, imageFile);

      if (uploadError) {
        toast.error("Error al subir imagen");
        setUploading(false);
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from("post-images")
        .getPublicUrl(fileName);
      imageUrl = publicUrl;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("building_id")
      .eq("id", currentUser.id)
      .single();

    const { error } = await supabase.from("posts").insert({
      building_id: profile?.building_id,
      author_id: currentUser.id,
      title: newTitle,
      body: newBody,
      type: newType,
      image_url: imageUrl || null
    });

    if (error) {
      toast.error("Error al crear publicación");
    } else {
      toast.success("Publicación creada");
      setIsModalOpen(false);
      setNewTitle("");
      setNewBody("");
      setImageFile(null);
      fetchPosts(profile?.building_id);
    }
    setUploading(false);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("¿Borrar esta publicación?")) return;
    
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      toast.error("Error al borrar");
    } else {
      setPosts(posts.filter(p => p.id !== postId));
      toast.success("Publicación borrada");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 pb-32">
      <div className="flex justify-between items-center px-1">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Muro</h1>
          <p className="text-slate-500 font-medium">Novedades del edificio</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-12 h-12 bg-black text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-20 text-slate-400 font-bold">Cargando muro...</div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUser={currentUser} 
              userRole={userRole}
              onDelete={handleDeletePost}
            />
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">No hay publicaciones aún</p>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-6 flex justify-between items-center border-b border-slate-50">
              <h2 className="text-xl font-extrabold text-slate-900">Nueva publicación</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreatePost} className="p-6 space-y-4">
              {userRole === "admin" && (
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    type="button"
                    onClick={() => setNewType("vecinal")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${newType === "vecinal" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                  >
                    VECINAL
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewType("oficial")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${newType === "oficial" ? "bg-black text-white shadow-sm" : "text-slate-500"}`}
                  >
                    OFICIAL
                  </button>
                </div>
              )}

              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Título de la publicación"
                className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-lg"
                required
              />
              
              <textarea
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="¿Qué está pasando?"
                className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all font-medium min-h-[120px]"
                required
              />

              {imageFile && (
                <div className="relative rounded-2xl overflow-hidden aspect-video">
                  <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setImageFile(null)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-2"
                >
                  <ImageIcon size={20} /> Foto
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  hidden 
                  accept="image/*" 
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)} 
                />
                
                <button
                  type="submit"
                  disabled={uploading || !newTitle || !newBody}
                  className="flex-[2] py-4 bg-black text-white rounded-2xl font-bold shadow-lg shadow-black/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {uploading ? "Subiendo..." : "Publicar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PostCard({ post, currentUser, userRole, onDelete }: { post: any, currentUser: any, userRole: string, onDelete: (id: string) => void }) {
  const [commenting, setCommenting] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [comments, setComments] = useState(post.comments || []);
  const [reactions, setReactions] = useState(post.reactions || []);
  
  const isAuthor = post.author_id === currentUser?.id;
  const isAdmin = userRole === "admin" || userRole === "super_admin";
  const isOfficial = post.type === "oficial";
  const isPinned = isOfficial && (new Date().getTime() - new Date(post.created_at).getTime() < 7 * 24 * 60 * 60 * 1000);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody) return;

    const { data, error } = await supabase.from("comments").insert({
      post_id: post.id,
      author_id: currentUser.id,
      body: commentBody
    }).select("*, author:profiles(full_name, avatar_url)").single();

    if (error) {
      toast.error("Error al comentar");
    } else {
      setComments([...comments, data]);
      setCommentBody("");
      setCommenting(false);
    }
  };

  const handleReaction = async (emoji: string) => {
    const existing = reactions.find((r: any) => r.user_id === currentUser.id && r.emoji === emoji);
    
    if (existing) {
      const { error } = await supabase.from("reactions").delete().eq("id", existing.id);
      if (!error) setReactions(reactions.filter((r: any) => r.id !== existing.id));
    } else {
      const { data, error } = await supabase.from("reactions").insert({
        post_id: post.id,
        user_id: currentUser.id,
        emoji
      }).select().single();
      if (!error) setReactions([...reactions, data]);
    }
  };

  const deleteComment = async (id: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (!error) setComments(comments.filter((c: any) => c.id !== id));
  };

  return (
    <div className={`bg-white rounded-[2.5rem] shadow-soft border-2 transition-all overflow-hidden ${isPinned ? "border-slate-900" : "border-transparent"}`}>
      {isPinned && (
        <div className="bg-black px-6 py-2 flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest">
          <Pin size={12} fill="white" /> Comunicado oficial
        </div>
      )}
      
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl overflow-hidden shrink-0">
              {post.author?.avatar_url ? <img src={post.author.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold uppercase">{post.author?.full_name?.charAt(0)}</div>}
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-tight">{post.author?.full_name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
              </p>
            </div>
          </div>
          {(isAuthor || isAdmin) && (
            <button onClick={() => onDelete(post.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
              <Trash2 size={20} />
            </button>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{post.title}</h2>
          <p className="text-slate-600 font-medium whitespace-pre-wrap">{post.body}</p>
        </div>

        {post.image_url && (
          <div className="rounded-3xl overflow-hidden bg-slate-50">
            <img src={post.image_url} alt="Post" className="w-full h-auto max-h-[400px] object-cover" />
          </div>
        )}

        <div className="pt-2 flex items-center gap-4">
          <div className="flex -space-x-1">
            {["👍", "❤️", "😂"].map(emoji => {
              const count = reactions.filter((r: any) => r.emoji === emoji).length;
              const hasReacted = reactions.some((r: any) => r.user_id === currentUser?.id && r.emoji === emoji);
              return count > 0 || hasReacted ? (
                <button 
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm transition-all ${hasReacted ? "bg-accent/20 border-accent/40 scale-105" : "bg-white border-slate-100"}`}
                >
                  <span>{emoji}</span>
                  {count > 0 && <span className="font-bold text-xs">{count}</span>}
                </button>
              ) : null;
            })}
            <div className="relative group ml-2">
               <button className="p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100">
                 <Plus size={16} />
               </button>
               <div className="absolute bottom-full mb-2 left-0 hidden group-hover:flex bg-white shadow-xl rounded-full p-1 gap-1 border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-200">
                 {["👍", "❤️", "😂"].map(emoji => (
                   <button 
                     key={emoji} 
                     onClick={() => handleReaction(emoji)}
                     className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-full transition-colors text-lg"
                   >
                     {emoji}
                   </button>
                 ))}
               </div>
            </div>
          </div>

          <button 
            onClick={() => setCommenting(!commenting)}
            className="flex items-center gap-2 text-slate-400 font-bold text-sm ml-auto"
          >
            <MessageCircle size={20} />
            {comments.length}
          </button>
        </div>

        {/* Comments Section */}
        {(commenting || comments.length > 0) && (
          <div className="pt-4 border-t border-slate-50 space-y-4">
            <div className="space-y-3">
              {comments.map((comment: any) => (
                <div key={comment.id} className="flex gap-3 group">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg overflow-hidden shrink-0">
                    {comment.author?.avatar_url ? <img src={comment.author.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-bold">{comment.author?.full_name?.charAt(0)}</div>}
                  </div>
                  <div className="flex-1 bg-slate-50 p-3 rounded-2xl relative">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">{comment.author?.full_name}</p>
                    <p className="text-sm text-slate-700 font-medium">{comment.body}</p>
                    {(comment.author_id === currentUser?.id || isAdmin) && (
                      <button 
                        onClick={() => deleteComment(comment.id)}
                        className="absolute right-2 top-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Escribí un comentario..."
                className="flex-1 p-3 bg-slate-50 rounded-2xl border-none focus:ring-1 focus:ring-slate-200 text-sm font-medium"
              />
              <button 
                type="submit"
                className="w-11 h-11 bg-black text-white rounded-2xl flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30"
                disabled={!commentBody}
              >
                <Send size={18} strokeWidth={2.5} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
