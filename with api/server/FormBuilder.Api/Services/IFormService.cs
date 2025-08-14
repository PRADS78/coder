using FormBuilder.Api.Models;

namespace FormBuilder.Api.Services;

public interface IFormService
{
    Task<IEnumerable<FormListItem>> GetAllFormsAsync();
    Task<Form?> GetFormByIdAsync(Guid id);
    Task<Guid> CreateFormAsync(CreateFormRequest request);
    Task<bool> UpdateFormAsync(Guid id, UpdateFormRequest request);
    Task<bool> DeleteFormAsync(Guid id);
    Task<Guid> CloneFormAsync(Guid id, CloneFormRequest request);
    Task<bool> ValidateFormSchemaAsync(string schema);
}
