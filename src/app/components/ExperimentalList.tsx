'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';

interface ArenaBlock {
  id: number;
  title: string;
  image?: {
    large: {
      url: string;
    };
  };
  content?: string;
  class: string;
  created_at: string;
  connections?: ArenaBlock[];
}

interface CursorTrail {
  x: number;
  y: number;
  id: number;
}

interface StickerEmoji {
  x: number;
  y: number;
  emoji: string;
  rotation: number;
  id: number;
}

export default function ExperimentalList({ posts }: { posts: ArenaBlock[] }) {
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cursorTrail, setCursorTrail] = useState<CursorTrail[]>([]);
  const [stickerEmojis, setStickerEmojis] = useState<StickerEmoji[]>([]);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const trailIdRef = useRef(0);
  const stickerIdRef = useRef(0);
  const listRef = useRef<List>(null);
  const lastStickerTimeRef = useRef(0);

  // Cursor trail and sticker effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const newTrail = {
        x: e.clientX,
        y: e.clientY,
        id: trailIdRef.current++
      };
      
      setCursorTrail(prev => {
        const updated = [...prev.slice(-15), newTrail];
        // Interpolate positions for smoother trailing
        return updated.map((trail, index) => {
          if (index === updated.length - 1) return trail; // Keep current position
          const nextTrail = updated[index + 1];
          const factor = 0.8; // How much to lag behind
          return {
            ...trail,
            x: trail.x + (nextTrail.x - trail.x) * factor,
            y: trail.y + (nextTrail.y - trail.y) * factor
          };
        });
      });

      // Add sticker emoji occasionally
      const now = Date.now();
      if (now - lastStickerTimeRef.current > 500) { // Every 500ms max
        const emojis = ['🦊', '🧡', '🍊', '🟠'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        const rotation = (Math.random() - 0.5) * 60; // ±30 degrees
        
        const newSticker = {
          x: e.clientX,
          y: e.clientY,
          emoji: randomEmoji,
          rotation,
          id: stickerIdRef.current++
        };
        
        setStickerEmojis(prev => [...prev.slice(-20), newSticker]); // Keep last 20 stickers
        lastStickerTimeRef.current = now;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Update image when selected index changes
  useEffect(() => {
    const post = posts[selectedIndex];
    if (post?.image && hoveredImage) {
      setHoveredImage(post.image.large.url);
    }
  }, [selectedIndex, posts, hoveredImage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newIndex = Math.min(selectedIndex + 1, posts.length - 1);
        setSelectedIndex(newIndex);
        listRef.current?.scrollToItem(newIndex);
        
        // Update image if currently showing
        const post = posts[newIndex];
        if (post?.image && (hoveredImage || isFullscreen)) {
          setHoveredImage(post.image.large.url);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newIndex = Math.max(selectedIndex - 1, 0);
        setSelectedIndex(newIndex);
        listRef.current?.scrollToItem(newIndex);
        
        // Update image if currently showing
        const post = posts[newIndex];
        if (post?.image && (hoveredImage || isFullscreen)) {
          setHoveredImage(post.image.large.url);
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        const post = posts[selectedIndex];
        if (post?.image) {
          setHoveredImage(prev => prev === post.image!.large.url ? null : post.image!.large.url);
        }
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          // If no image is currently showing, show the selected item's image
          const post = posts[selectedIndex];
          if (post?.image) {
            setHoveredImage(post.image.large.url);
            setIsFullscreen(true);
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsFullscreen(false);
        setHoveredImage(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, posts, isFullscreen, hoveredImage]);

  // Lazy load images
  const preloadImage = useCallback((url: string) => {
    if (!loadedImages.has(url)) {
      const img = new Image();
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(url));
      };
      img.src = url;
    }
  }, [loadedImages]);

  // Preload visible images
  useEffect(() => {
    posts.forEach(post => {
      if (post.image) {
        preloadImage(post.image.large.url);
      }
    });
  }, [posts, preloadImage]);

  // List item component for virtual scrolling
  const ListItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const post = posts[index];
    const isSelected = index === selectedIndex;

    return (
      <div
        style={style}
        className={`border-b border-black py-2 cursor-pointer transition-colors font-mono ${
          isSelected ? 'bg-yellow-200' : 'hover:bg-yellow-100 active:bg-yellow-100'
        }`}
        onMouseEnter={() => {
          setSelectedIndex(index);
          if (post.image) setHoveredImage(post.image.large.url);
        }}
        onMouseLeave={() => setHoveredImage(null)}
        onTouchStart={() => {
          setSelectedIndex(index);
          if (post.image) setHoveredImage(post.image.large.url);
        }}
        onTouchEnd={() => setHoveredImage(null)}
      >
        <div className="flex justify-between items-center text-sm sm:text-base px-4">
          <span className="flex-1 truncate font-bold">
            {post.title || `[untitled-${post.id}]`}
          </span>
          <div className="flex items-center ml-4 shrink-0">
            <time className="text-black">
              {new Date(post.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              })} {new Date(post.created_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}
            </time>
          </div>
        </div>
      </div>
    );
  }, [posts, selectedIndex, preloadImage]);

  if (isFullscreen && hoveredImage) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-black flex items-center justify-center"
        tabIndex={0}
        style={{ outline: 'none' }}
      >
        <img
          src={hoveredImage}
          alt="Orange"
          className="max-w-full max-h-full object-contain"
        />
        <div className="absolute top-4 left-4 text-white font-mono text-sm">
          {selectedIndex + 1} / {posts.length}
        </div>
        <div className="absolute top-4 right-4 text-white font-mono text-sm">
          ↑↓ navigate • esc exit
        </div>
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute bottom-4 right-4 text-white bg-black bg-opacity-50 px-4 py-2 font-mono"
        >
          [ESC]
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Pinned Sticker Emojis */}
      {stickerEmojis.map((sticker) => (
        <div
          key={sticker.id}
          className="fixed pointer-events-none z-30 select-none"
          style={{
            left: sticker.x - 12,
            top: sticker.y - 12,
            fontSize: '24px',
            transform: `rotate(${sticker.rotation}deg)`,
            opacity: 0.8,
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
          }}
        >
          {sticker.emoji}
        </div>
      ))}

      {/* Cursor Trail */}
      {cursorTrail.map((trail, index) => {
        const emojis = ['🦊', '🧡', '🍊', '🟠'];
        const emoji = emojis[index % emojis.length];
        
        return (
          <div
            key={trail.id}
            className="fixed pointer-events-none z-40 select-none"
            style={{
              left: trail.x - 12,
              top: trail.y - 12,
              fontSize: `${8 + Math.pow((index + 1) / cursorTrail.length, 0.3) * 16}px`,
              opacity: Math.pow((index + 1) / cursorTrail.length, 0.5) * 0.9,
              transform: `scale(${Math.pow((index + 1) / cursorTrail.length, 0.3) * 1.5}) rotate(${(Math.random() - 0.5) * 30}deg)`,
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `blur(${Math.max(0, 2 - (index + 1) / cursorTrail.length * 2)}px)`,
              textShadow: `0 0 ${(index + 1) * 3}px rgba(255,165,0,${(index + 1) / cursorTrail.length * 0.6})`
            }}
          >
            {emoji}
          </div>
        );
      })}

      {/* Controls */}
      <div className="mb-4 font-mono text-xs text-gray-600 flex justify-between items-center">
        <span>↑↓ navigate • space toggle • f fullscreen • esc exit</span>
        <button
          onClick={() => setIsFullscreen(true)}
          className="px-2 py-1 border border-black hover:bg-yellow-100"
        >
          [F]
        </button>
      </div>

      {/* Virtual List */}
      <List
        ref={listRef}
        height={600}
        width="100%"
        itemCount={posts.length}
        itemSize={50}
        itemData={posts}
      >
        {ListItem}
      </List>

      {/* Image Overlay */}
      {hoveredImage && !isFullscreen && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <img
            src={hoveredImage}
            alt="Orange"
            className="w-[80vw] h-[60vh] sm:w-[50vw] sm:h-[50vh] object-cover"
            style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' }}
          />
        </div>
      )}
    </>
  );
}