interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
  }
  
  const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
    const [isHovered, setIsHovered] = useState(false);
  
    return (
      <div 
        className={styles.card}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Image 
          src={product.images[0]} 
          alt={product.name} 
          width={300} 
          height={200}
          className={styles.image}
        />
        <div className={styles.content}>
          <h3>{product.name}</h3>
          <p className={styles.price}>
            {formatPrice(product.price, product.currency)}
          </p>
          <Button 
            variant="primary"
            onClick={() => onAddToCart(product)}
            aria-label={`Add ${product.name} to cart`}
          >
            <CartIcon /> Add to Cart
          </Button>
          {isHovered && <QuickView productId={product.id} />}
        </div>
      </div>
    );
  };

export default ProductCard;