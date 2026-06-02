import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const VideoPlayer = ({ src }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        videoRef.current?.play().catch(e => console.log('Autoplay prevented:', e));
                    } else {
                        videoRef.current?.pause();
                    }
                });
            },
            { threshold: 0.6 }
        );

        if (videoRef.current) {
            observer.observe(videoRef.current);
        }

        return () => {
            if (videoRef.current) {
                observer.unobserve(videoRef.current);
            }
        };
    }, []);

    return (
        <video
            ref={videoRef}
            src={src}
            controls
            muted
            playsInline
            loop
            style={{ objectFit: 'cover', background: '#000', width: '100%', height: '100%' }}
        />
    );
};

const MediaGallery = ({ media, objectFit = 'cover' }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollContainerRef = useRef(null);

    if (!media || media.length === 0) {
        return (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0', color: '#94a3b8' }}>
                Sin Multimedia
            </div>
        );
    }

    const scrollTo = (index) => {
        if (scrollContainerRef.current) {
            const width = scrollContainerRef.current.offsetWidth;
            scrollContainerRef.current.scrollTo({
                left: width * index,
                behavior: 'smooth'
            });
            setCurrentIndex(index);
        }
    };

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const width = scrollContainerRef.current.offsetWidth;
            const index = Math.round(scrollContainerRef.current.scrollLeft / width);
            setCurrentIndex(index);
        }
    };

    const next = (e) => {
        e.stopPropagation();
        if (currentIndex < media.length - 1) scrollTo(currentIndex + 1);
    };

    const prev = (e) => {
        e.stopPropagation();
        if (currentIndex > 0) scrollTo(currentIndex - 1);
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}
            >
                {media.map((item, index) => {
                    // Handle legacy string URLs vs object {url, type}
                    const url = typeof item === 'string' ? item : item.url;
                    const type = typeof item === 'string' ? 'image' : (item.type || 'image');
                    let fullUrl = url.startsWith('http') ? url : (import.meta.env.PROD ? `/${url}` : `http://localhost:5000/${url}`);
                    
                    // HEIC Support: If URL ends in .heic, request it as .jpg from Cloudinary (on-the-fly conversion)
                    if (fullUrl.toLowerCase().endsWith('.heic')) {
                        fullUrl = fullUrl.replace(/\.heic$/i, '.jpg');
                    }

                    return (
                        <div
                            key={index}
                            style={{
                                flex: '0 0 100%',
                                width: '100%',
                                height: '100%',
                                scrollSnapAlign: 'start',
                                position: 'relative'
                            }}
                        >
                            {type === 'video' ? (
                                <VideoPlayer src={fullUrl} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-input)' }}>
                                    {objectFit === 'contain' && (
                                        <img 
                                            src={fullUrl} 
                                            alt="" 
                                            style={{ 
                                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                                                objectFit: 'cover', filter: 'blur(20px) brightness(0.7)', opacity: 0.5,
                                                transform: 'scale(1.1)' 
                                            }} 
                                        />
                                    )}
                                    <img
                                        src={fullUrl}
                                        alt={`Media ${index}`}
                                        style={{ width: '100%', height: '100%', objectFit, position: 'relative', zIndex: 1 }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {media.length > 1 && (
                <>
                    {currentIndex > 0 && (
                        <button
                            onClick={prev}
                            style={{ position: 'absolute', top: '50%', left: '8px', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, transition: 'background 0.15s', padding: 0, marginTop: 0, boxShadow: 'none' }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
                        >
                            <ChevronLeft size={15} strokeWidth={2.5} />
                        </button>
                    )}
                    {currentIndex < media.length - 1 && (
                        <button
                            onClick={next}
                            style={{ position: 'absolute', top: '50%', right: '8px', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, transition: 'background 0.15s', padding: 0, marginTop: 0, boxShadow: 'none' }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
                        >
                            <ChevronRight size={15} strokeWidth={2.5} />
                        </button>
                    )}

                    {/* Dot indicators */}
                    <div style={{ position: 'absolute', bottom: '8px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '5px', zIndex: 10, pointerEvents: 'none' }}>
                        {media.map((_, idx) => (
                            <div key={idx} style={{ width: idx === currentIndex ? '16px' : '5px', height: '5px', borderRadius: '99px', background: idx === currentIndex ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'all 0.25s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default MediaGallery;
