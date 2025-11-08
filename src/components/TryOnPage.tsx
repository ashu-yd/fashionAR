import { useEffect, useState } from 'react';
import { supabase, Product } from '../lib/supabase';
import { ArrowLeft, Info } from 'lucide-react';

type TryOnPageProps = {
  productId: string;
};

export default function TryOnPage({ productId }: TryOnPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

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
      setProduct(data);
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    window.location.href = '/';
  };

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
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
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

            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <div className="flex-1 relative">
        <model-viewer
          src={product.model_url}
          alt={product.name}
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          auto-rotate
          shadow-intensity="1"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
          }}
        >
          <div slot="ar-button" className="ar-button-custom">
            <button className="absolute bottom-8 left-1/2 transform -translate-x-1/2 px-8 py-4 bg-white text-slate-900 rounded-full font-semibold shadow-2xl hover:scale-105 transition-transform">
              View in Your Space
            </button>
          </div>
        </model-viewer>

        <div className="absolute top-4 left-4 right-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 text-white">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">AR Try-On Instructions</p>
              <ul className="text-slate-300 space-y-1 text-xs">
                <li>• Rotate with one finger to view from all angles</li>
                <li>• Pinch to zoom in and out</li>
                <li>• Click "View in Your Space" to see it in AR</li>
                <li>• Works best on mobile devices</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 text-white">
          <h3 className="font-semibold mb-2">{product.name}</h3>
          <p className="text-sm text-slate-300 mb-3">{product.description}</p>
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
      </div>
    </div>
  );
}
