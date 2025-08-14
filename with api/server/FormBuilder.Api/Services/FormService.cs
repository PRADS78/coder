using FormBuilder.Api.Models;
using FormBuilder.Api.Repositories;
using System.Text.Json;

namespace FormBuilder.Api.Services;

public class FormService : IFormService
{
    private readonly IFormRepository _formRepository;

    public FormService(IFormRepository formRepository)
    {
        _formRepository = formRepository;
    }

    public async Task<IEnumerable<FormListItem>> GetAllFormsAsync()
    {
        return await _formRepository.GetAllFormsAsync();
    }

    public async Task<Form?> GetFormByIdAsync(Guid id)
    {
        return await _formRepository.GetFormByIdAsync(id);
    }

    public async Task<Guid> CreateFormAsync(CreateFormRequest request)
    {
        // Validate schema
        if (!await ValidateFormSchemaAsync(request.Schema))
        {
            throw new ArgumentException("Invalid form schema format");
        }

        return await _formRepository.CreateFormAsync(request);
    }

    public async Task<bool> UpdateFormAsync(Guid id, UpdateFormRequest request)
    {
        // Check if form exists
        var existingForm = await _formRepository.GetFormByIdAsync(id);
        if (existingForm == null)
        {
            return false;
        }

        // Validate schema
        if (!await ValidateFormSchemaAsync(request.Schema))
        {
            throw new ArgumentException("Invalid form schema format");
        }

        return await _formRepository.UpdateFormAsync(id, request);
    }

    public async Task<bool> DeleteFormAsync(Guid id)
    {
        // Check if form exists
        var existingForm = await _formRepository.GetFormByIdAsync(id);
        if (existingForm == null)
        {
            return false;
        }

        return await _formRepository.DeleteFormAsync(id);
    }

    public async Task<Guid> CloneFormAsync(Guid id, CloneFormRequest request)
    {
        // Check if original form exists
        var existingForm = await _formRepository.GetFormByIdAsync(id);
        if (existingForm == null)
        {
            throw new ArgumentException("Original form not found");
        }

        return await _formRepository.CloneFormAsync(id, request);
    }

    public async Task<bool> ValidateFormSchemaAsync(string schema)
    {
        try
        {
            // Basic JSON validation
            var jsonDocument = JsonDocument.Parse(schema);
            
            // Additional schema validation can be added here
            // For example, checking required properties, field types, etc.
            
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
        catch
        {
            return false;
        }
    }
}
