// Description: This component represents a single item in the cart. It displays the item's image, name, price, and quantity. It also provides buttons to increase or decrease the quantity and to remove the item from the cart.
// It uses the `useCart` context to manage the cart state and actions.

import React from 'react';
import { CartItem } from '../cart/cartTypes';
import { useCart } from '../../context/CartContext';

interface CartItemProps {
  item: CartItem;
}

const CartItemComponent: React.FC<CartItemProps> = ({ item }) => {
  const { addItem, subtractItem, deleteItem } = useCart();

  return (
    <div className="cart-item">
      <img src={item.image || '/placeholder-product.jpg'} alt={item.name} />
      <div className="item-details">
        <h3>{item.name}</h3>
        <p>${item.price.toFixed(2)}</p>
        <div className="quantity-controls">
          <button onClick={() => subtractItem(item.id)}>-</button>
          <span>{item.quantity}</span>
          <button onClick={() => addItem({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image
          })}>+</button>
        </div>
        <button 
          className="remove-button"
          onClick={() => deleteItem(item.id)}
        >
          Remove
        </button>
      </div>
    </div>
  );
};

export default CartItemComponent;