namespace server.Services;

public class NicknameGenerator
{
    private static readonly string[] Prefixes =
    [
        "正在吃面的", "路过的", "偷偷摸鱼的", "在赶DDL的", "刚下课的",
        "准备考试的", "正在发呆的", "喝奶茶的", "刷手机的", "迷路的",
        "睡眼惺忪的", "元气满满的", "正在减肥的", "逃课中的", "背单词的",
        "找不到教室的", "在图书馆的", "刚跑完步的", "边走边吃的", "晒太阳的"
    ];

    private static readonly string[] Suffixes =
    [
        "学弟", "学姐", "同学", "考研党", "干饭人",
        "社恐人", "夜猫子", "卷王", "摆烂人", "显眼包",
        "小透明", "课代表", "学委", "舍长", "路人甲",
        "咸鱼", "打工人", "追星人", "技术宅", "文艺青年"
    ];

    public static string Generate()
    {
        var rng = Random.Shared;
        return Prefixes[rng.Next(Prefixes.Length)] + Suffixes[rng.Next(Suffixes.Length)];
    }
}
