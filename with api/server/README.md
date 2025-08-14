# FormBuilder API

A comprehensive REST API for managing forms and form responses built with ASP.NET Core, Dapper, and SQL Server.

## Features

- **Complete Form Management**: Create, read, update, delete, and clone forms
- **Response Handling**: Submit form responses with validation
- **Response Curation**: Automatically merge form schemas with response data for easy frontend rendering
- **Pagination**: Efficient paginated responses with filtering and sorting
- **Data Validation**: Input validation and business rule enforcement
- **Performance Optimized**: Uses Dapper for fast data access and proper indexing

## API Endpoints

### Forms Management

| Method | Endpoint                | Description             |
| ------ | ----------------------- | ----------------------- |
| GET    | `/api/forms`            | Get list of all forms   |
| GET    | `/api/forms/{id}`       | Get specific form by ID |
| POST   | `/api/forms`            | Create a new form       |
| PUT    | `/api/forms/{id}`       | Update an existing form |
| DELETE | `/api/forms/{id}`       | Delete a form           |
| POST   | `/api/forms/{id}/clone` | Clone an existing form  |

### Form Responses

| Method | Endpoint                           | Description                        |
| ------ | ---------------------------------- | ---------------------------------- |
| POST   | `/api/formresponses/submit`        | Submit a form response             |
| GET    | `/api/formresponses/form/{formId}` | Get paginated responses for a form |
| GET    | `/api/formresponses/{id}`          | Get specific response by ID        |
| DELETE | `/api/formresponses/{id}`          | Delete a response                  |

## Setup Instructions

### Prerequisites

- .NET 8.0 or later
- SQL Server 2019 or later (or SQL Server Express)
- Visual Studio 2022 or VS Code

### Database Setup

1. **Create the database**:

   ```bash
   # Using SQL Server Management Studio or Azure Data Studio
   # Run the script: server/FormBuilder.Api/Database/create-tables.sql
   ```

2. **Update connection string** in `appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=your-server;Database=FormBuilderDB;Trusted_Connection=true;TrustServerCertificate=true;"
     }
   }
   ```

### Running the API

1. **Restore packages**:

   ```bash
   cd server/FormBuilder.Api
   dotnet restore
   ```

2. **Build the project**:

   ```bash
   dotnet build
   ```

3. **Run the API**:

   ```bash
   dotnet run
   ```

4. **Access Swagger UI**:
   - Open browser to `https://localhost:5001/swagger` (or the port shown in console)

## Request/Response Examples

### Create Form

**POST** `/api/forms`

```json
{
  "title": "Contact Form",
  "description": "A simple contact form",
  "schema": "{\"sections\":[{\"id\":\"section-1\",\"title\":\"Contact Info\",\"fields\":[{\"id\":\"name\",\"type\":\"text\",\"label\":\"Name\",\"required\":true},{\"id\":\"email\",\"type\":\"email\",\"label\":\"Email\",\"required\":true}]}]}",
  "createdBy": "admin@example.com"
}
```

### Submit Form Response

**POST** `/api/formresponses/submit`

```json
{
  "formId": "550e8400-e29b-41d4-a716-446655440000",
  "responseData": "{\"name\":\"John Doe\",\"email\":\"john@example.com\"}",
  "submittedBy": "john@example.com"
}
```

### Get Paginated Responses

**GET** `/api/formresponses/form/{formId}?pageNumber=1&pageSize=10&sortBy=SubmittedAt&sortDescending=true`

**Response**:

```json
{
  "responses": [
    {
      "id": "response-id",
      "formId": "form-id",
      "formTitle": "Contact Form",
      "submittedAt": "2024-01-15T10:30:00Z",
      "submittedBy": "john@example.com",
      "fields": [
        {
          "fieldId": "name",
          "label": "Name",
          "type": "text",
          "value": "John Doe",
          "displayValue": "John Doe"
        },
        {
          "fieldId": "email",
          "label": "Email",
          "type": "email",
          "value": "john@example.com",
          "displayValue": "john@example.com"
        }
      ]
    }
  ],
  "totalCount": 25,
  "pageNumber": 1,
  "pageSize": 10,
  "totalPages": 3,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

## Response Curation

The API automatically curates form responses by merging the form schema with response data, providing:

- **Field Definitions**: Label, type, and validation rules from the form schema
- **Response Values**: Actual values submitted by users
- **Display Values**: Formatted values for easy frontend rendering
- **Type-Safe Data**: Proper type conversion and validation

### Display Value Formatting

- **Dates**: Formatted as "MMM dd, yyyy"
- **Files**: Shows count of uploaded files
- **Checkboxes**: Arrays shown as comma-separated values
- **Select/Radio**: Shows selected option text
- **Numbers**: Properly formatted numeric values

## Database Schema

### Forms Table

- `Id` (UNIQUEIDENTIFIER): Primary key
- `Title` (NVARCHAR(200)): Form title
- `Description` (NVARCHAR(1000))`: Form description
- `Schema` (NVARCHAR(MAX))`: JSON schema definition
- `IsPublished` (BIT): Publication status
- `CreatedAt/UpdatedAt` (DATETIME2): Timestamps
- `CreatedBy` (NVARCHAR(100))`: Creator identifier
- `ResponseCount` (INT): Cached response count

### FormResponses Table

- `Id` (UNIQUEIDENTIFIER)`: Primary key
- `FormId` (UNIQUEIDENTIFIER)`: Foreign key to Forms
- `ResponseData` (NVARCHAR(MAX))`: JSON response data
- `SubmittedAt` (DATETIME2)`: Submission timestamp
- `SubmittedBy` (NVARCHAR(100))`: Submitter identifier
- `IpAddress` (NVARCHAR(45))`: Client IP address
- `UserAgent` (NVARCHAR(500))`: Browser user agent

## Performance Features

- **Database Indexes**: Optimized queries with proper indexing
- **Dapper ORM**: Lightweight, fast data access
- **Pagination**: Memory-efficient paginated responses
- **Caching**: Response count automatically maintained
- **Connection Pooling**: Efficient database connections

## Security Features

- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Parameterized queries via Dapper
- **CORS Support**: Configurable cross-origin requests
- **Schema Validation**: JSON schema validation for forms
- **IP Tracking**: Request origin tracking for responses

## Error Handling

The API provides consistent error responses:

```json
{
  "message": "Human-readable error message",
  "error": "Technical error details (in development)"
}
```

Common HTTP status codes:

- `200 OK`: Successful requests
- `201 Created`: Successful resource creation
- `400 Bad Request`: Invalid input data
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server errors

## Integration with Frontend

This API is designed to work seamlessly with the React FormBuilder frontend:

1. **Dynamic Schema**: Supports the same JSON schema format used by the frontend
2. **Response Curation**: Provides pre-formatted data for easy rendering
3. **Type Safety**: Maintains type information across the API boundary
4. **Real-time Updates**: Response counts automatically updated

## Development

### Adding New Fields

To support new field types:

1. Update the `FormatDisplayValue` method in `FormResponseService.cs`
2. Add validation logic if needed
3. Update the database schema if additional properties are required

### Custom Validation

Add custom validation rules in the service layer:

```csharp
public async Task<bool> ValidateFormSchemaAsync(string schema)
{
    // Add your custom validation logic here
    return true;
}
```

### Performance Monitoring

Monitor key metrics:

- Database query performance
- Response curation time for large forms
- Memory usage during pagination
- Connection pool utilization
