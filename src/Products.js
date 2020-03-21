import React from "react"
import faker from "faker"

const Products = ({ products, addToCart }) => {
  return (
    <div>
      <h2>Products</h2>
      <ul>
        {console.log(products)}

        {products.map(product => {
          return (
            <li key={product.id}>
              <img src={product.image}></img>
              <span>
                <a href="">{product.name}</a>
              </span>
              {product.details}
              <span>${Number(product.price).toFixed(2)}</span>
              <button onClick={() => addToCart(product.id)}>Add to Cart</button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default Products
