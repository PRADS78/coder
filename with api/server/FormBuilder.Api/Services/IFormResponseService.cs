using FormBuilder.Api.Models;

namespace FormBuilder.Api.Services;

public interface IFormResponseService
{
    Task<Guid> SubmitFormResponseAsync(SubmitFormRequest request, string ipAddress, string userAgent);
    Task<PaginatedFormResponses> GetFormResponsesAsync(Guid formId, FormResponseQuery query);
    Task<FormResponseWithTemplate?> GetResponseByIdAsync(Guid id);
    Task<bool> DeleteResponseAsync(Guid id);
}
