import React, { useState } from 'react';
import { ShoppingCart, Trash2, X } from 'lucide-react';
import type { CartItem, Coupon } from '../types';
import toast from 'react-hot-toast';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (dishId: number, quantity: number) => void;
  onRemoveItem: (dishId: number) => void;
  onClear: () => void;
  coupons: Coupon[];
  onPlaceOrder: (couponId?: string) => void;
}

export const Cart: React.FC<CartProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClear,
  coupons,
  onPlaceOrder
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState<string>();

  const total = items.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);
  const selectedCoupon = coupons.find(c => c.id === selectedCouponId);
  const finalTotal = Math.max(0, total - (selectedCoupon?.discount || 0));

  const handlePlaceOrder = () => {
    if (items.length === 0) {
      toast.error('购物车是空的！');
      return;
    }
    onPlaceOrder(selectedCouponId);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-all"
      >
        <ShoppingCart size={24} />
        {items.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-white text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
            {items.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl w-full max-w-lg border border-gray-800">
            <div className="flex justify-between items-center p-4 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">购物车</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-center text-gray-400 py-8">购物车是空的</p>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.dish.id}
                      className="flex items-center justify-between bg-gray-800 p-4 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={item.dish.image}
                          alt={item.dish.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div>
                          <h3 className="font-medium text-white">{item.dish.name}</h3>
                          <p className="text-sm text-gray-400">¥{item.dish.price}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onUpdateQuantity(item.dish.id, item.quantity - 1)}
                            className="text-gray-400 hover:text-white"
                          >
                            -
                          </button>
                          <span className="text-white w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.dish.id, item.quantity + 1)}
                            className="text-gray-400 hover:text-white"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => onRemoveItem(item.dish.id)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {coupons.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-white font-medium mb-2">可用优惠券</h3>
                  <select
                    value={selectedCouponId || ''}
                    onChange={(e) => setSelectedCouponId(e.target.value || undefined)}
                    className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700"
                  >
                    <option value="">不使用优惠券</option>
                    {coupons.map((coupon) => (
                      <option key={coupon.id} value={coupon.id}>
                        {coupon.code} - 优惠{coupon.discount}元
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="border-t border-gray-800 p-4">
              <div className="flex justify-between text-gray-400 mb-2">
                <span>小计</span>
                <span>¥{total}</span>
              </div>
              {selectedCoupon && (
                <div className="flex justify-between text-red-500 mb-2">
                  <span>优惠券折扣</span>
                  <span>-¥{selectedCoupon.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-white font-bold mb-4">
                <span>总计</span>
                <span>¥{finalTotal}</span>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={onClear}
                  className="flex-1 py-2 px-4 rounded-lg border border-gray-600 text-gray-400 hover:bg-gray-800"
                >
                  清空购物车
                </button>
                <button
                  onClick={handlePlaceOrder}
                  className="flex-1 py-2 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  下单
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};