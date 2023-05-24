const sqlite3 = require('sqlite3').verbose();

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');


const productProtoPath = 'product.proto';
const orderProtoPath = 'order.proto';
const productProtoDefinition = protoLoader.loadSync(productProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const orderProtoDefinition = protoLoader.loadSync(orderProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const productProto = grpc.loadPackageDefinition(productProtoDefinition).product;
const orderProto = grpc.loadPackageDefinition(orderProtoDefinition).order;
const clientProducts = new productProto.ProductService('localhost:50051', grpc.credentials.createInsecure());
const clientOrders = new orderProto.OrderService('localhost:50052', grpc.credentials.createInsecure());

const db = new sqlite3.Database('./database.sqlite');

db.run(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    title TEXT,
    description TEXT
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    title TEXT,
    description TEXT
  )
`);


const resolvers = {
  Query: {
    order: (_, { id }) => {
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM orders WHERE id = ?', [id], (err, row) => {
          if (err) {
            reject(err);
          } else if (row) {
            resolve(row);
          } else {
            resolve(null);
          }
        });
      });
    },
    orders: () => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM orders', (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    },
    product: (_, { id }) => {
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
          if (err) {
            reject(err);
          } else if (row) {
            resolve(row);
          } else {
            resolve(null);
          }
        });
      });
    },
    products: () => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM products', (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    },
},
Mutation: {
    addOrder: (_, { id,title, description }) => {
      return new Promise((resolve, reject) => {
        db.run('INSERT INTO orders (id,title, description) VALUES (?, ?, ?)', [id,title, description], function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id, title, description });
          }
        });
      });
    },
    addProduct: (_, { id,title, description }) => {
      return new Promise((resolve, reject) => {
        db.run('INSERT INTO products (title, description) VALUES (?, ?)', [title, description], function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ title, description });
          }
        });
      });
    },
    updateProduct: (_, { id, title, description }) => {
      return new Promise((resolve, reject) => {
        db.run('UPDATE products SET title = ?, description = ? WHERE id = ?', [title, description, id], function (err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            reject(new Error('Product not found'));
          } else {
            resolve({ id, title, description });
          }
        });
      });
    },
    deleteProduct: (_, { id }) => {
      return new Promise((resolve, reject) => {
        db.run('DELETE FROM products WHERE id = ?', [id], function (err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            reject(new Error('Product not found'));
          } else {
            resolve(true);
          }
        });
      });
    },
    updateOrder: (_, { id, title, description }) => {
      return new Promise((resolve, reject) => {
        db.run('UPDATE orders SET title = ?, description = ? WHERE id = ?', [title, description, id], function (err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            reject(new Error('Order not found'));
          } else {
            resolve({ id, title, description });
          }
        });
      });
    },
    deleteOrder: (_, { id }) => {
      return new Promise((resolve, reject) => {
        db.run('DELETE FROM orders WHERE id = ?', [id], function (err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            reject(new Error('Order not found'));
          } else {
            resolve(true);
          }
        });
      });}
  },
};
module.exports = resolvers;
