using FormBuilder.Api.Models;
using FormBuilder.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FormBuilder.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FormsController : ControllerBase
{
    private readonly IFormService _formService;

    public FormsController(IFormService formService)
    {
        _formService = formService;
    }

    /// <summary>
    /// Get list of all forms
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<FormListItem>>> GetAllForms()
    {
        try
        {
            var forms = await _formService.GetAllFormsAsync();
            return Ok(forms);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving forms", error = ex.Message });
        }
    }

    /// <summary>
    /// Get specific form by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<Form>> GetForm(Guid id)
    {
        try
        {
            var form = await _formService.GetFormByIdAsync(id);
            if (form == null)
            {
                return NotFound(new { message = "Form not found" });
            }
            return Ok(form);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving the form", error = ex.Message });
        }
    }

    /// <summary>
    /// Create a new form
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Guid>> CreateForm([FromBody] CreateFormRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var formId = await _formService.CreateFormAsync(request);
            return CreatedAtAction(nameof(GetForm), new { id = formId }, new { id = formId });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while creating the form", error = ex.Message });
        }
    }

    /// <summary>
    /// Update an existing form
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateForm(Guid id, [FromBody] UpdateFormRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var updated = await _formService.UpdateFormAsync(id, request);
            if (!updated)
            {
                return NotFound(new { message = "Form not found" });
            }

            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while updating the form", error = ex.Message });
        }
    }

    /// <summary>
    /// Delete a form
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteForm(Guid id)
    {
        try
        {
            var deleted = await _formService.DeleteFormAsync(id);
            if (!deleted)
            {
                return NotFound(new { message = "Form not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while deleting the form", error = ex.Message });
        }
    }

    /// <summary>
    /// Clone an existing form
    /// </summary>
    [HttpPost("{id}/clone")]
    public async Task<ActionResult<Guid>> CloneForm(Guid id, [FromBody] CloneFormRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var newFormId = await _formService.CloneFormAsync(id, request);
            return CreatedAtAction(nameof(GetForm), new { id = newFormId }, new { id = newFormId });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while cloning the form", error = ex.Message });
        }
    }
}
