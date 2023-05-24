const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const bodyParser = require('body-parser');
const cors = require('cors');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const productProtoPath = 'product.proto';
const orderProtoPath = 'order.proto';

const resolvers = require('./resolvers');
const typeDefs = require('./schema');

const app = express();
app.use(bodyParser.json());

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
const clientProducts = new productProto.ProductService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);
const clientOrders = new orderProto.OrderService(
  'localhost:50052',
  grpc.credentials.createInsecure()
);

const server = new ApolloServer({ typeDefs, resolvers });

server.start().then(() => {
  app.use(cors(), bodyParser.json(), expressMiddleware(server));
});

app.get('/products', (req, res) => {
  clientProducts.searchProducts({}, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(response.products);
    }
  });
});

app.post('/products', (req, res) => {
  const { id, title, description } = req.body;
  clientProducts.createProduct(
    { product_id: id, title: title, description: description },
    (err, response) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.json(response.product);
      }
    }
  );
});

app.get('/products/:id', (req, res) => {
  const id = req.params.id;
  clientProducts.getProduct({ productId: id }, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(response.product);
    }
  });
});

app.put('/products/:id', (req, res) => {
  const id = req.params.id;
  const { title, description } = req.body;
  clientProducts.updateProduct(
    { product_id: id, title: title, description: description },
    (err, response) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.json(response.product);
      }
    }
  );
});

app.delete('/products/:id', (req, res) => {
  const id = req.params.id;
  clientProducts.deleteProduct({ product_id: id }, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(response);
    }
  });
});

app.get('/orders', (req, res) => {
  clientOrders.searchOrders({}, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(response.orders);
    }
  });
});

app.post('/orders', (req, res) => {
  const { id, title, description } = req.body;
  clientOrders.createOrder(
    { order_id: id, title: title, description: description },
    (err, response) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.json(response.order);
      }
    }
  );
});

app.get('/orders/:id', (req, res) => {
  const id = req.params.id;
  clientOrders.getOrder({ order_id: id }, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(response.order);
    }
  });
});

app.put('/orders/:id', (req, res) => {
  const id = req.params.id;
  const { title, description } = req.body;
  clientOrders.updateOrder(
    { order_id: id, title: title, description: description },
    (err, response) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.json(response.order);
      }
    }
  );
});

app.delete('/orders/:id', (req, res) => {
  const id = req.params.id;
  clientOrders.deleteOrder({ order_id: id }, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(response);
    }
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`API Gateway running on port ${port}`);
});
