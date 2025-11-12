import { useEffect, useState, useRef } from 'react';
import { supabase, Product } from '../lib/supabase';
import { ArrowLeft, Info, Camera, Square, User, Play, Pause, AlertCircle } from 'lucide-react';
import { logger } from '../utils/logger';
import { BodyTrackSDK } from '../sdk/BodyTrackSDK';

type TryOnPageProps = {
  productId: string;
};

export default function TryOnPage({ productId }: TryOnPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [fps, setFps] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sdkRef = useRef<BodyTrackSDK | null>(null);
  const [scriptsReady, setScriptsReady] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();

      if (error) throw error;
      logger.log('Product loaded:', data);
      setProduct(data);
    } catch (error) {
      logger.error('Error loading product:', error);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const startTracking = async () => {
    if (!scriptsReady) {
      setError('Required libraries are still loading. Please wait...');
      return;
    }

    if (!videoRef.current || !canvasRef.current) {
      setError('Video or canvas element not ready');
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      const sdk = new BodyTrackSDK({
        videoElement: videoRef.current,
        canvasElement: canvasRef.current,
        showSkeleton: showSkeleton,
        modelUrl: product?.model_url || null,
        onLandmarksDetected: (landmarks: any, currentFps: number) => {
          setFps(currentFps);
        }
      });

      const result = await sdk.init();

      if (result.success) {
        sdkRef.current = sdk;
        setIsTracking(true);
        logger.log('Body tracking started');
      } else {
        setError(result.error || 'Failed to initialize tracking');
      }
    } catch (err: any) {
      setError(err.message);
      logger.error('Tracking error:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  const stopTracking = () => {
    if (sdkRef.current) {
      sdkRef.current.stop();
      sdkRef.current = null;
    }
    setIsTracking(false);
    setFps(0);
  };

  const toggleVisualization = () => {
    const newShowSkeleton = !showSkeleton;
    setShowSkeleton(newShowSkeleton);
    if (sdkRef.current) {
      sdkRef.current.toggleVisualization(newShowSkeleton);
    }
  };

  const handleBack = () => {
    stopTracking();
    window.location.href = '/';
  };

  useEffect(() => {
    return () => {
      if (sdkRef.current) {
        sdkRef.current.stop();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading AR experience...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-white text-2xl font-bold mb-4">Product not found</h2>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-white text-slate-900 rounded-lg font-medium"
          >
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-white hover:text-slate-300 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Store</span>
            </button>

            <div className="text-white text-center">
              <h1 className="font-semibold">{product.name}</h1>
              <p className="text-sm text-slate-400">${product.price}</p>
            </div>

            {isTracking && (
              <div className="bg-green-500/20 text-green-300 px-3 py-1 rounded-lg text-sm font-mono">
                {fps} FPS
              </div>
            )}

            {!isTracking && <div className="w-24"></div>}
          </div>
        </div>
      </header>

      <div className="flex-1 relative bg-black">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          style={{ transform: 'scaleX(-1)' }}
        />

        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="absolute top-0 left-0 w-full h-full"
          style={{ transform: 'scaleX(-1)' }}
        />

        {error && (
          <div className="absolute top-20 left-4 right-4 bg-red-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg flex items-start gap-3 z-40">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {!isTracking && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-30">
            <div className="text-center text-white max-w-md px-6">
              <Camera className="w-16 h-16 mx-auto mb-4 text-blue-400" />
              <h2 className="text-2xl font-bold mb-2">Virtual Try-On</h2>
              <p className="text-slate-300 mb-6">
                See how {product.name} looks on you in real-time
              </p>

              <div className="bg-slate-800/80 rounded-lg p-4 mb-6 text-left">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-2">Instructions:</p>
                    <ul className="text-slate-300 space-y-1 text-xs">
                      <li>• Allow camera access when prompted</li>
                      <li>• Stand back so your upper body is visible</li>
                      <li>• Make sure you're in a well-lit area</li>
                      <li>• The garment will overlay on your body</li>
                    </ul>
                  </div>
                </div>
              </div>

              {!scriptsReady && (
                <div className="mb-4 text-sm text-blue-300">
                  Loading required libraries...
                </div>
              )}

              <button
                onClick={startTracking}
                disabled={isInitializing || !scriptsReady}
                className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg font-semibold transition-all shadow-lg w-full max-w-xs mx-auto"
              >
                <Play className="w-5 h-5" />
                {isInitializing
                  ? 'Starting Camera...'
                  : scriptsReady
                  ? 'Start Virtual Try-On'
                  : 'Loading...'}
              </button>
            </div>
          </div>
        )}

        {isTracking && (
          <>
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start gap-4 z-20">
              <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 text-white flex-1">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Tips for Best Results</p>
                    <ul className="text-slate-300 space-y-1 text-xs">
                      <li>• Stand 3-4 feet from camera</li>
                      <li>• Keep upper body visible</li>
                      <li>• Move slowly for smooth tracking</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-4 z-20">
              <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 text-white">
                <h3 className="font-semibold mb-1">{product.name}</h3>
                <p className="text-sm text-slate-300 mb-3 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">${product.price}</span>
                  <button
                    onClick={handleBack}
                    className="px-6 py-2 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-100 transition-all"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={stopTracking}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg"
                >
                  <Pause className="w-5 h-5" />
                  Stop Try-On
                </button>

                <button
                  onClick={toggleVisualization}
                  className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg"
                >
                  {showSkeleton ? (
                    <Square className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline">
                    {showSkeleton ? 'Show Garment' : 'Show Skeleton'}
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}