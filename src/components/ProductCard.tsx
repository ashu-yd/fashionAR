import { useState } from 'react';
import { Product, supabase } from '../lib/supabase';
import { ShoppingCart, Glasses, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const { user } = useAuth();

  const handleAddToCart = async () => {
    if (!user) return;

    setAdding(true);
    try {
      const { data: existingItem } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (existingItem) {
        await supabase
          .from('cart')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);
      } else {
        await supabase
          .from('cart')
          .insert({
            user_id: user.id,
            product_id: product.id,
            quantity: 1,
          });
      }

      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleTryOn = () => {
    window.location.href = `/tryon/${product.id}`;
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group">
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-slate-900 capitalize">
            {product.category}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{product.description}</p>

        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-slate-900">${product.price}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleTryOn}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all font-medium text-slate-900"
          >
            <Glasses className="w-4 h-4" />
            <span className="text-sm">Try On</span>
          </button>

          <button
            onClick={handleAddToCart}
            disabled={adding || added}
            className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg transition-all font-medium ${
              added
                ? 'bg-green-500 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                <span className="text-sm">Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span className="text-sm">Buy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
