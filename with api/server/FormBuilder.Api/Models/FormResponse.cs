using System.ComponentModel.DataAnnotations;

namespace FormBuilder.Api.Models;

public class FormResponse
{
    public Guid Id { get; set; }
    public Guid FormId { get; set; }
    public string ResponseData { get; set; } = string.Empty; // JSON data of the response
    public DateTime SubmittedAt { get; set; }
    public string SubmittedBy { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
}

public class SubmitFormRequest
{
    [Required]
    public Guid FormId { get; set; }
    
    [Required]
    public string ResponseData { get; set; } = string.Empty;
    
    public string SubmittedBy { get; set; } = string.Empty;
}

public class FormResponseWithTemplate
{
    public Guid Id { get; set; }
    public Guid FormId { get; set; }
    public string FormTitle { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
    public string SubmittedBy { get; set; } = string.Empty;
    public List<ResponseField> Fields { get; set; } = new();
}

public class ResponseField
{
    public string FieldId { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public object? Value { get; set; }
    public string DisplayValue { get; set; } = string.Empty;
}

public class PaginatedFormResponses
{
    public List<FormResponseWithTemplate> Responses { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}

public class FormResponseQuery
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string? SubmittedBy { get; set; }
    public string? SortBy { get; set; } = "SubmittedAt";
    public bool SortDescending { get; set; } = true;
}
