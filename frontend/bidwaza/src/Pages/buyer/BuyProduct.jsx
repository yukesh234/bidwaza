import React from 'react'
import { useParams } from 'react-router-dom'
function BuyProduct() {
    const {product} = useParams();
  return (
    <div>
    <h1>{product}</h1>
    </div>
  )
}

export default BuyProduct
