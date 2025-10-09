 import { useAuth  } from "../Context/Authcontext";
 import {addtocart} from '../services/userservices.js'
 import toast from "react-hot-toast";
 
 
 
 
 // === Handle Buy Click ===
  const handleBuyClick = (product) => {

      // Navigate to product detail or checkout
      console.log('Buying:', product);
      navigate(`/product/${product.itemId}`);
    
  };

  const onAddToCart = async (product) =>{
   
      const response = await addtocart(product.itemId);
      if(response.success){
        console.log(response.message);
        toast.success(response.message);
        navigate('/');
      }
      else{
        toast.error(response.message);
         navigate('/');
      }
    
  }

  export {handleBuyClick,onAddToCart};