using FormBuilder.Api.Models;

namespace FormBuilder.Api.Repositories;

public interface IFormResponseRepository
{
    Task<Guid> CreateResponseAsync(SubmitFormRequest request, string ipAddress, string userAgent);
    Task<PaginatedFormResponses> GetFormResponsesAsync(Guid formId, FormResponseQuery query);
    Task<FormResponse?> GetResponseByIdAsync(Guid id);
    Task<bool> DeleteResponseAsync(Guid id);
    Task<IEnumerable<FormResponse>> GetResponsesByFormIdAsync(Guid formId);
}
