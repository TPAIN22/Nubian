// Description: This component displays the cart summary including item count, total price, shipping cost, tax, and a button to proceed to checkout. It uses the CartContext to get the cart details.
// Import necessary libraries and components

import React from 'react';
import { useCart } from '../../context/CartContext';

const CartSummary: React.FC = () => {
  const { totalPrice, itemCount, clearCart } = useCart();
  
  const shippingCost = totalPrice > 100 ? 0 : 10;
  const tax = totalPrice * 0.08;

  return (
    <div className="cart-summary">
      <h2>Order Summary</h2>
      <div className="summary-item">
        <span>Items ({itemCount}):</span>
        <span>${totalPrice.toFixed(2)}</span>
      </div>
      <div className="summary-item">
        <span>Shipping:</span>
        <span>${shippingCost.toFixed(2)}</span>
      </div>
      <div className="summary-item">
        <span>Tax:</span>
        <span>${tax.toFixed(2)}</span>
      </div>
      <div className="summary-total">
        <span>Total:</span>
        <span>${(totalPrice + shippingCost + tax).toFixed(2)}</span>
      </div>
      <button 
        className="checkout-button"
        onClick={clearCart}
        disabled={itemCount === 0}
      >
        Proceed to Checkout
      </button>
    </div>
  );
};

export default CartSummary;