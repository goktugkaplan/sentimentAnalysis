using ChatApp.Domain.Entities;
using ChatApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Application.Services
{
    public class UserService
    {
        private readonly AppDbContext _context;

        public UserService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<User?> RegisterAsync(string nickname)
        {
            if (await _context.Users.AnyAsync(u => u.Nickname == nickname))
                return null; // Aynı rumuz varsa kayıt olamaz

            var user = new User { Nickname = nickname };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<IEnumerable<User>> GetAllAsync() => await _context.Users.ToListAsync();
    }
}
