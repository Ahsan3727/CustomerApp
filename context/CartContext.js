import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item._id === product._id);
      if (existingItem) {
        return prevCart.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + (product.quantity || 1) }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: product.quantity || 1 }];
    });
  };

  // Adding a whole bundle just adds each of its products individually,
  // reusing the same merge-by-_id logic as a normal "+" tap — this keeps
  // checkout/stock-decrement/rider-picking exactly as they already work,
  // since a bundle is just several products ordered together. The only
  // difference: price is the bundle's allocated per-unit price (e.g. Rs 50
  // for 0.6kg onion → Rs 83.3/kg), not the product's regular catalog price,
  // and each line is tagged with bundleName so Cart/Checkout can show
  // "From: Rs 300 Sabzi Hub" instead of it looking like unrelated items.
  // Known limitation: if the same product is already in the cart from a
  // manual add, it merges into one row and keeps whichever price was there
  // first — fine for v1, but worth knowing about.
  const addBundleToCart = (bundle) => {
    (bundle.items || []).forEach((item) => {
      const product = item.product;
      if (!product || !product._id) return;
      const unitPrice = item.quantity > 0 ? item.allocatedPrice / item.quantity : item.allocatedPrice;
      addToCart({
        ...product,
        price: unitPrice,
        adminPrice: unitPrice,
        quantity: item.quantity,
        bundleName: bundle.name,
      });
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item._id !== productId));
  };

  // NEW
  const changeCartQuantity = (productId, delta) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item._id === productId
          ? { ...item, quantity: item.quantity + delta }
          : item
      ).filter(item => item.quantity > 0)
    );
  };

  const clearCart = () => setCart([]);

  // NEW
  const cartTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      addBundleToCart,
      removeFromCart,
      clearCart,
      changeCartQuantity,
      cartTotalItems,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);