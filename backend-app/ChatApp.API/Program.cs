using ChatApp.Application.Services;
using ChatApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// SQLite bağlantısı
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=chatapp.db"));

// Servisler
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<MessageService>();

// IHttpClientFactory servisini ekle
builder.Services.AddHttpClient();

// CORS (React'tan gelen istekler için)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 🔹 Backend'i tüm IP'lerde dinleyecek şekilde ayarla
builder.WebHost.UseUrls("http://0.0.0.0:5115");

var app = builder.Build();

// 🔹 CORS middleware’i aktif et
app.UseCors("AllowAll");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

app.Run();
