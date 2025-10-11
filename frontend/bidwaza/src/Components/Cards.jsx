import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Calendar, ShoppingBag, ShoppingCart } from "lucide-react";

const ProductCard = ({ product, onBuyClick, onAddToCart, onClick: onProductClick }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.url ||
    product.images?.[0]?.url ||
    "/placeholder.png";

  const formattedDate = new Date(product.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const getInitials = (name) => {
    return name?.charAt(0).toUpperCase() || "?";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="w-full"
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-white/5 backdrop-blur-md"
   
      >

        <div
         onClick={()=> onProductClick?.(product.itemId)}
        >
        {/* Product Image */}
        <div
          className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 cursor-pointer"
          onClick={() => onProductClick?.(product)}
        >
          <motion.img
            src={primaryImage}
            alt={product.title}
            className="w-full h-full object-cover"
            animate={{ scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />

          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Category Badge */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            className="absolute top-3 left-3"
          >
            <span className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 text-xs font-semibold rounded-full shadow-lg">
              {product.category}
            </span>
          </motion.div>

          {/* Stock Indicator */}
          {product.stock && (
            <motion.div
              className="absolute bottom-3 right-3"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <div className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm shadow-md">
                <span className="text-xs font-semibold text-gray-800">
                  {product.stock} left
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-4 space-y-3">
          {/* Product Title */}
          <motion.h3
            className="text-lg font-bold text-white line-clamp-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {product.title}
          </motion.h3>

          {/* Description with Smooth Expand */}
          <motion.div
            layout
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative"
          >
            <motion.p
              layout
              className={`text-sm text-gray-400 leading-relaxed ${
                showFullDesc ? "line-clamp-none" : "line-clamp-2"
              }`}
            >
              {product.description}
            </motion.p>

            {product.description?.length > 100 && (
              <button
                onClick={() => setShowFullDesc((prev) => !prev)}
                className="text-xs mt-1 text-blue-400 hover:text-purple-400 transition-colors"
              >
                {showFullDesc ? "See Less" : "See More"}
              </button>
            )}
          </motion.div>
</div>
          {/* Price Section */}
          <motion.div
            className="flex items-baseline gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ₹{product.amount?.toLocaleString()}
            </span>
          </motion.div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Seller Info & Date */}
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center gap-2 cursor-pointer"
              whileHover={{ x: 2 }}
              transition={{ type: "spring", stiffness: 300 }}
              onClick={() => onSellerClick?.(product.seller)}
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-purple-500/50">
                {product.seller?.profilePicture ? (
                  <img
                    src={product.seller.profilePicture}
                    alt={product.seller?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                    {getInitials(product.seller?.name)}
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">
                  {product.seller?.name}
                </span>
                <span className="text-xs text-gray-400">Verified</span>
              </div>
            </motion.div>

            <div className="flex items-center gap-1.5 text-gray-400 text-xs bg-white/5 px-2 py-1 rounded-lg">
              <Calendar size={12} />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Buy Now */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
                e.stopPropagation();
                console.log(product?.amount)
              onBuyClick?.(product,1,product?.amount)
              
            }}
              
            className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2 group"
          >
            <ShoppingBag
              size={18}
              className="group-hover:rotate-12 transition-transform duration-200"
            />
            <span>Buy Now</span>
          </motion.button>

          {/* Add to Cart */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
               e.stopPropagation();
              onAddToCart?.(product)}}
            className="w-full mt-2 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-colors flex items-center justify-center gap-2 group"
          >
            <ShoppingCart
              size={18}
              className="group-hover:scale-110 transition-transform duration-200"
            />
            <span>Add to Cart</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
