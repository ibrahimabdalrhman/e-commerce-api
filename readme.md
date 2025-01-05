# E-Commerce API

This is a backend API for an e-commerce application. It is built using Node.js and Express, and it includes various features and dependencies to support common e-commerce functionalities.

## Table of Contents

- [Installation](#installation)
- [API Endpoints](#api-endpoints)
- [Postman API Documentation](#postman-api-documentation)
- [Dependencies](#dependencies)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/ibrahimabdalrhman/e-commerce-api.git
    cd e-commerce-api
    ```

2. Install the dependencies:
    ```bash
    npm install
    ```

3. Set up your environment variables. Create a `.env` file in the root directory and add the necessary configurations (e.g., database connection, API keys).

## API Endpoints

Here are some of the main API endpoints available in this project:

### User Authentication:

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Authenticate a user and return a token

### Product Management:

- `GET /products` - Retrieve a list of all products
- `GET /products/:id` - Retrieve details of a specific product
- `POST /products` - Add a new product
- `PUT /products/:id` - Update an existing product
- `DELETE /products/:id` - Delete a product

### Order Management:

- `GET /orders` - Retrieve a list of all orders
- `GET /orders/:id` - Retrieve details of a specific order
- `POST /orders` - Create a new order
- `PUT /orders/:id` - Update an existing order
- `DELETE /orders/:id` - Delete an order

## Postman API Documentation

For detailed API documentation and test cases, you can refer to the Postman documentation provided [here](https://drive.google.com/file/d/1P9Fh9Jh0UQZhUB5-pauQ2HHKNM4Vi1j5/view?usp=sharing).

## Dependencies

This project uses the following main dependencies:

- `express` - Fast, unopinionated, minimalist web framework for Node.js
- `dotenv` - Loads environment variables from a .env file
- `jsonwebtoken` - JSON Web Token implementation
- `mysql2` - MySQL client for Node.js
- `prisma` - Next-generation ORM for Node.js and TypeScript
- `cors` - Middleware for enabling CORS
- `helmet` - Helps secure Express apps by setting various HTTP headers
- `twilio` - Twilio Node.js library for sending SMS and making voice calls

For a complete list of dependencies, refer to the `package.json` file.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any changes.

## License

This project is licensed under the ISC License. See the LICENSE file for more details.

Feel free to adjust the content as needed.