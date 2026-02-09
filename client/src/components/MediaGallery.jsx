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
            style={{ objectFit: 'contain', background: '#000', width: '100%', height: '100%' }}
        />
    );
};

const MediaGallery = ({ media }) => {
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
                    const fullUrl = url.startsWith('http') ? url : `http://localhost:5000/${url}`;

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
                                <img
                                    src={fullUrl}
                                    alt={`Media ${index}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Navigation Buttons - Enhanced Visibility */}
            {media.length > 1 && (
                <>
                    {currentIndex > 0 && (
                        <button
                            onClick={prev}
                            style={{
                                position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)',
                                background: 'rgba(0,0,0,0.7)', color: 'white', border: '2px solid white', borderRadius: '50%',
                                width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', zIndex: 10,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
                        >
                            <ChevronLeft size={24} />
                        </button>
                    )}
                    {currentIndex < media.length - 1 && (
                        <button
                            onClick={next}
                            style={{
                                position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)',
                                background: 'rgba(0,0,0,0.7)', color: 'white', border: '2px solid white', borderRadius: '50%',
                                width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', zIndex: 10,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
                        >
                            <ChevronRight size={24} />
                        </button>
                    )}

                    {/* Dots Indicator */}
                    <div style={{
                        position: 'absolute', bottom: '15px', left: '0', right: '0',
                        display: 'flex', justifyContent: 'center', gap: '8px', zIndex: 10,
                        pointerEvents: 'none'
                    }}>
                        {media.map((_, idx) => (
                            <div
                                key={idx}
                                style={{
                                    width: '10px', height: '10px', borderRadius: '50%',
                                    background: idx === currentIndex ? 'white' : 'rgba(255,255,255,0.4)',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                    transition: 'all 0.3s',
                                    border: '1px solid rgba(0,0,0,0.1)'
                                }}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default MediaGallery;
