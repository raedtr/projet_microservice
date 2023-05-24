const { gql } = require('@apollo/server');

const typeDefs = `#graphql
  type Product {
    id: String!
    title: String!
    description: String!
  }

  type Order {
    id: String!
    title: String!
    description: String!
  }

  type Query {
    product(id: String!): Product
    products: [Product]
    order(id: String!): Order
    orders: [Order]
  }
  type Mutation {
    addProduct(id: String!, title: String!, description:String!): Product
    addOrder(id: String!, title: String!, description:String!): Order
    deleteProduct(id: String!): Boolean
    updateProduct(id: String!, title: String!, description: String!): Product
    updateOrder(id: String!, title: String!, description: String!): Order
    deleteOrder(id: String!): Boolean
  }
`;

module.exports = typeDefs