import {useAuth} from '../Context/Authcontext.jsx'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import {initiateBuyNowPayment , initiateCartPayment} from '../services/userservices.js'


export const usePayment = () => {
    const {user} = useAuth();
    const navigate = useNavigate();

    const handleBuyNow = async (product, quantity=1, amount) => {
       try {
         if(!user){
             toast.error("Please login to proceed with payment");
             navigate('/login');
             return;
         }   
 
         //checking stock
         if(product.stock < quantity){
             toast.error(`Only ${product.stock} items in stock`);
             return;
         }
          // Calculate amount
      const calculatedAmount = product.amount * quantity;

      // Show loading toast
      const loadingToast = toast.loading('Initiating payment...');

      // Initiate payment
      const response = await initiateBuyNowPayment(product.itemId, quantity, calculatedAmount);
      toast.dismiss(loadingToast);

      if (!response.success) {
        toast.error(response.message);
        return;
      }

      // FIXED: Get userId properly and store it in sessionStorage
      const userId = user?.ID || user?.userId || user?.id;
      
      if (!userId) {
        toast.error("User session error. Please login again.");
        navigate('/login');
        return;
      }

      // Store payment info in sessionStorage for verification later
      sessionStorage.setItem('pendingPayment', JSON.stringify({
        type: 'buyNow',
        productId: product.itemId,
        quantity,
        amount: calculatedAmount,
        userId // ✅ NOW STORING userId!
      }));

      console.log('Stored pending payment:', {
        type: 'buyNow',
        productId: product.itemId,
        quantity,
        amount: calculatedAmount,
        userId
      });

      // Submit payment form to eSewa
      submitEsewaForm(response.data);
       } catch (error) {
         console.error('Buy now error:', error);
        toast.error('Failed to initiate payment');
       }
    }

     // === Handle Cart Checkout (Multiple Products) ===
  const handleCartCheckout = async (cartItems, summary) => {
    try {
      if (!user) {
        toast.error('Please login to continue');
        navigate('/login');
        return;
      }

      if (!cartItems || cartItems.length === 0) {
        toast.error('Your cart is empty');
        return;
      }

      // Validate stock for all items
      for (const item of cartItems) {
        if (item.stock < item.quantity) {
          toast.error(`Not enough stock for ${item.title}`);
          return;
        }
      }

      const loadingToast = toast.loading('Initiating payment...');

      // Initiate payment
      const response = await initiateCartPayment(cartItems, summary.totalAmount);
      toast.dismiss(loadingToast);

      if (!response.success) {
        toast.error(response.message);
        return;
      }

      // FIXED: Get userId properly
      const userId = user?.ID || user?.userId || user?.id;
      
      if (!userId) {
        toast.error("User session error. Please login again.");
        navigate('/login');
        return;
      }

      // Store payment info in sessionStorage for verification later
      sessionStorage.setItem('pendingPayment', JSON.stringify({
        type: 'cart',
        cartItems: cartItems.map(item => ({
          productId: item.itemId || item.productId,
          quantity: item.quantity
        })),
        amount: summary.totalAmount,
        userId // ✅ NOW STORING userId!
      }));

      console.log('Stored pending payment:', {
        type: 'cart',
        cartItems: cartItems.map(item => ({
          productId: item.itemId || item.productId,
          quantity: item.quantity
        })),
        amount: summary.totalAmount,
        userId
      });

      // Submit payment form to eSewa
      submitEsewaForm(response.data);

    } catch (error) {
      console.error('Cart checkout error:', error);
      toast.error('Failed to initiate payment');
    }
  };

    // === Submit eSewa Payment Form ===
const submitEsewaForm = (paymentData) => {
    const { esewaURL, paymentData: formData } = paymentData;

    // ADD THIS DEBUG LOG
    console.log('=== Submitting to eSewa ===');
    console.log('URL:', esewaURL);
    console.log('Form Data:', formData);
    console.log('==========================');

    // Create a form dynamically
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = esewaURL;

    // Add form fields
    Object.keys(formData).forEach(key => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = formData[key];
      form.appendChild(input);
      console.log(`Field: ${key} = ${formData[key]}`); // Log each field
    });

    // Append to body and submit
    document.body.appendChild(form);
    form.submit();
  };

    return {handleBuyNow, handleCartCheckout};
}