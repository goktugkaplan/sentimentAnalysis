using ChatApp.Domain.Entities;
using ChatApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Application.Services
{
    public class MessageService
    {
        private readonly AppDbContext _context;

        public MessageService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Message> AddMessageAsync(int userId, string text)
        {
            var message = new Message { UserId = userId, Text = text };
            _context.Messages.Add(message);
            await _context.SaveChangesAsync();
            return message;
        }

        public async Task<IEnumerable<Message>> GetAllAsync()
        {
            return await _context.Messages.Include(m => m.User).ToListAsync();
        }
    }
}
