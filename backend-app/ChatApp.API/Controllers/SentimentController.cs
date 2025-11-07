using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SentimentController : ControllerBase
    {
        private readonly HttpClient _httpClient;

        public SentimentController(IHttpClientFactory httpClientFactory)
        {
            _httpClient = httpClientFactory.CreateClient();
            // FastAPI servisin çalıştığı URL (örnek: http://localhost:7860)
            _httpClient.BaseAddress = new Uri("http://localhost:7860");
        }

        public class SentimentRequest
        {
            public string Text { get; set; } = "";
            public string Lang { get; set; } = "tr";
        }

        public class SentimentResponse
        {
            public Dictionary<string, double>? Probs { get; set; }
            public string? Label_Tr { get; set; }
            public string? Label_En { get; set; }
        }

        [HttpPost("analyze")]
        public async Task<IActionResult> Analyze([FromBody] SentimentRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Text))
                return BadRequest("Metin boş olamaz.");

            try
            {
                var response = await _httpClient.PostAsJsonAsync("/api/predict", request);
                response.EnsureSuccessStatusCode();

                var result = await response.Content.ReadFromJsonAsync<SentimentResponse>();
                return Ok(result);
            }
            catch (HttpRequestException ex)
            {
                return StatusCode(500, $"API isteği başarısız: {ex.Message}");
            }
        }
    }
}
