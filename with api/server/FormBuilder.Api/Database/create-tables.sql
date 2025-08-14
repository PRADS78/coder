-- Create FormBuilder database
-- Run this script in SQL Server Management Studio or Azure Data Studio

-- Create database (if it doesn't exist)
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'FormBuilderDB')
BEGIN
    CREATE DATABASE FormBuilderDB;
END
GO

USE FormBuilderDB;
GO

-- Create Forms table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Forms' AND xtype='U')
BEGIN
    CREATE TABLE Forms (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        Title NVARCHAR(200) NOT NULL,
        Description NVARCHAR(1000) NULL,
        Schema NVARCHAR(MAX) NOT NULL, -- JSON schema of the form
        IsPublished BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CreatedBy NVARCHAR(100) NULL,
        ResponseCount INT NOT NULL DEFAULT 0
    );

    -- Create indexes for better performance
    CREATE INDEX IX_Forms_CreatedAt ON Forms(CreatedAt);
    CREATE INDEX IX_Forms_UpdatedAt ON Forms(UpdatedAt);
    CREATE INDEX IX_Forms_IsPublished ON Forms(IsPublished);
    CREATE INDEX IX_Forms_CreatedBy ON Forms(CreatedBy);
END
GO

-- Create FormResponses table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='FormResponses' AND xtype='U')
BEGIN
    CREATE TABLE FormResponses (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        FormId UNIQUEIDENTIFIER NOT NULL,
        ResponseData NVARCHAR(MAX) NOT NULL, -- JSON data of the response
        SubmittedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        SubmittedBy NVARCHAR(100) NULL,
        IpAddress NVARCHAR(45) NULL, -- IPv4 or IPv6
        UserAgent NVARCHAR(500) NULL,
        
        -- Foreign key constraint
        CONSTRAINT FK_FormResponses_Forms FOREIGN KEY (FormId) REFERENCES Forms(Id) ON DELETE CASCADE
    );

    -- Create indexes for better performance
    CREATE INDEX IX_FormResponses_FormId ON FormResponses(FormId);
    CREATE INDEX IX_FormResponses_SubmittedAt ON FormResponses(SubmittedAt);
    CREATE INDEX IX_FormResponses_SubmittedBy ON FormResponses(SubmittedBy);
END
GO

-- Create a trigger to automatically update ResponseCount in Forms table
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_UpdateFormResponseCount')
BEGIN
    EXEC('
    CREATE TRIGGER TR_UpdateFormResponseCount
    ON FormResponses
    AFTER INSERT, DELETE
    AS
    BEGIN
        SET NOCOUNT ON;
        
        -- Update response count for affected forms
        UPDATE Forms 
        SET ResponseCount = (
            SELECT COUNT(*) 
            FROM FormResponses 
            WHERE FormId = Forms.Id
        )
        WHERE Id IN (
            SELECT DISTINCT FormId FROM inserted
            UNION
            SELECT DISTINCT FormId FROM deleted
        );
    END
    ');
END
GO

-- Insert sample data for testing (optional)
IF NOT EXISTS (SELECT * FROM Forms)
BEGIN
    DECLARE @SampleFormId UNIQUEIDENTIFIER = NEWID();
    DECLARE @SampleSchema NVARCHAR(MAX) = N'{
        "sections": [
            {
                "id": "section-1",
                "title": "Personal Information",
                "description": "Please provide your personal details",
                "fields": [
                    {
                        "id": "firstName",
                        "type": "text",
                        "label": "First Name",
                        "placeholder": "Enter your first name",
                        "required": true
                    },
                    {
                        "id": "lastName",
                        "type": "text",
                        "label": "Last Name",
                        "placeholder": "Enter your last name",
                        "required": true
                    },
                    {
                        "id": "email",
                        "type": "email",
                        "label": "Email Address",
                        "placeholder": "Enter your email",
                        "required": true
                    },
                    {
                        "id": "phone",
                        "type": "phone",
                        "label": "Phone Number",
                        "placeholder": "Enter your phone number",
                        "required": false
                    }
                ]
            },
            {
                "id": "section-2",
                "title": "Preferences",
                "description": "Tell us about your preferences",
                "fields": [
                    {
                        "id": "newsletter",
                        "type": "checkbox",
                        "label": "Subscribe to newsletter",
                        "required": false
                    },
                    {
                        "id": "preferredContact",
                        "type": "select",
                        "label": "Preferred Contact Method",
                        "options": ["Email", "Phone", "SMS"],
                        "required": true
                    }
                ]
            }
        ]
    }';

    INSERT INTO Forms (Id, Title, Description, Schema, IsPublished, CreatedBy)
    VALUES (
        @SampleFormId,
        'Sample Contact Form',
        'A sample contact form for testing the API',
        @SampleSchema,
        1,
        'System'
    );

    -- Insert sample response
    INSERT INTO FormResponses (FormId, ResponseData, SubmittedBy, IpAddress)
    VALUES (
        @SampleFormId,
        N'{"firstName": "John", "lastName": "Doe", "email": "john.doe@example.com", "phone": "+1234567890", "newsletter": true, "preferredContact": "Email"}',
        'john.doe@example.com',
        '192.168.1.1'
    );
END
GO

PRINT 'Database schema created successfully!';
PRINT 'Tables created: Forms, FormResponses';
PRINT 'Indexes and triggers created for optimal performance';
PRINT 'Sample data inserted for testing';
