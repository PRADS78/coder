using System.ComponentModel.DataAnnotations;

namespace FormBuilder.Api.Models;

public class Form
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Schema { get; set; } = string.Empty; // JSON schema of the form
    public bool IsPublished { get; set; } = false;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public int ResponseCount { get; set; } = 0;
}

public class CreateFormRequest
{
    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [StringLength(1000)]
    public string Description { get; set; } = string.Empty;
    
    [Required]
    public string Schema { get; set; } = string.Empty;
    
    public string CreatedBy { get; set; } = string.Empty;
}

public class UpdateFormRequest
{
    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [StringLength(1000)]
    public string Description { get; set; } = string.Empty;
    
    [Required]
    public string Schema { get; set; } = string.Empty;
    
    public bool IsPublished { get; set; }
}

public class CloneFormRequest
{
    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [StringLength(1000)]
    public string Description { get; set; } = string.Empty;
    
    public string CreatedBy { get; set; } = string.Empty;
}

public class FormListItem
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsPublished { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public int ResponseCount { get; set; }
}
