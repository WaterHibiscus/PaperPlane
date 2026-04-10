using Microsoft.AspNetCore.Mvc;
using server.DTOs;
using server.Services;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HomeController(HomeHeadlineSettingsService homeHeadlineSettingsService) : ControllerBase
{

    [HttpGet("headlines")]
    public ActionResult<HomeHeadlineResponse> GetHeadlines()
    {
        return new HomeHeadlineResponse(homeHeadlineSettingsService.GetCurrentPhrases());
    }
}
