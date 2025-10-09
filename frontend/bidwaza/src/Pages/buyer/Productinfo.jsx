import React, { useEffect } from 'react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {getProductById} from "../../services/userservices.js"
import ProductInfoCard from '../../Components/ProductInfoCard'
import {handleBuyClick, onAddToCart as handleCartclick} from '../../utils/product.js'
function Productinfo() {
   
    const {itemId} = useParams();  
   

    const [product, setProduct] = useState([]);

    
      const onAddToCart = async () =>{
        handleCartclick(product);
        console.log("Add to cart clicked");
      }
        const onBuyClick = async () =>{
        handleBuyClick(product);
        console.log("Buy Now clicked");
      }

useEffect(() => {
  const fetchProduct = async () => {
    try {
      const res = await getProductById(Number(itemId));
      console.log("productData", res);
      if (res?.success) {
        setProduct(res?.product ?? null); // <- extract the actual product object
      } else {
        setProduct(null);
        console.log("No product found");
      }
    } catch (err) {
      console.error("Error fetching product:", err);
      setProduct(null);
    }
  };

  fetchProduct();
}, [itemId]);

 
  return (
    
    <div>
      {product ? (
        <ProductInfoCard
          product={product}
          onAddToCart={onAddToCart}
          onBuyNow={onBuyClick}
        />
      ) : (
        <p>Loading...</p>
      )}
    </div>
  )
}

export default Productinfo
