import React from "react";
import ProductCard from "./ProductCard";

/**
 * ItemCard - Legacy wrapper for ProductCard
 * Maintains backward compatibility while using the unified ProductCard component
 */
function ItemCard({ item, handlePresentModalPress, cardWidth }: any) {
  return (
    <ProductCard
      item={item}
      onPress={handlePresentModalPress}
      showWishlist={true}
      cardWidth={cardWidth}
    />
  );
}

export default React.memo(ItemCard);
