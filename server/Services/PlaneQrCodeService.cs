using QRCoder;

namespace server.Services;

public class PlaneQrCodeService
{
    private const int PixelsPerModule = 12;

    public byte[] BuildPng(string payload)
    {
        var content = string.IsNullOrWhiteSpace(payload) ? string.Empty : payload.Trim().ToUpperInvariant();
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(content, QRCodeGenerator.ECCLevel.M);
        var pngQr = new PngByteQRCode(data);
        return pngQr.GetGraphic(PixelsPerModule);
    }

    public string BuildSvg(string payload)
    {
        var content = string.IsNullOrWhiteSpace(payload) ? string.Empty : payload.Trim().ToUpperInvariant();
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(content, QRCodeGenerator.ECCLevel.M);
        var svgQr = new SvgQRCode(data);
        return svgQr.GetGraphic(PixelsPerModule);
    }
}
