using Dapper;
using FormBuilder.Api.Models;
using System.Data;

namespace FormBuilder.Api.Repositories;

public class FormRepository : IFormRepository
{
    private readonly IDbConnection _connection;

    public FormRepository(IDbConnection connection)
    {
        _connection = connection;
    }

    public async Task<IEnumerable<FormListItem>> GetAllFormsAsync()
    {
        const string sql = @"
            SELECT 
                Id, Title, Description, IsPublished, CreatedAt, UpdatedAt, CreatedBy,
                (SELECT COUNT(*) FROM FormResponses WHERE FormId = f.Id) as ResponseCount
            FROM Forms f
            ORDER BY UpdatedAt DESC";

        return await _connection.QueryAsync<FormListItem>(sql);
    }

    public async Task<Form?> GetFormByIdAsync(Guid id)
    {
        const string sql = @"
            SELECT 
                Id, Title, Description, Schema, IsPublished, CreatedAt, UpdatedAt, CreatedBy,
                (SELECT COUNT(*) FROM FormResponses WHERE FormId = @Id) as ResponseCount
            FROM Forms 
            WHERE Id = @Id";

        return await _connection.QueryFirstOrDefaultAsync<Form>(sql, new { Id = id });
    }

    public async Task<Guid> CreateFormAsync(CreateFormRequest request)
    {
        var id = Guid.NewGuid();
        var now = DateTime.UtcNow;

        const string sql = @"
            INSERT INTO Forms (Id, Title, Description, Schema, IsPublished, CreatedAt, UpdatedAt, CreatedBy)
            VALUES (@Id, @Title, @Description, @Schema, 0, @CreatedAt, @UpdatedAt, @CreatedBy)";

        await _connection.ExecuteAsync(sql, new
        {
            Id = id,
            request.Title,
            request.Description,
            request.Schema,
            CreatedAt = now,
            UpdatedAt = now,
            request.CreatedBy
        });

        return id;
    }

    public async Task<bool> UpdateFormAsync(Guid id, UpdateFormRequest request)
    {
        const string sql = @"
            UPDATE Forms 
            SET Title = @Title, Description = @Description, Schema = @Schema, 
                IsPublished = @IsPublished, UpdatedAt = @UpdatedAt
            WHERE Id = @Id";

        var rowsAffected = await _connection.ExecuteAsync(sql, new
        {
            Id = id,
            request.Title,
            request.Description,
            request.Schema,
            request.IsPublished,
            UpdatedAt = DateTime.UtcNow
        });

        return rowsAffected > 0;
    }

    public async Task<bool> DeleteFormAsync(Guid id)
    {
        // Delete responses first (foreign key constraint)
        const string deleteResponsesSql = "DELETE FROM FormResponses WHERE FormId = @Id";
        await _connection.ExecuteAsync(deleteResponsesSql, new { Id = id });

        // Delete form
        const string deleteFormSql = "DELETE FROM Forms WHERE Id = @Id";
        var rowsAffected = await _connection.ExecuteAsync(deleteFormSql, new { Id = id });

        return rowsAffected > 0;
    }

    public async Task<Guid> CloneFormAsync(Guid id, CloneFormRequest request)
    {
        // Get original form
        var originalForm = await GetFormByIdAsync(id);
        if (originalForm == null)
            throw new InvalidOperationException("Form not found");

        // Create new form with cloned schema
        var newId = Guid.NewGuid();
        var now = DateTime.UtcNow;

        const string sql = @"
            INSERT INTO Forms (Id, Title, Description, Schema, IsPublished, CreatedAt, UpdatedAt, CreatedBy)
            VALUES (@Id, @Title, @Description, @Schema, 0, @CreatedAt, @UpdatedAt, @CreatedBy)";

        await _connection.ExecuteAsync(sql, new
        {
            Id = newId,
            request.Title,
            request.Description,
            Schema = originalForm.Schema,
            CreatedAt = now,
            UpdatedAt = now,
            request.CreatedBy
        });

        return newId;
    }

    public async Task<bool> FormExistsAsync(Guid id)
    {
        const string sql = "SELECT COUNT(*) FROM Forms WHERE Id = @Id";
        var count = await _connection.QuerySingleAsync<int>(sql, new { Id = id });
        return count > 0;
    }

    public async Task UpdateResponseCountAsync(Guid formId)
    {
        const string sql = @"
            UPDATE Forms 
            SET ResponseCount = (SELECT COUNT(*) FROM FormResponses WHERE FormId = @FormId)
            WHERE Id = @FormId";

        await _connection.ExecuteAsync(sql, new { FormId = formId });
    }
}
