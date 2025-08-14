using Dapper;
using FormBuilder.Api.Models;
using System.Data;

namespace FormBuilder.Api.Repositories;

public class FormResponseRepository : IFormResponseRepository
{
    private readonly IDbConnection _connection;

    public FormResponseRepository(IDbConnection connection)
    {
        _connection = connection;
    }

    public async Task<Guid> CreateResponseAsync(SubmitFormRequest request, string ipAddress, string userAgent)
    {
        var id = Guid.NewGuid();
        var now = DateTime.UtcNow;

        const string sql = @"
            INSERT INTO FormResponses (Id, FormId, ResponseData, SubmittedAt, SubmittedBy, IpAddress, UserAgent)
            VALUES (@Id, @FormId, @ResponseData, @SubmittedAt, @SubmittedBy, @IpAddress, @UserAgent)";

        await _connection.ExecuteAsync(sql, new
        {
            Id = id,
            request.FormId,
            request.ResponseData,
            SubmittedAt = now,
            request.SubmittedBy,
            IpAddress = ipAddress,
            UserAgent = userAgent
        });

        return id;
    }

    public async Task<PaginatedFormResponses> GetFormResponsesAsync(Guid formId, FormResponseQuery query)
    {
        // Build WHERE clause
        var whereConditions = new List<string> { "fr.FormId = @FormId" };
        var parameters = new DynamicParameters();
        parameters.Add("FormId", formId);

        if (query.FromDate.HasValue)
        {
            whereConditions.Add("fr.SubmittedAt >= @FromDate");
            parameters.Add("FromDate", query.FromDate.Value);
        }

        if (query.ToDate.HasValue)
        {
            whereConditions.Add("fr.SubmittedAt <= @ToDate");
            parameters.Add("ToDate", query.ToDate.Value);
        }

        if (!string.IsNullOrEmpty(query.SubmittedBy))
        {
            whereConditions.Add("fr.SubmittedBy LIKE @SubmittedBy");
            parameters.Add("SubmittedBy", $"%{query.SubmittedBy}%");
        }

        var whereClause = string.Join(" AND ", whereConditions);

        // Build ORDER BY clause
        var validSortColumns = new[] { "SubmittedAt", "SubmittedBy" };
        var sortColumn = validSortColumns.Contains(query.SortBy) ? query.SortBy : "SubmittedAt";
        var sortDirection = query.SortDescending ? "DESC" : "ASC";

        // Get total count
        var countSql = $@"
            SELECT COUNT(*) 
            FROM FormResponses fr 
            INNER JOIN Forms f ON fr.FormId = f.Id 
            WHERE {whereClause}";

        var totalCount = await _connection.QuerySingleAsync<int>(countSql, parameters);

        // Get paginated responses
        var offset = (query.PageNumber - 1) * query.PageSize;
        parameters.Add("Offset", offset);
        parameters.Add("PageSize", query.PageSize);

        var dataSql = $@"
            SELECT 
                fr.Id, fr.FormId, fr.ResponseData, fr.SubmittedAt, fr.SubmittedBy,
                f.Title as FormTitle, f.Schema
            FROM FormResponses fr 
            INNER JOIN Forms f ON fr.FormId = f.Id 
            WHERE {whereClause}
            ORDER BY fr.{sortColumn} {sortDirection}
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

        var responses = await _connection.QueryAsync(dataSql, parameters);

        var totalPages = (int)Math.Ceiling((double)totalCount / query.PageSize);

        return new PaginatedFormResponses
        {
            Responses = responses.Select(r => new FormResponseWithTemplate
            {
                Id = r.Id,
                FormId = r.FormId,
                FormTitle = r.FormTitle,
                SubmittedAt = r.SubmittedAt,
                SubmittedBy = r.SubmittedBy,
                Fields = new List<ResponseField>() // Will be populated by service layer
            }).ToList(),
            TotalCount = totalCount,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            TotalPages = totalPages,
            HasNextPage = query.PageNumber < totalPages,
            HasPreviousPage = query.PageNumber > 1
        };
    }

    public async Task<FormResponse?> GetResponseByIdAsync(Guid id)
    {
        const string sql = @"
            SELECT Id, FormId, ResponseData, SubmittedAt, SubmittedBy, IpAddress, UserAgent
            FROM FormResponses 
            WHERE Id = @Id";

        return await _connection.QueryFirstOrDefaultAsync<FormResponse>(sql, new { Id = id });
    }

    public async Task<bool> DeleteResponseAsync(Guid id)
    {
        const string sql = "DELETE FROM FormResponses WHERE Id = @Id";
        var rowsAffected = await _connection.ExecuteAsync(sql, new { Id = id });
        return rowsAffected > 0;
    }

    public async Task<IEnumerable<FormResponse>> GetResponsesByFormIdAsync(Guid formId)
    {
        const string sql = @"
            SELECT Id, FormId, ResponseData, SubmittedAt, SubmittedBy, IpAddress, UserAgent
            FROM FormResponses 
            WHERE FormId = @FormId
            ORDER BY SubmittedAt DESC";

        return await _connection.QueryAsync<FormResponse>(sql, new { FormId = formId });
    }
}
