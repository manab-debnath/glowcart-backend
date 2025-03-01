# E-Commerce Server

## Overview

This project is an E-Commerce server application that provides APIs for managing products, orders, users, and other e-commerce functionalities.

## Features

-   User authentication and authorization
-   Product management (CRUD operations)
-   Order management
-   Payment processing
-   Admin dashboard

## Technologies Used

-   Node.js
-   Express.js
-   MongoDB
-   JWT for authentication
-   Stripe for payment processing
-   Razorpay for payment processing

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/glowcart-backend.git
    ```
2. Navigate to the project directory:
    ```bash
    cd glowcart-backend
    ```
3. Install the dependencies:
    ```bash
    npm install
    ```

## Configuration

1. Create a `.env` file in the root directory and add the following environment variables:
    ```plaintext
    PORT=3000
    MONGODB_URI=your_mongodb_uri
    JWT_SECRET=your_jwt_secret
    STRIPE_SECRET_KEY=your_stripe_secret_key
    RAZORPAY_KEY_ID=your_razorpay_key_id
    RAZORPAY_KEY_SECRET=your_razorpay_key_secret
    ```

## Running the Server

1. Start the server:
    ```bash
    npm start
    ```
2. The server will be running at `http://localhost:3000`.

## Deployment

The project is deployed on Digital Ocean and can be accessed at [glowcart.projectnest.live](http://glowcart.projectnest.live).

## API Documentation

The API documentation is available at `http://localhost:3000/api-docs` when the server is running.

## Contributing

1. Fork the repository.
2. Create a new branch:
    ```bash
    git checkout -b feature-branch
    ```
3. Make your changes and commit them:
    ```bash
    git commit -m "Description of your changes"
    ```
4. Push to the branch:
    ```bash
    git push origin feature-branch
    ```
5. Create a pull request.

## License

This project is licensed under the MIT License.
