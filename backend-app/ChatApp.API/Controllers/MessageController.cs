using ChatApp.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MessageController : ControllerBase
    {
        private readonly MessageService _messageService;

        public MessageController(MessageService messageService)
        {
            _messageService = messageService;
        }

        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] MessageRequest request)
        {
            var message = await _messageService.AddMessageAsync(request.UserId, request.Text);
            return Ok(message);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _messageService.GetAllAsync());
    }

    public record MessageRequest(int UserId, string Text);
}
