'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Share2, Plus, Sparkles, Calendar, Clock, ImagePlus, Trash2,
  Edit3, Check, X, Upload, Instagram, Facebook, Play, Loader2,
  Eye, Send, FileText, Lightbulb
} from 'lucide-react';

interface SocialPost {
  id: string;
  platform: string;
  contentType: string;
  title: string;
  content: string;
  hashtags: string;
  scheduledAt: string;
  status: string;
  mediaUrl?: string;
  visualSuggestion?: string;
}

const contentTypeLabels: Record<string, string> = {
  foto_piatto: 'Foto Piatto',
  story_interattiva: 'Story',
  reel_cucina: 'Reel Cucina',
  dietro_le_quinte: 'Dietro le Quinte',
  promo_speciale: 'Promo Speciale',
  recensione_cliente: 'Recensione Cliente',
  consiglio_sommelier: 'Consiglio Sommelier',
  evento: 'Evento',
};

const contentTypeColors: Record<string, string> = {
  foto_piatto: 'bg-amber-500/20 text-amber-300',
  story_interattiva: 'bg-purple-500/20 text-purple-300',
  reel_cucina: 'bg-rose-500/20 text-rose-300',
  dietro_le_quinte: 'bg-cyan-500/20 text-cyan-300',
  promo_speciale: 'bg-emerald-500/20 text-emerald-300',
  recensione_cliente: 'bg-blue-500/20 text-blue-300',
  consiglio_sommelier: 'bg-violet-500/20 text-violet-300',
  evento: 'bg-orange-500/20 text-orange-300',
};

