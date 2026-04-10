using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using server.DTOs;
using server.Services;

namespace server.Controllers;

[ApiController]
[Authorize(Policy = AuthPolicies.AdminOnly)]
[Route("api/admin/home")]
public class AdminHomeController(HomeHeadlineSettingsService homeHeadlineSettingsService) : ControllerBase
{
    [HttpGet("headlines")]
    public ActionResult<HomeHeadlineResponse> GetHeadlines()
    {
        return new HomeHeadlineResponse(homeHeadlineSettingsService.GetCurrentPhrases());
    }

    [HttpPut("headlines")]
    public async Task<ActionResult<HomeHeadlineResponse>> UpdateHeadlines(
        [FromBody] UpdateHomeHeadlinesRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var phrases = await homeHeadlineSettingsService.UpdateAsync(request.Phrases, cancellationToken);
            return new HomeHeadlineResponse(phrases);
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
            return Problem(title: "保存首页轮动文案失败", detail: ex.Message);
        }
        catch (IOException ex)
        {
            return Problem(title: "保存首页轮动文案失败", detail: ex.Message);
        }
    }
}
