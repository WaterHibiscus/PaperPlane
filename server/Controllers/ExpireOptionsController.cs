using Microsoft.AspNetCore.Mvc;
using server.DTOs;
using server.Services;

namespace server.Controllers;

[ApiController]
[Route("api/expire-options")]
public class ExpireOptionsController(ExpireOptionSettingsService expireOptionSettingsService) : ControllerBase
{
    [HttpGet]
    public ActionResult<List<ExpireOptionResponse>> GetAll()
    {
        return expireOptionSettingsService.GetActive()
            .Select(ToResponse)
            .ToList();
    }

    private static ExpireOptionResponse ToResponse(ExpireOptionItem item)
    {
        return new ExpireOptionResponse(item.Hours, item.Label, item.SortOrder, item.IsActive);
    }
}
