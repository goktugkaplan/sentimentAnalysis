namespace ChatApp.Domain.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string Nickname { get; set; } = string.Empty;
        public ICollection<Message> Messages { get; set; } = new List<Message>();
    }
}
