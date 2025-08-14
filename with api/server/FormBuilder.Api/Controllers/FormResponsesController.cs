using FormBuilder.Api.Models;
using FormBuilder.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FormBuilder.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FormResponsesController : ControllerBase
{
    private readonly IFormResponseService _formResponseService;

    public FormResponsesController(IFormResponseService formResponseService)
    {
        _formResponseService = formResponseService;
    }

    /// <summary>
    /// Submit a form response
    /// </summary>
    [HttpPost("submit")]
    public async Task<ActionResult<Guid>> SubmitFormResponse([FromBody] SubmitFormRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var ipAddress = GetClientIpAddress();
            var userAgent = Request.Headers.UserAgent.ToString();

            var responseId = await _formResponseService.SubmitFormResponseAsync(request, ipAddress, userAgent);
            return Ok(new { id = responseId, message = "Form submitted successfully" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while submitting the form", error = ex.Message });
        }
    }

    /// <summary>
    /// Get paginated form responses with template curation
    /// </summary>
    [HttpGet("form/{formId}")]
    public async Task<ActionResult<PaginatedFormResponses>> GetFormResponses(
        Guid formId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string? submittedBy = null,
        [FromQuery] string sortBy = "SubmittedAt",
        [FromQuery] bool sortDescending = true)
    {
        try
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 10;

            var query = new FormResponseQuery
            {
                PageNumber = pageNumber,
                PageSize = pageSize,
                FromDate = fromDate,
                ToDate = toDate,
                SubmittedBy = submittedBy,
                SortBy = sortBy,
                SortDescending = sortDescending
            };

            var responses = await _formResponseService.GetFormResponsesAsync(formId, query);
            return Ok(responses);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving form responses", error = ex.Message });
        }
    }

    /// <summary>
    /// Get specific response by ID with template curation
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<FormResponseWithTemplate>> GetResponse(Guid id)
    {
        try
        {
            var response = await _formResponseService.GetResponseByIdAsync(id);
            if (response == null)
            {
                return NotFound(new { message = "Response not found" });
            }
            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving the response", error = ex.Message });
        }
    }

    /// <summary>
    /// Delete a form response
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteResponse(Guid id)
    {
        try
        {
            var deleted = await _formResponseService.DeleteResponseAsync(id);
            if (!deleted)
            {
                return NotFound(new { message = "Response not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while deleting the response", error = ex.Message });
        }
    }

    private string GetClientIpAddress()
    {
        // Check for various headers that might contain the real IP
        var ipAddress = Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(ipAddress))
        {
            // X-Forwarded-For can contain multiple IPs, take the first one
            ipAddress = ipAddress.Split(',')[0].Trim();
        }

        if (string.IsNullOrEmpty(ipAddress))
        {
            ipAddress = Request.Headers["X-Real-IP"].FirstOrDefault();
        }

        if (string.IsNullOrEmpty(ipAddress))
        {
            ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        }

        return ipAddress;
    }
}
