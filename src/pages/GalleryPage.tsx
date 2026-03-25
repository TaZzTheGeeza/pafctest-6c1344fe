import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Image, X, ChevronLeft, ChevronRight, Camera } from "lucide-react";
import { format } from "date-fns";

interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  event_date: string | null;
}

interface Photo {
  id: string;
  album_id: string;
  url: string;
  caption: string | null;
  sort_order: number;
}

function Lightbox({ photos, index, onClose, onNext, onPrev }: {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const photo = photos[index];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onNext, onPrev]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white z-10">
        <X className="h-8 w-8" />
      </button>

      {photos.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-4 text-white/70 hover:text-white z-10">
            <ChevronLeft className="h-10 w-10" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-4 text-white/70 hover:text-white z-10">
            <ChevronRight className="h-10 w-10" />
          </button>
        </>
      )}

      <div className="max-w-5xl max-h-[85vh] px-16" onClick={(e) => e.stopPropagation()}>
        <img src={photo.url} alt={photo.caption || ""} className="max-w-full max-h-[80vh] object-contain mx-auto rounded-lg" />
        {photo.caption && <p className="text-center text-white/70 text-sm mt-4">{photo.caption}</p>}
        <p className="text-center text-white/40 text-xs mt-1">{index + 1} / {photos.length}</p>
      </div>
    </motion.div>
  );
}

export default function GalleryPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("gallery_albums")
      .select("*")
      .order("event_date", { ascending: false })
      .then(({ data }) => {
        if (data) setAlbums(data);
        setLoading(false);
      });
  }, []);

  const openAlbum = async (album: Album) => {
    setSelectedAlbum(album);
    const { data } = await supabase
      .from("gallery_photos")
      .select("*")
      .eq("album_id", album.id)
      .order("sort_order", { ascending: true });
    if (data) setPhotos(data);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-center mb-2">
              <span className="text-gold-gradient">Gallery</span>
            </h1>
            <p className="text-muted-foreground text-center mb-12">Photos from matches, training, and club events</p>
          </motion.div>

          {selectedAlbum ? (
            <div className="max-w-6xl mx-auto">
              <button
                onClick={() => { setSelectedAlbum(null); setPhotos([]); }}
                className="inline-flex items-center gap-1 text-sm font-display text-primary hover:text-gold-light transition-colors mb-6"
              >
                <ChevronLeft className="h-4 w-4" /> Back to Albums
              </button>
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">{selectedAlbum.title}</h2>
              {selectedAlbum.description && <p className="text-muted-foreground text-sm mb-6">{selectedAlbum.description}</p>}

              {photos.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-12 text-center">
                  <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No photos in this album yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {photos.map((photo, i) => (
                    <motion.button
                      key={photo.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => setLightboxIndex(i)}
                      className="aspect-square rounded-lg overflow-hidden group"
                    >
                      <img src={photo.url} alt={photo.caption || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="text-center text-muted-foreground py-12">Loading...</div>
          ) : albums.length === 0 ? (
            <div className="max-w-2xl mx-auto bg-card border border-border rounded-lg p-12 text-center">
              <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Gallery albums coming soon!</p>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((album, i) => (
                <motion.button
                  key={album.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  onClick={() => openAlbum(album)}
                  className="text-left bg-card border border-border rounded-xl overflow-hidden group hover:border-primary/50 transition-colors"
                >
                  {album.cover_url ? (
                    <div className="aspect-video overflow-hidden">
                      <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-secondary flex items-center justify-center">
                      <Camera className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-display text-lg font-bold text-foreground mb-1">{album.title}</h3>
                    {album.description && <p className="text-sm text-muted-foreground line-clamp-2">{album.description}</p>}
                    {album.event_date && <p className="text-xs text-muted-foreground mt-2">{format(new Date(album.event_date), "dd MMMM yyyy")}</p>}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            photos={photos}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNext={() => setLightboxIndex((lightboxIndex + 1) % photos.length)}
            onPrev={() => setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
