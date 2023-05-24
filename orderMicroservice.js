const sqlite3 = require('sqlite3').verbose();

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');


const orderProtoPath = 'order.proto';
const orderProtoDefinition = protoLoader.loadSync(orderProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const orderProto = grpc.loadPackageDefinition(orderProtoDefinition).order;
const db = new sqlite3.Database('./database.db'); 

db.run(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    title TEXT,
    description TEXT
  )
`);
const orderService = {
  getOrder: (call, callback) => {
    const { order_id } = call.request;
    
    db.get('SELECT * FROM orders WHERE id = ?', [order_id], (err, row) => {
      if (err) {
        callback(err);
      } else if (row) {
        const order = {
          id: row.id,
          title: row.title,
          description: row.description,
        };
        callback(null, { order });
      } else {
        callback(new Error('Order not found'));
      }
    });
  },
  searchOrders: (call, callback) => {
    db.all('SELECT * FROM orders', (err, rows) => {
      if (err) {
        callback(err);
      } else {
        const orders = rows.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description,
        }));
        callback(null, { orders });
      }
    });
  },
  CreateOrder: (call, callback) => {
    const { order_id, title, description } = call.request;
    db.run(
      'INSERT INTO orders (id, title, description) VALUES (?, ?, ?)',
      [order_id, title, description],
      function (err) {
        if (err) {
          callback(err);
        } else {
          const order = {
            id: order_id,
            title,
            description,
          };
          callback(null, { order });
        }
      }
    );
  },
};



const server = new grpc.Server();
server.addService(orderProto.OrderService.service, orderService);
const port = 50052;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error('Failed to bind server:', err);
      return;
    }
  
    console.log(`Server is running on port ${port}`);
    server.start();
  });
console.log(`Order microservice running on port ${port}`);
