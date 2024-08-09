# Visis Backend Assessment

This repository contains the backend API for handling book information requests and summary generation, built with NestJS, MongoDB, and BullMQ for job queuing. The project also integrates NLP libraries for generating text summaries of books.

## Table of Contents

- [Installation](#installation)
- [Features](#features)
  - [API Development](#api-development)
  - [AI Model for Summaries](#ai-model-for-summaries)
- [API Documentation](#api-documentation)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)
- [License](#license)

## Installation

To set up the backend locally, follow these steps:

1. **Clone the repository**:
    ```sh
    git clone https://github.com/ChuloWay/visis-backend-assessment-victorokoye.git
    cd visis-backend-assessment-victorokoye
    ```

2. **Install dependencies**:
    ```sh
    npm install
    ```

3. **Create an environment file**:
    - Duplicate the `.env.example` file in the project root.
    - Rename the duplicated file to `.env`.
    - Open the `.env` file and set your variables as shown in the example file.

    ```bash
    cp .env.example .env
    ```

    Ensure to fill in the necessary values in the `.env` file for a smooth configuration.


 4. **Seed the Database**:
    If you want to populate the database with initial data, run the following command:

    ```sh
    npm run seed
    ```

    This will execute the seeding script and add predefined data to your MongoDB database.


5. **Run the development server**:
    ```sh
    npm run start:dev
    ```

    The backend server will be running at `http://localhost:3000`.

## Features

### Part 1: API Development

#### Book Information Endpoints

- **Fetch Book Details**: Provides endpoints to retrieve book information such as title and publisher.
- **Summary Retrieval**: Endpoints to fetch pre-generated summaries of books stored in the database.

#### Input Validation and Error Handling

- Implements input validation using TypeScript and validation pipes in NestJS.
- Handles errors gracefully with appropriate HTTP status codes and error messages.


### Part 2: AI Model for Summaries

#### Text Summary Generation

- **AI Model Integration**: Integrates NLP models to generate text summaries of books.
- **Handling Varying Input Lengths**: The model can process input texts of varying lengths and generate concise summaries.

#### NLP Libraries

- **TfIdf**: Used for extracting important terms from the text.
- **TensorFlow.js**: Utilized for loading and running machine learning models.
- **Universal Sentence Encoder**: Employed for encoding sentences into high-dimensional vectors.
- **Synonyms**: Leverages synonyms to enhance the quality of generated summaries.

#### Queueing with BullMQ

- **Job Queueing**: Uses BullMQ (Redis) to queue and process summary generation tasks asynchronously.
- **Scalability**: The queueing system ensures that large volumes of summary requests are handled efficiently.

## API Documentation

The API documentation is provided through a Postman collection. You can view and interact with the API endpoints using the following link:

[Postman Collection](https://documenter.getpostman.com/view/33585837/2sA3s3GWic)

## Technologies Used

- **NestJS**: A progressive Node.js framework for building efficient and scalable server-side applications.
- **MongoDB**: A NoSQL database used for storing book information and summaries.
- **Mongoose**: An ODM library for MongoDB, enabling schema-based data modeling.
- **BullMQ**: A Node.js library for managing Redis-based job queues.
- **Redis**: An in-memory data structure store used for job queue management.
- **TensorFlow.js**: A library for training and deploying machine learning models in JavaScript.
- **Natural**: A general natural language processing library for JavaScript.
- **Universal Sentence Encoder**: A TensorFlow model that encodes sentences into vectors.
- **Synonyms**: A library for finding synonyms to enhance text processing.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.
