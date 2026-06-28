'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Sparkles,
  Save,
  Upload,
  Instagram,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Film,
  Camera,
  Image,
  PlayCircle,
} from 'lucide-react';
import type { SocialPost } from '@/lib/types';

// --- Config ---

const platformConfig: Record<
  SocialPost['platform'],
  { label: string; color: string; icon: typeof Instagram }
> = {
  instagram: {
    label: 'Instagram',
    color: 'bg-pink-100 text-pink-700 border-pink-200',
    icon: Instagram,
  },
  tiktok: {
    label: 'TikTok',
    color: 'bg-zinc-100 text-zinc-800 border-zinc-300',
    icon: PlayCircle,
  },
  facebook: {
    label: 'Facebook',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Camera,
  },
};

const typeConfig: Record<SocialPost['type'], { label: string; icon: typeof Image }> = {
  foto: { label: 'Foto', icon: Image },
  video: { label: 'Video', icon: Film },
  storia: { label: 'Storia', icon: Camera },
  reel: { label: 'Reel', icon: PlayCircle },
};

const statusConfig: Record<
  SocialPost['status'],
  { label: string; color: string; icon: typeof Clock }
> = {
  bozza: {
    label: 'Bozza',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: Clock,
  },
  programmato: {
    label: 'Programmato',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Clock,
  },
  pubblicato: {
    label: 'Pubblicato',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  fallito: {
    label: 'Fallito',
    color: 'bg-rose-100 text-rose-700 border-rose-200',
    icon: AlertTriangle,
  },
};

// --- Component ---

export default function SocialSection() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  // AI generator state
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPost['platform'] | ''>('');
  const [selectedType, setSelectedType] = useState<SocialPost['type'] | ''>('');
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [generatedHashtags, setGeneratedHashtags] = useState('');

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/social');
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data: SocialPost[] = await res.json();
      setPosts(data);
    } catch {
      toast.error('Errore nel caricamento dei post social');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleGenerate = async () => {
    if (!selectedPlatform || !selectedType) {
      toast.error('Seleziona piattaforma e tipo di contenuto');
      return;
    }

    try {
      setGenerating(true);
      setGeneratedCaption('');
      setGeneratedHashtags('');

      const res = await fetch('/api/social/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: selectedPlatform, type: selectedType }),
      });

      if (!res.ok) throw new Error('Failed to generate suggestion');

      const data = await res.json();
      setGeneratedCaption(data.caption || '');
      setGeneratedHashtags(data.hashtags || '');
      toast.success('Contenuto generato con successo!');
    } catch {
      toast.error('Errore nella generazione del contenuto AI');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedPlatform || !selectedType || !generatedCaption) {
      toast.error('Genera prima un contenuto con AI');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          type: selectedType,
          caption: generatedCaption,
          hashtags: generatedHashtags,
          status: 'bozza',
          aiSuggestion: true,
        }),
      });

      if (!res.ok) throw new Error('Failed to save draft');

      toast.success('Bozza salvata con successo!');
      setGeneratedCaption('');
      setGeneratedHashtags('');
      fetchPosts();
    } catch {
      toast.error("Errore nel salvataggio della bozza");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedPlatform || !selectedType || !generatedCaption) {
      toast.error('Genera prima un contenuto con AI');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          type: selectedType,
          caption: generatedCaption,
          hashtags: generatedHashtags,
          status: 'pubblicato',
          aiSuggestion: true,
        }),
      });

      if (!res.ok) throw new Error('Failed to publish');

      toast.success('Post pubblicato con successo!');
      setGeneratedCaption('');
      setGeneratedHashtags('');
      fetchPosts();
    } catch {
      toast.error('Errore nella pubblicazione del post');
    } finally {
      setSaving(false);
    }
  };

  const fullGeneratedText =
    generatedCaption && generatedHashtags
      ? `${generatedCaption}\n\n${generatedHashtags}`
      : generatedCaption;

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Social Media AI</h2>
        <p className="text-muted-foreground">
          Pianifica e genera contenuti per Instagram e TikTok
        </p>
      </div>

      {/* Reminder Card */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            Non hai postato da 3 giorni! I ristoranti che postano regolarmente hanno il 47% più
            engagement. <span className="font-semibold">Chiedi all&apos;AI di creare un contenuto.</span>
          </p>
        </CardContent>
      </Card>

      {/* AI Content Generator Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Generatore di Contenuti AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selectors */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Piattaforma</label>
              <Select
                value={selectedPlatform}
                onValueChange={(v) => setSelectedPlatform(v as SocialPost['platform'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona piattaforma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo di Contenuto</label>
              <Select
                value={selectedType}
                onValueChange={(v) => setSelectedType(v as SocialPost['type'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="foto">Foto</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="storia">Storia</SelectItem>
                  <SelectItem value="reel">Reel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={generating || !selectedPlatform || !selectedType}
            className="w-full sm:w-auto"
          >
            {generating ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                Generazione in corso...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Genera con AI
              </>
            )}
          </Button>

          {/* Generated Content */}
          {generating && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-4 w-2/5" />
            </div>
          )}

          {!generating && fullGeneratedText && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Contenuto Generato</label>
              <Textarea
                value={fullGeneratedText}
                onChange={(e) => {
                  const val = e.target.value;
                  // Split back caption and hashtags when user edits
                  const hashtagIndex = val.lastIndexOf('\n#');
                  if (hashtagIndex > 0) {
                    setGeneratedCaption(val.slice(0, hashtagIndex).trim());
                    setGeneratedHashtags(val.slice(hashtagIndex).trim());
                  } else {
                    setGeneratedCaption(val);
                    setGeneratedHashtags('');
                  }
                }}
                rows={5}
                className="resize-y"
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="flex-1 sm:flex-none"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Salva come Bozza
                </Button>
                <Button onClick={handlePublish} disabled={saving} className="flex-1 sm:flex-none">
                  <Upload className="mr-2 h-4 w-4" />
                  Pubblica Ora
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Posts List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Post Recenti</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-3 rounded-lg border p-4">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Camera className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Nessun post ancora. Usa il generatore AI per crearne uno!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 max-h-96 overflow-y-auto pr-1">
              {posts.map((post) => {
                const platform = platformConfig[post.platform];
                const type = typeConfig[post.type];
                const status = statusConfig[post.status];
                const PlatformIcon = platform.icon;
                const TypeIcon = type.icon;
                const StatusIcon = status.icon;

                return (
                  <Card key={post.id} className="flex flex-col gap-3 p-4">
                    {/* Top row: badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`flex items-center gap-1 ${platform.color}`}
                      >
                        <PlatformIcon className="h-3 w-3" />
                        {platform.label}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <TypeIcon className="h-3 w-3" />
                        {type.label}
                      </Badge>
                      {post.aiSuggestion && (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 bg-violet-50 text-violet-700 border-violet-200"
                        >
                          <Sparkles className="h-3 w-3" />
                          AI
                        </Badge>
                      )}
                    </div>

                    {/* Status */}
                    <Badge
                      variant="outline"
                      className={`self-start flex items-center gap-1 ${status.color}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>

                    {/* Caption */}
                    <p className="text-sm text-foreground/80 line-clamp-3">{post.caption}</p>

                    {/* Hashtags */}
                    {post.hashtags && (
                      <p className="text-xs text-primary/70 truncate">{post.hashtags}</p>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}