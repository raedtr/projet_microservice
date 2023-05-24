const sqlite3 = require('sqlite3').verbose();
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const productProtoPath = 'product.proto';
const productProtoDefinition = protoLoader.loadSync(productProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const productProto = grpc.loadPackageDefinition(productProtoDefinition).product;
const db = new sqlite3.Database('./database.sqlite');

db.run(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    title TEXT,
    description TEXT
  )
`);
const productService = {
  getProduct: (call, callback) => {
    const { product_id } = call.request;

    db.get('SELECT * FROM products WHERE id = ?', [product_id], (err, row) => {
      if (err) {
        callback(err);
      } else if (row) {
        const product = {
          id: row.id,
          title: row.title,
          description: row.description,
        };
        callback(null, { product });
      } else {
        callback(new Error('Product not found'));
      }
    });
  },
  searchProducts: (call, callback) => {
    db.all('SELECT * FROM products', (err, rows) => {
      if (err) {
        callback(err);
      } else {
        const products = rows.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description,
        }));
        callback(null, { products });
      }
    });
  },
  createProduct: (call, callback) => {
    const { product_id, title, description } = call.request;
    db.run(
      'INSERT INTO products (id, title, description) VALUES (?, ?, ?)',
      [product_id, title, description],
      function (err) {
        if (err) {
          callback(err);
        } else {
          const product = {
            id: product_id,
            title,
            description,
          };
          callback(null, { product });
        }
      }
    );
  },
  updateProduct: (call, callback) => {
    const { product_id, title, description } = call.request;
    db.run(
      'UPDATE products SET title = ?, description = ? WHERE id = ?',
      [title, description, product_id],
      function (err) {
        if (err) {
          callback(err);
        } else {
          const product = {
            id: product_id,
            title,
            description,
          };
          callback(null, { product });
        }
      }
    );
  },
  deleteProduct: (call, callback) => {
    const { product_id } = call.request;
    db.run('DELETE FROM products WHERE id = ?', [product_id], function (err) {
      if (err) {
        callback(err);
      } else if (this.changes === 1) {
        callback(null, { success: true });
      } else {
        callback(new Error('Product not found'));
      }
    });
  },
};

const server = new grpc.Server();
server.addService(productProto.ProductService.service, productService);
const port = 50051;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error('Failed to bind server:', err);
    return;
  }

  console.log(`Server is running on port ${port}`);
  server.start();
});

console.log(`Product microservice running on port ${port}`);