const statusConfig: Record<string, { label: string; color: string }> = {
  bozza: { label: 'Bozza', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  programmato: { label: 'Programmato', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  pubblicato: { label: 'Pubblicato', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
};

export default function SocialSection() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editHashtags, setEditHashtags] = useState('');
  const [editScheduled, setEditScheduled] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadPostId, setUploadPostId] = useState<string>('');

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/social');
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  // Genera 3 post settimanali con AI
  const generateWeekly = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/social/generate-weekly', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchPosts();
      } else {
        alert('Errore: ' + (data.error || 'Impossibile generare'));
      }
    } catch (err) {
      alert('Errore di connessione');
    } finally {
      setGenerating(false);
    }
  };

  // Genera caption AI per un post
  const generateCaption = async () => {
    setGeneratingCaption(true);
    try {
      const res = await fetch('/api/social/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'caption', context: editTitle || 'Post ristorante' }),
      });
      const data = await res.json();
      if (data.caption) {
        setEditContent(data.caption);
        if (data.hashtag) setEditHashtags(data.hashtag);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingCaption(false);
    }
  };

  // Upload file
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadPostId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('postId', uploadPostId);

      const res = await fetch('/api/social/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        // Aggiorna il post con la media URL
        await fetch('/api/social/update-post', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: uploadPostId, mediaUrl: data.url }),
        });
        await fetchPosts();
      } else {
        alert('Errore upload: ' + (data.error || ''));
      }
    } catch (err) {
      alert('Errore upload');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Salva modifiche post
  const savePost = async () => {
    if (!selectedPost) return;
    try {
      await fetch('/api/social/update-post', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPost.id,
          title: editTitle,
          content: editContent,
          hashtags: editHashtags,
          scheduledAt: editScheduled,
          status: 'programmato',
        }),
      });
      setSelectedPost(null);
      await fetchPosts();
    } catch (err) {
      alert('Errore salvataggio');
    }
  };

  // Elimina post
  const deletePost = async (id: string) => {
    if (!confirm('Eliminare questo post?')) return;
    try {
      await fetch(`/api/social/delete-post?id=${id}`, { method: 'DELETE' });
      await fetchPosts();
    } catch (err) {
      alert('Errore eliminazione');
    }
  };

  // Apri editor per un post
  const openEditor = (post: SocialPost) => {
    setSelectedPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditHashtags(post.hashtags);
    setEditScheduled(post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : '');
  };

  // Avvia upload per un post
  const triggerUpload = (postId: string) => {
    setUploadPostId(postId);
    fileInputRef.current?.click();
  };

  const drafts = posts.filter(p => p.status === 'bozza');
  const scheduled = posts.filter(p => p.status === 'programmato');
  const published = posts.filter(p => p.status === 'pubblicato');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="pt-10 md:pt-0">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Share2 className="size-5 sm:size-6 text-lumina-gold" />
          Social Media & Content
        </h2>
        <p className="text-sm text-lumina-muted mt-0.5">Gestisci post, media e programmazione</p>
      </div>

      {/* Azioni principali */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          onClick={generateWeekly}
          disabled={generating}
          className="bg-lumina-gold hover:bg-lumina-gold-light text-lumina-black font-semibold h-auto py-3 sm:py-4 rounded-xl transition-all active:scale-[0.98]"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 sm:mr-2" />
          )}
          <span className="text-sm sm:text-base">{generating ? 'Generazione in corso...' : 'Genera 3 Post Settimanali'}</span>
        </Button>

        <Button
          onClick={() => {
            setEditTitle(''); setEditContent(''); setEditHashtags('');
            setEditScheduled(''); setSelectedPost(null);
            fileInputRef.current?.click();
            setUploadPostId('new');
          }}
          className="bg-lumina-card border border-lumina-border hover:border-lumina-gold/50 text-white font-semibold h-auto py-3 sm:py-4 rounded-xl transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="text-sm sm:text-base">Crea Post Manuale</span>
        </Button>
      </div>

      {/* File input nascosto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime"
        onChange={handleUpload}
        className="hidden"
      />

      {/* BOZZE */}
      {drafts.length > 0 && (
        <Card className="bg-lumina-card border-lumina-border">
          <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-white">
              <FileText className="size-4 sm:size-5 text-gray-400" /> Bozze ({drafts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3">
            {drafts.map(post => {
              const sc = statusConfig[post.status] || statusConfig.bozza;
              return (
                <div key={post.id} className="p-3 sm:p-4 rounded-lg bg-lumina-black/50 border border-lumina-border hover:border-lumina-gold/30 transition-colors">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="outline" className={contentTypeColors[post.contentType] || 'bg-gray-500/20 text-gray-300'}>
                      {contentTypeLabels[post.contentType] || post.contentType}
                    </Badge>
                    <Badge variant="outline" className={sc.color}>{sc.label}</Badge>
                    <div className="flex items-center gap-1 ml-auto">
                      {post.platform === 'instagram' || post.platform === 'entrambi' ? (
                        <Instagram className="size-3.5 text-pink-400" />
                      ) : null}
                      {post.platform === 'facebook' || post.platform === 'entrambi' ? (
                        <Facebook className="size-3.5 text-blue-400" />
                      ) : null}
                    </div>
                  </div>
                  <h4 className="font-semibold text-sm text-white mb-1">{post.title}</h4>
                  <p className="text-xs text-lumina-muted line-clamp-2 mb-2">{post.content}</p>
                  {post.visualSuggestion && (
                    <div className="flex items-start gap-1.5 mb-2 p-2 rounded bg-lumina-gold/5 border border-lumina-gold/10">
                      <Lightbulb className="size-3.5 text-lumina-gold shrink-0 mt-0.5" />
                      <p className="text-[11px] text-lumina-gold/80">{post.visualSuggestion}</p>
                    </div>
                  )}
                  {post.mediaUrl && (
                    <div className="mb-2 rounded-lg overflow-hidden border border-lumina-border max-h-40">
                      {post.mediaUrl.match(/\.(mp4|mov)$/i) ? (
                        <video src={post.mediaUrl} className="w-full object-cover" controls />
                      ) : (
                        <img src={post.mediaUrl} alt={post.title} className="w-full object-cover" />
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button size="sm" variant="ghost" onClick={() => openEditor(post)}
                      className="text-xs h-8 px-2 text-lumina-gold hover:bg-lumina-gold/10">
                      <Edit3 className="size-3 mr-1" /> Modifica
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => triggerUpload(post.id)} disabled={uploading}
                      className="text-xs h-8 px-2 text-blue-400 hover:bg-blue-400/10">
                      <ImagePlus className="size-3 mr-1" /> {post.mediaUrl ? 'Cambia Media' : 'Aggiungi Media'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deletePost(post.id)}
                      className="text-xs h-8 px-2 text-rose-400 hover:bg-rose-400/10 ml-auto">
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* PROGRAMMATI */}
      {scheduled.length > 0 && (
        <Card className="bg-lumina-card border-lumina-border">
          <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-white">
              <Calendar className="size-4 sm:size-5 text-blue-400" /> Programmati ({scheduled.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3">
            {scheduled.map(post => {
              const sc = statusConfig[post.status] || statusConfig.programmato;
              return (
                <div key={post.id} className="p-3 sm:p-4 rounded-lg bg-lumina-black/50 border border-lumina-border">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="outline" className={contentTypeColors[post.contentType] || ''}>
                      {contentTypeLabels[post.contentType] || post.contentType}
                    </Badge>
                    <Badge variant="outline" className={sc.color}>{sc.label}</Badge>
                    {post.scheduledAt && (
                      <span className="flex items-center gap-1 text-[11px] text-blue-300 ml-auto">
                        <Clock className="size-3" />
                        {new Date(post.scheduledAt).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {' '}{new Date(post.scheduledAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm text-white mb-1">{post.title}</h4>
                  <p className="text-xs text-lumina-muted line-clamp-2 mb-2">{post.content}</p>
                  {post.mediaUrl && (
                    <div className="mb-2 rounded-lg overflow-hidden border border-lumina-border max-h-40">
                      {post.mediaUrl.match(/\.(mp4|mov)$/i) ? (
                        <video src={post.mediaUrl} className="w-full object-cover" controls />
                      ) : (
                        <img src={post.mediaUrl} alt={post.title} className="w-full object-cover" />
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEditor(post)}
                      className="text-xs h-8 px-2 text-lumina-gold hover:bg-lumina-gold/10">
                      <Edit3 className="size-3 mr-1" /> Modifica
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => triggerUpload(post.id)}
                      className="text-xs h-8 px-2 text-blue-400 hover:bg-blue-400/10">
                      <ImagePlus className="size-3 mr-1" /> {post.mediaUrl ? 'Cambia' : 'Media'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* PUBBLICATI */}
      {published.length > 0 && (
        <Card className="bg-lumina-card border-lumina-border">
          <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-white">
              <Check className="size-4 sm:size-5 text-emerald-400" /> Pubblicati ({published.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3">
            {published.map(post => (
              <div key={post.id} className="p-3 sm:p-4 rounded-lg bg-lumina-black/50 border border-emerald-500/20">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm text-white">{post.title}</h4>
                  <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                    Pubblicato
                  </Badge>
                </div>
                <p className="text-xs text-lumina-muted line-clamp-1">{post.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Nessun post */}
      {!loading && posts.length === 0 && (
        <div className="text-center py-12 sm:py-16">
          <div className="relative inline-block mb-4">
            <div className="absolute -inset-3 bg-lumina-gold/10 rounded-full blur-xl" />
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-lumina-gold/15 flex items-center justify-center">
              <Share2 className="w-8 h-8 sm:w-10 sm:h-10 text-lumina-gold" />
            </div>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-1">Nessun post ancora</h3>
          <p className="text-xs sm:text-sm text-lumina-muted mb-4">Fai generare a Lumina 3 idee per la settimana, oppure crea un post manuale</p>
        </div>
      )}

      {/* MODAL EDITOR */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
          onClick={() => setSelectedPost(null)}>
          <div className="bg-lumina-dark border border-lumina-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Modifica Post</h3>
                <Button variant="ghost" size="icon" onClick={() => setSelectedPost(null)}
                  className="text-gray-400 hover:text-white h-8 w-8">
                  <X className="size-4" />
                </Button>
              </div>

              {/* Media preview + upload */}
              {selectedPost.mediaUrl && (
                <div className="mb-4 rounded-xl overflow-hidden border border-lumina-border max-h-48">
                  {selectedPost.mediaUrl.match(/\.(mp4|mov)$/i) ? (
                    <video src={selectedPost.mediaUrl} className="w-full object-cover" controls />
                  ) : (
                    <img src={selectedPost.mediaUrl} alt={editTitle} className="w-full object-cover" />
                  )}
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => triggerUpload(selectedPost.id)}
                className="w-full mb-4 border-dashed border-lumina-gold/30 text-lumina-gold hover:bg-lumina-gold/10 h-12">
                <Upload className="size-4 mr-2" />
                {selectedPost.mediaUrl ? 'Cambia Foto/Video' : 'Carica Foto o Video'}
              </Button>

              {/* Titolo */}
              <div className="mb-3">
                <label className="text-xs font-medium text-lumina-muted mb-1 block">Titolo</label>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  className="w-full bg-lumina-black border border-lumina-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lumina-gold/50"
                  placeholder="Titolo del post..." />
              </div>

              {/* Caption + AI */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-lumina-muted">Caption</label>
                  <Button variant="ghost" size="sm" onClick={generateCaption} disabled={generatingCaption}
                    className="text-[11px] h-6 px-2 text-lumina-gold hover:bg-lumina-gold/10">
                    {generatingCaption ? <Loader2 className="size-3 mr-1 animate-spin" /> : <Sparkles className="size-3 mr-1" />}
                    Genera con AI
                  </Button>
                </div>
                <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={5}
                  className="w-full bg-lumina-black border border-lumina-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lumina-gold/50 resize-none"
                  placeholder="Scrivi o fai generare la caption..." />
              </div>

              {/* Hashtag */}
              <div className="mb-3">
                <label className="text-xs font-medium text-lumina-muted mb-1 block">Hashtag</label>
                <input value={editHashtags} onChange={e => setEditHashtags(e.target.value)}
                  className="w-full bg-lumina-black border border-lumina-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lumina-gold/50"
                  placeholder="#ristorante #cucina..." />
              </div>

              {/* Data programmazione */}
              <div className="mb-4">
                <label className="text-xs font-medium text-lumina-muted mb-1 block">Data e Ora Pubblicazione</label>
                <input type="datetime-local" value={editScheduled} onChange={e => setEditScheduled(e.target.value)}
                  className="w-full bg-lumina-black border border-lumina-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lumina-gold/50"
                  style={{ colorScheme: 'dark' }} />
              </div>

              {/* Azioni */}
              <div className="flex gap-2">
                <Button onClick={savePost}
                  className="flex-1 bg-lumina-gold hover:bg-lumina-gold-light text-lumina-black font-semibold rounded-xl">
                  <Check className="size-4 mr-1" /> Salva e Programma
                </Button>
                <Button variant="outline" onClick={() => setSelectedPost(null)}
                  className="border-lumina-border text-gray-400 hover:text-white rounded-xl">
                  Annulla
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
