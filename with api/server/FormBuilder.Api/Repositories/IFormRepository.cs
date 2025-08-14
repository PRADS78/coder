using FormBuilder.Api.Models;

namespace FormBuilder.Api.Repositories;

public interface IFormRepository
{
    Task<IEnumerable<FormListItem>> GetAllFormsAsync();
    Task<Form?> GetFormByIdAsync(Guid id);
    Task<Guid> CreateFormAsync(CreateFormRequest request);
    Task<bool> UpdateFormAsync(Guid id, UpdateFormRequest request);
    Task<bool> DeleteFormAsync(Guid id);
    Task<Guid> CloneFormAsync(Guid id, CloneFormRequest request);
    Task<bool> FormExistsAsync(Guid id);
    Task UpdateResponseCountAsync(Guid formId);
}
