import React from "react";
import ProductCard from "./ProductCard";

interface item {
  _id: string;
  name: string;
  price: number;
  images?: string[];
  discountPrice?: number;
  stock?: number;
}

/**
 * ItemCard - Legacy wrapper for ProductCard
 * Maintains backward compatibility while using the unified ProductCard component
 */
function ItemCard({ item, handleSheetChanges, handlePresentModalPress, cardWidth }: any) {
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
