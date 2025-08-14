using FormBuilder.Api.Models;
using FormBuilder.Api.Repositories;
using System.Text.Json;

namespace FormBuilder.Api.Services;

public class FormResponseService : IFormResponseService
{
    private readonly IFormResponseRepository _responseRepository;
    private readonly IFormRepository _formRepository;

    public FormResponseService(IFormResponseRepository responseRepository, IFormRepository formRepository)
    {
        _responseRepository = responseRepository;
        _formRepository = formRepository;
    }

    public async Task<Guid> SubmitFormResponseAsync(SubmitFormRequest request, string ipAddress, string userAgent)
    {
        // Validate form exists and is published
        var form = await _formRepository.GetFormByIdAsync(request.FormId);
        if (form == null)
        {
            throw new ArgumentException("Form not found");
        }

        if (!form.IsPublished)
        {
            throw new ArgumentException("Form is not published");
        }

        // Validate response data format
        if (!IsValidJsonData(request.ResponseData))
        {
            throw new ArgumentException("Invalid response data format");
        }

        // Create response
        var responseId = await _responseRepository.CreateResponseAsync(request, ipAddress, userAgent);

        // Update form response count
        await _formRepository.UpdateResponseCountAsync(request.FormId);

        return responseId;
    }

    public async Task<PaginatedFormResponses> GetFormResponsesAsync(Guid formId, FormResponseQuery query)
    {
        // Get form to ensure it exists
        var form = await _formRepository.GetFormByIdAsync(formId);
        if (form == null)
        {
            throw new ArgumentException("Form not found");
        }

        // Get paginated responses
        var paginatedResponses = await _responseRepository.GetFormResponsesAsync(formId, query);

        // Curate responses with form schema for easy rendering
        await CurateResponsesWithTemplate(paginatedResponses.Responses, form.Schema);

        return paginatedResponses;
    }

    public async Task<FormResponseWithTemplate?> GetResponseByIdAsync(Guid id)
    {
        var response = await _responseRepository.GetResponseByIdAsync(id);
        if (response == null)
        {
            return null;
        }

        var form = await _formRepository.GetFormByIdAsync(response.FormId);
        if (form == null)
        {
            return null;
        }

        var curatedResponse = new FormResponseWithTemplate
        {
            Id = response.Id,
            FormId = response.FormId,
            FormTitle = form.Title,
            SubmittedAt = response.SubmittedAt,
            SubmittedBy = response.SubmittedBy,
            Fields = new List<ResponseField>()
        };

        await CurateResponsesWithTemplate(new List<FormResponseWithTemplate> { curatedResponse }, form.Schema);

        return curatedResponse;
    }

    public async Task<bool> DeleteResponseAsync(Guid id)
    {
        var response = await _responseRepository.GetResponseByIdAsync(id);
        if (response == null)
        {
            return false;
        }

        var deleted = await _responseRepository.DeleteResponseAsync(id);
        
        if (deleted)
        {
            // Update form response count
            await _formRepository.UpdateResponseCountAsync(response.FormId);
        }

        return deleted;
    }

    private async Task CurateResponsesWithTemplate(List<FormResponseWithTemplate> responses, string formSchema)
    {
        try
        {
            // Parse form schema to get field definitions
            var schemaDocument = JsonDocument.Parse(formSchema);
            var fields = new Dictionary<string, JsonElement>();

            // Extract field definitions from schema
            if (schemaDocument.RootElement.TryGetProperty("sections", out var sections))
            {
                foreach (var section in sections.EnumerateArray())
                {
                    if (section.TryGetProperty("fields", out var sectionFields))
                    {
                        foreach (var field in sectionFields.EnumerateArray())
                        {
                            if (field.TryGetProperty("id", out var fieldId))
                            {
                                fields[fieldId.GetString() ?? ""] = field;
                            }
                        }
                    }
                }
            }

            // Curate each response
            foreach (var response in responses)
            {
                var responseFields = new List<ResponseField>();
                
                if (!string.IsNullOrEmpty(response.ResponseData))
                {
                    var responseData = JsonDocument.Parse(response.ResponseData);
                    
                    foreach (var kvp in fields)
                    {
                        var fieldId = kvp.Key;
                        var fieldDefinition = kvp.Value;
                        
                        var responseField = new ResponseField
                        {
                            FieldId = fieldId,
                            Label = fieldDefinition.TryGetProperty("label", out var label) ? label.GetString() ?? "" : "",
                            Type = fieldDefinition.TryGetProperty("type", out var type) ? type.GetString() ?? "" : ""
                        };

                        // Get response value for this field
                        if (responseData.RootElement.TryGetProperty(fieldId, out var value))
                        {
                            responseField.Value = GetJsonElementValue(value);
                            responseField.DisplayValue = FormatDisplayValue(value, responseField.Type);
                        }
                        else
                        {
                            responseField.Value = null;
                            responseField.DisplayValue = "Not answered";
                        }

                        responseFields.Add(responseField);
                    }
                }

                response.Fields = responseFields;
            }
        }
        catch (JsonException)
        {
            // If schema parsing fails, return responses without field curation
        }
    }

    private object? GetJsonElementValue(JsonElement element)
    {
        return element.ValueKind switch
        {
            JsonValueKind.String => element.GetString(),
            JsonValueKind.Number => element.TryGetInt32(out var intValue) ? intValue : element.GetDouble(),
            JsonValueKind.True or JsonValueKind.False => element.GetBoolean(),
            JsonValueKind.Array => element.EnumerateArray().Select(GetJsonElementValue).ToArray(),
            JsonValueKind.Object => element.GetRawText(),
            JsonValueKind.Null => null,
            _ => element.GetRawText()
        };
    }

    private string FormatDisplayValue(JsonElement value, string fieldType)
    {
        if (value.ValueKind == JsonValueKind.Null)
        {
            return "Not answered";
        }

        return fieldType.ToLower() switch
        {
            "date" => value.ValueKind == JsonValueKind.String && DateTime.TryParse(value.GetString(), out var date) 
                ? date.ToString("MMM dd, yyyy") 
                : value.GetString() ?? "",
            "email" => value.GetString() ?? "",
            "phone" => value.GetString() ?? "",
            "select" or "radio" => value.GetString() ?? "",
            "checkbox" => value.ValueKind == JsonValueKind.Array 
                ? string.Join(", ", value.EnumerateArray().Select(x => x.GetString())) 
                : value.GetBoolean().ToString(),
            "file" => value.ValueKind == JsonValueKind.Array && value.GetArrayLength() > 0
                ? $"{value.GetArrayLength()} file(s) uploaded"
                : "No files",
            "number" => value.GetDouble().ToString(),
            _ => value.GetString() ?? value.GetRawText()
        };
    }

    private bool IsValidJsonData(string jsonData)
    {
        try
        {
            JsonDocument.Parse(jsonData);
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}
