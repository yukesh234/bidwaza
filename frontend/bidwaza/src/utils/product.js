 import { useAuth  } from "../Context/Authcontext";
 import {addtocart} from '../services/userservices.js'
 import toast from "react-hot-toast";
 
 
 

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

  export {onAddToCart};