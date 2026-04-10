namespace server.Models;

public class Comment
{
    public Guid Id { get; set; }
    public Guid PlaneId { get; set; }
    public Guid? ParentCommentId { get; set; }
    public string Reply { get; set; } = string.Empty;
    public string NickName { get; set; } = string.Empty;
    public DateTime CreateTime { get; set; }

    public Plane Plane { get; set; } = null!;
    public Comment? ParentComment { get; set; }
    public List<Comment> Replies { get; set; } = [];
}
