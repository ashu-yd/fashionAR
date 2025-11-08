import { useEffect, useState } from 'react';
import { supabase, CartItem } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Check } from 'lucide-react';
import { logger } from '../utils/logger'; // or './utils/logger' depending on your file location

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadCart();
    }
  }, [user]);

  const loadCart = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cart')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      logger.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user || cartItems.length === 0) return;

    setProcessing(true);
    try {
      const total = cartItems.reduce((sum, item) => {
        const price = item.product?.price || 0;
        return sum + (price * item.quantity);
      }, 0);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: total,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const { error: deleteError } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setOrderId(order.id);
      setOrderPlaced(true);
    } catch (error) {
      logger.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleBackToStore = () => {
    window.location.href = '/';
  };

  const handleBackToCart = () => {
    window.location.href = '/cart';
  };

  const total = cartItems.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + (price * item.quantity);
  }, 0);

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Order Placed Successfully!</h2>
          <p className="text-slate-600 mb-6">
            Your order has been confirmed. Thank you for shopping with us!
          </p>
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-600 mb-1">Order ID</p>
            <p className="font-mono text-sm font-medium text-slate-900">{orderId}</p>
          </div>
          <button
            onClick={handleBackToStore}
            className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-all"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={handleBackToCart}
              className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Cart</span>
            </button>

            <h1 className="text-xl font-bold text-slate-900">Checkout</h1>

            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="bg-white rounded-xl h-96 animate-pulse"></div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Your cart is empty</h3>
            <button
              onClick={handleBackToStore}
              className="px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-all"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h2>
              <div className="bg-white rounded-xl p-6 space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <img
                      src={item.product?.image_url}
                      alt={item.product?.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 text-sm line-clamp-1">
                        {item.product?.name}
                      </h3>
                      <p className="text-sm text-slate-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-slate-900">
                      ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-medium text-slate-900">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600">Shipping</span>
                    <span className="font-medium text-slate-900">Free</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-lg font-semibold text-slate-900">Total</span>
                    <span className="text-2xl font-bold text-slate-900">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment Information</h2>
              <div className="bg-white rounded-xl p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    This is a demo checkout. No actual payment will be processed.
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                      disabled
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                        disabled
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                      disabled
                    />
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={processing}
                  className="w-full py-4 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : `Place Order - $${total.toFixed(2)}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
