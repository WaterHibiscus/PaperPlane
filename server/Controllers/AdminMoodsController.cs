using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using server.DTOs;
using server.Services;

namespace server.Controllers;

[ApiController]
[Authorize(Policy = AuthPolicies.AdminOnly)]
[Route("api/admin/moods")]
public class AdminMoodsController(MoodSettingsService moodSettingsService) : ControllerBase
{
    [HttpGet]
    public ActionResult<List<MoodConfigItemResponse>> GetAll()
    {
        var items = moodSettingsService.GetAll()
            .Select(ToResponse)
            .ToList();

        return items;
    }

    [HttpPut]
    public async Task<ActionResult<List<MoodConfigItemResponse>>> Update(
        [FromBody] UpdateMoodConfigsRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var input = (request.Items ?? [])
                .Select(item => new MoodSettingItem
                {
                    Key = item.Key,
                    Label = item.Label,
                    IconUrl = item.IconUrl,
                    Color = item.Color ?? string.Empty,
                    SortOrder = item.SortOrder,
                    IsActive = item.IsActive,
                    IsCustom = item.IsCustom
                })
                .ToList();

            var items = await moodSettingsService.UpdateAsync(input, cancellationToken);
            return items.Select(ToResponse).ToList();
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
            return Problem(title: "\u4fdd\u5b58\u60c5\u7eea\u914d\u7f6e\u5931\u8d25", detail: ex.Message);
        }
        catch (IOException ex)
        {
            return Problem(title: "\u4fdd\u5b58\u60c5\u7eea\u914d\u7f6e\u5931\u8d25", detail: ex.Message);
        }
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
