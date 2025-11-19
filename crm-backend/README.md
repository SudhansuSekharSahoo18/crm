# CRM Backend

This is the backend for the CRM application, which implements a role-based workflow system for bill processing. The backend is built using TypeScript and Express, and it integrates with a database using Prisma for data management.

## Features

- User authentication and authorization
- Role-based access control
- Bill management (create, retrieve, update, delete)
- Firm management
- Audit trail for tracking changes
- File uploads for bills and transport documents
- Email notifications for various events

## Project Structure

- **src/**: Contains the source code for the application.
  - **controllers/**: Contains the logic for handling requests.
  - **middleware/**: Contains middleware functions for authentication and validation.
  - **models/**: Defines the database models.
  - **routes/**: Defines the API routes.
  - **services/**: Contains business logic and external service integrations.
  - **utils/**: Contains utility functions for database connection, logging, and validation.
  - **config/**: Contains configuration files for the application.
  - **app.ts**: The entry point of the application.

- **uploads/**: Directory for storing uploaded files.
  - **bills/**: Stores uploaded bill documents.
  - **transport-bills/**: Stores uploaded transport bill documents.

- **prisma/**: Contains the Prisma schema and migration files for database management.

- **package.json**: Lists the project dependencies and scripts.

- **tsconfig.json**: TypeScript configuration file.

- **.env**: Environment variables for the application.

- **.env.example**: Example of the required environment variables.

## Getting Started

1. Clone the repository:
   ```
   git clone <repository-url>
   cd crm-backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up the environment variables:
   - Copy `.env.example` to `.env` and fill in the required values.

4. Run the application:
   ```
   npm run dev
   ```

5. Access the API at `http://localhost:3000`.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.