using ChatApp.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly UserService _userService;

        public UserController(UserService userService)
        {
            _userService = userService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] string nickname)
        {
            var user = await _userService.RegisterAsync(nickname);
            if (user == null)
                return BadRequest("Bu rumuz zaten kullanılıyor.");
            return Ok(user);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _userService.GetAllAsync());
    }
}
