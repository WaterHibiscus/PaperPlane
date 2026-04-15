using Microsoft.AspNetCore.Mvc;
using server.DTOs;
using server.Services;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MoodsController(MoodSettingsService moodSettingsService) : ControllerBase
{
    [HttpGet]
    public ActionResult<List<MoodConfigItemResponse>> GetAll()
    {
        var items = moodSettingsService.GetActive()
            .Select(ToResponse)
            .ToList();

        return items;
    }

    private static MoodConfigItemResponse ToResponse(MoodSettingItem item)
    {
        return new MoodConfigItemResponse(
            item.Key,
            item.Label,
            item.IconUrl,
            item.Color,
            item.SortOrder,
            item.IsActive,
            item.IsCustom);
    }
}
