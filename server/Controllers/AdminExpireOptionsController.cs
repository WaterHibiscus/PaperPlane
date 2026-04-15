using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using server.DTOs;
using server.Services;

namespace server.Controllers;

[ApiController]
[Authorize(Policy = AuthPolicies.AdminOnly)]
[Route("api/admin/expire-options")]
public class AdminExpireOptionsController(ExpireOptionSettingsService expireOptionSettingsService) : ControllerBase
{
    [HttpGet]
    public ActionResult<List<ExpireOptionResponse>> GetAll()
    {
        return expireOptionSettingsService.GetAll()
            .Select(ToResponse)
            .ToList();
    }

    [HttpPut]
    public async Task<ActionResult<List<ExpireOptionResponse>>> Update(
        [FromBody] UpdateExpireOptionsRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var input = (request.Items ?? [])
                .Select(item => new ExpireOptionItem
                {
                    Hours = item.Hours,
                    Label = item.Label,
                    SortOrder = item.SortOrder,
                    IsActive = item.IsActive
                })
                .ToList();

            var options = await expireOptionSettingsService.UpdateAsync(input, cancellationToken);
            return options.Select(ToResponse).ToList();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidDataException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (FileNotFoundException ex)
        {
            return Problem(title: "保存存活时间配置失败", detail: ex.Message);
        }
        catch (IOException ex)
        {
            return Problem(title: "保存存活时间配置失败", detail: ex.Message);
        }
    }

    private static ExpireOptionResponse ToResponse(ExpireOptionItem item)
    {
        return new ExpireOptionResponse(item.Hours, item.Label, item.SortOrder, item.IsActive);
    }
}
