import React from 'react'
import { useParams } from 'react-router-dom'
function BuyProduct() {
    const {productId} = useParams();
  return (
    <div>
    <h1>{productId}</h1>
    </div>
  )
}

export default BuyProduct
